import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  LevelModel,
  QuestionModel,
  QuestionsList,
  QuestionTypeModel,
  Skill,
  SkillLevel,
} from '@app/shared/models/commonmodel';
import { questionService } from '@app/shared/services/question.service';
import { SkillService } from '@app/shared/services/skill.service';
import { ToastrService } from 'ngx-toastr';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  fromEvent,
  map,
  of,
  startWith,
  tap,
} from 'rxjs';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { MatSelect } from '@angular/material/select';
import { Editor } from 'ngx-editor';
import { NodeType } from 'prosemirror-model';

interface Nodes {
  [key: string]: NodeType;
}

@Component({
  selector: 'app-addquestion',
  templateUrl: './addquestion.component.html',
  styleUrl: './addquestion.component.scss',
})
export class AddquestionComponent implements OnInit, OnDestroy {
  @ViewChild('singleSelect') singleSelect!: MatSelect;
  matchPairs: {
    left: string;
    right: string;
    leftEditor: Editor;
    rightEditor: Editor;
  }[] = [];

  private prevQuestionImages: string[] = [];
  private prevOption1Images: string[] = [];
  private prevOption2Images: string[] = [];
  private prevOption3Images: string[] = [];
  private prevOption4Images: string[] = [];

  editorQuestion!: Editor;
  editorOption1!: Editor;
  editorOption2!: Editor;
  editorOption3!: Editor;
  editorOption4!: Editor;
  toolbar: any = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['upload_image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  html = '';
  perpage: any = 10;
  pageSize: any = 1;
  isFetchingMore: boolean = false;
  loggedInUser!: ApplicationUser;
  options: string[] = ['Option A', 'Option B', 'Option C', 'Option D'];
  booloptions: string[] = ['Option A', 'Option B'];
  questionId: any;
  levels: LevelModel[] = [];
  questionTypes: QuestionTypeModel[] = [];
  selectedQuestion: any;
  edit: boolean = false;
  optionError: boolean = false;
  isLoading: boolean = false;
  UserSkills: Skill[] = [];
  isActive: any;
  marks = new FormControl('', [Validators.required]);
  SkillId: any;
  selectedSkill!: Skill;
  selectedSkillLevel!: LevelModel;
  selectedQuestiontype!: QuestionTypeModel;
  organizationJobs: any;
  IsQuestionImage: boolean = false;
  IsCodingQuestion: boolean = false;
  SkillFilter = new FormControl('', Validators.required);
  skillLevelfilter = new FormControl('', Validators.required);
  questiontypefilter = new FormControl();
  correctanswer = new FormControl('', [Validators.required]);
  multicorrectanswer = new FormControl<string[]>([], [Validators.required]);
  filterskills: any;
  filterskillLevels: any;
  filterquestionTypes: any;
  IsBooleanQuestion: boolean = false;
  editorModel = {
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
  };

  isMatchType: boolean = false;
  matchEditorContent: string = '';
  isMultiselect: boolean = false;
  isMultipleChoice: boolean = false;

  constructor(
    private questionservice: questionService,
    private location: Location,
    private toaster: ToastrService,
    private skillservice: SkillService,
    private title: Title,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    this.selectedQuestion = this.route.snapshot.params['id'];
    if (this.selectedQuestion !== undefined || this.selectedQuestion != null) {
      this.edit = true;
      this.title.setTitle('Edit Question');
    } else {
      this.edit = false;
      this.title.setTitle('Add Question');
    }
  }

  ngOnInit() {
    const orgName = this.route.snapshot.paramMap.get('organisationUniqueName');
    const orgId = this.route.snapshot.paramMap.get('organizationId');
    const skillId = this.route.snapshot.paramMap.get('skillId');
    const levelId = this.route.snapshot.paramMap.get('levelId');
    if (orgId !== null) {
      if (
        orgName !== this.loggedInUser.organizationName ||
        this.loggedInUser.organizationId !== orgId
      ) {
        this.router.navigate(['/unauthorized']);
      }
    }
    this.addPair();
    this.editorQuestion = new Editor();
    (this.editorQuestion as any).label = 'Question';
    this.editorOption1 = new Editor();
    (this.editorOption1 as any).label = 'Option1';
    this.editorOption2 = new Editor();
    this.editorOption3 = new Editor();
    this.editorOption4 = new Editor();
    this.getallquestionsdetails();
    this.fetchSkills();
    // this.prefillSkillAndLevel(skillId, levelId);
  }

  private prefillSkillAndLevel(skillId: string | null, levelId: string | null) {
    this.isLoading = true;
    if (!skillId || !levelId) return;

    // Disable the fields so user can’t change them
    this.SkillFilter.disable();
    this.skillLevelfilter.disable();

    // ✅ Fetch the specific skill details from the API
    this.skillservice
      .getAllOrganizationSkill(
        this.loggedInUser.organizationId,
        this.loggedInUser.applicationUserId,
        '',
        skillId
      )
      .subscribe((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          const skill = res[0]; // You get exactly what you showed in your example
          this.UserSkills = [skill]; // Store if needed elsewhere
          this.filterskills = of(this.UserSkills);
          this.selectedSkill = this.UserSkills.find(
            (s) => s.chasmaNOVOSkillId === skillId
          )!;

          this.cdr.detectChanges();
        }

        // ✅ Pre-select the level (already loaded)
        const level = this.levels.find((l) => l.levelId === levelId);
        if (level) {
          this.selectedSkillLevel = level;
          this.skillLevelfilter.setValue(level.levelValue);
        }

        setTimeout(() => this.cdr.detectChanges(), 100);
      });
    this.isLoading = false;
  }

  addPair() {
    this.matchPairs.push({
      left: '',
      right: '',
      leftEditor: new Editor(),
      rightEditor: new Editor(),
    });
  }

  removePair(index: number) {
    this.matchPairs[index].leftEditor.destroy();
    this.matchPairs[index].rightEditor.destroy();
    this.matchPairs.splice(index, 1);
  }

  ngOnDestroy(): void {
    this.matchPairs.forEach((p) => {
      p.leftEditor.destroy();
      p.rightEditor.destroy();
    });
    this.editorQuestion.destroy();
    this.editorOption1.destroy();
    this.editorOption2.destroy();
    this.editorOption3.destroy();
    this.editorOption4.destroy();
  }

  // fetchSkills() {
  //   this.SkillFilter.valueChanges.pipe(
  //     debounceTime(300),
  //     tap((searchText: string) => {
  //       this.pageSize = 1; // Reset pagination on new search
  //       this.isFetchingMore = true;
  //       this.skillservice.getAllOrganizationSkill(
  //         this.loggedInUser.organizationId,
  //         "", "", "", this.pageSize, this.perpage, searchText
  //       ).subscribe({
  //         next: (res) => {
  //           this.UserSkills = res;
  //           this.isFetchingMore = false;
  //           this.filterskills = of(this.UserSkills); // update observable
  //         },
  //         error: () => {
  //           this.toaster.error("Failed to search skills");
  //           this.isFetchingMore = false;
  //         }
  //       });
  //     })
  //   ).subscribe();
  // }

  async onFileSelected(editor: Editor, event: any) {
    const view = (editor as any).view;
    const file: File = event.target.files[0];
    if (file) {
      const view = (editor as any).view;
      const pos = view?.state.selection.from; // store cursor position
      try {
        const url = await this.uploadImage(file); // return url from upload; no editor param here
        this.insertImageAtCursor(editor, url, pos);
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }
  }

  uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.questionservice.uploadImage(file).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            resolve(res.data); // image URL
          } else {
            this.toaster.error('Image upload failed');
            reject('Upload failed');
          }
        },
        error: (err) => {
          this.toaster.error('Image upload failed');
          reject(err);
        },
      });
    });
  }

  insertImageAtCursor(editor: Editor, url: string, pos?: number) {
    const view = (editor as any).view;
    if (!view) {
      console.error('Editor view not available');
      return;
    }
    view.focus();
    const { state, dispatch } = view;
    const { schema, selection } = state;
    const imageNode = schema.nodes['image'].create({ src: url });
    const insertPos = pos ?? state.selection.from;
    const transaction = state.tr.insert(insertPos, imageNode);
    view.dispatch(transaction);
  }

  fetchSkills() {
    this.SkillFilter.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value): value is string => typeof value === 'string'),
        tap((searchText: string) => {
          this.pageSize = 1;
          this.isFetchingMore = true;

          this.skillservice
            .getAllOrganizationSkill(
              this.loggedInUser.organizationId,
              '',
              '',
              '',
              this.pageSize,
              this.perpage,
              searchText
            )
            .subscribe({
              next: (res) => {
                this.UserSkills = res;
                if (
                  this.selectedSkill &&
                  !this.UserSkills.some(
                    (skill) =>
                      skill.chasmaNOVOSkillId ===
                      this.selectedSkill.chasmaNOVOSkillId
                  )
                ) {
                  this.UserSkills = [this.selectedSkill, ...this.UserSkills];
                }

                this.filterskills = of(this.UserSkills);
                this.isFetchingMore = false;
              },
              error: () => {
                this.toaster.error('Failed to search skills');
                this.isFetchingMore = false;
              },
            });
        })
      )
      .subscribe();
  }

  onDropdownOpen(opened: boolean) {
    if (opened) {
      const searchText = this.SkillFilter.value;
      if (searchText && searchText.trim().length > 0) {
        this.loadMoreSkills();
      }
      const panel = document.querySelector(
        '.custom-select-panel'
      ) as HTMLElement;
      if (panel) {
        fromEvent(panel, 'scroll')
          .pipe(
            debounceTime(200),
            filter(() => {
              const threshold = 150;
              const position = panel.scrollTop + panel.offsetHeight;
              return (
                panel.scrollHeight - position <= threshold &&
                !this.isFetchingMore
              );
            })
          )
          .subscribe(() => this.loadMoreSkills());
      }
    }
  }

  loadMoreSkills() {
    if (this.isFetchingMore) return;

    const searchText = (this.SkillFilter.value || '').trim();
    this.isFetchingMore = true;
    this.pageSize++;

    this.skillservice
      .getAllOrganizationSkill(
        this.loggedInUser.organizationId,
        '',
        '',
        '',
        this.pageSize,
        this.perpage,
        searchText
      )
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            const ids = new Set(
              this.UserSkills.map((s) => s.chasmaNOVOSkillId)
            );
            const newSkills = res.filter(
              (skill) => !ids.has(skill.chasmaNOVOSkillId)
            );

            this.UserSkills = [...this.UserSkills, ...newSkills];
            this.filterskills = of(this.UserSkills);
          } else {
            this.pageSize--; // No more data available
          }
          this.isFetchingMore = false;
        },
        error: () => {
          this.toaster.error('Error loading more skills.');
          this.isFetchingMore = false;
        },
      });
  }

  getallquestionsdetails() {
    const skillId = this.route.snapshot.paramMap.get('skillId');
    const levelId = this.route.snapshot.paramMap.get('levelId');
    this.isLoading = true;
    forkJoin({
      questiontypes: this.questionservice.getAllquestionTypes(),
      skillList: this.skillservice.getAllOrganizationSkill(
        this.loggedInUser.organizationId,
        '',
        '',
        '',
        this.pageSize,
        this.perpage
      ),
      skillLevellist: this.skillservice.getskillLevels(
        this.loggedInUser.applicationUserId
      ),
    })
      .pipe(
        tap(({ questiontypes, skillList, skillLevellist }) => {
          this.getQuestionTypes(questiontypes);
          this.getOrgSkills(skillList);
          this.getSkillLevels(skillLevellist);
          if (skillId != undefined || levelId != undefined) {
            this.prefillSkillAndLevel(skillId, levelId);
          }

          if (this.edit) {
            this.getquestiondetails(this.selectedQuestion);
          }
        }),
        concatMap((res) => {
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        error: (err) => {
          this.isLoading = false;
          this.toaster.error('An unexpected error occurred.');
        },
      });
  }

  // getquestiondetails(questionId: string) {
  //   this.isLoading = true;
  //   this.questionservice.getquestionById(questionId).subscribe({
  //     next: (res) => {
  //       if (res) {
  //         this.skillservice
  //           .getAllOrganizationSkill(
  //             this.loggedInUser.organizationId,
  //             '',
  //             '',
  //             res.skillId,
  //             this.pageSize,
  //             this.perpage,
  //             ''
  //           )
  //           .subscribe((Userres) => {
  //             this.UserSkills = Userres;
  //             this.filterskills = of(
  //               Userres.filter(
  //                 (skill) => skill.chasmaNOVOSkillId === res.skillId
  //               )
  //             );
  //             this.selectedQuestiontype = this.questionTypes.find(
  //               (type) => type.questionTypeId == res.questionType
  //             )!;
  //             this.selectedSkill = this.UserSkills.find(
  //               (x) => x.chasmaNOVOSkillId == res.skillId
  //             )!;
  //             this.selectedSkillLevel = this.levels.find(
  //               (x) => x.levelId == res.skillLevelId
  //             )!;
  //             const correctoption = this.mapCorrectAnswerToOption(res);
  //             this.correctanswer.patchValue(correctoption);
  //             this.marks.patchValue(res.marks);
  //             this.isActive = res.isActive;
  //             // this.negativeMarks.patchValue(res.negativeMarks);
  //             this.questionId = res.questionId;
  //             // if (this.selectedQuestiontype.questionType == 'Multiple Choice' ||
  //             //   this.selectedQuestiontype.questionType == 'Multiselect Type' ||
  //             //   this.selectedQuestiontype.questionType == 'Match Type') {
  //             //   this.IsBooleanQuestion = false;
  //             //   this.editorModel.question = res.question;
  //             //   this.editorModel.option1 = res.option1;
  //             //   this.editorModel.option2 = res.option2;
  //             //   this.editorModel.option3 = res.option3;
  //             //   this.editorModel.option4 = res.option4;
  //             // } else {
  //             //   this.IsBooleanQuestion = true;
  //             //   this.editorModel.question = res.question;
  //             //   this.editorModel.option1 = res.option1;
  //             //   this.editorModel.option2 = res.option2;
  //             // }
  //             if (this.selectedQuestiontype.questionType == 'Multiple Choice') {
  //               this.IsBooleanQuestion = false;
  //               this.isMatchType = false;
  //               this.isMultiselect = false;

  //               this.editorModel.question = res.question;
  //               this.editorModel.option1 = res.option1;
  //               this.editorModel.option2 = res.option2;
  //               this.editorModel.option3 = res.option3;
  //               this.editorModel.option4 = res.option4;

  //             } else if (this.selectedQuestiontype.questionType == 'Multiselect Type') {
  //               this.isMultiselect = true;
  //               this.IsBooleanQuestion = false;
  //               this.isMatchType = false;

  //               this.editorModel.question = res.question;
  //               this.editorModel.option1 = res.option1;
  //               this.editorModel.option2 = res.option2;
  //               this.editorModel.option3 = res.option3;
  //               this.editorModel.option4 = res.option4;
  //               // restore correct answers into array

  //             } else if (this.selectedQuestiontype.questionType == 'Match Type') {
  //               this.isMatchType = true;
  //               this.IsBooleanQuestion = false;
  //               this.isMultiselect = false;

  //               this.editorModel.question = res.question;

  //             } else {
  //               // Boolean type
  //               this.IsBooleanQuestion = true;
  //               this.isMatchType = false;
  //               this.isMultiselect = false;

  //               this.editorModel.question = res.question;
  //               this.editorModel.option1 = res.option1;
  //               this.editorModel.option2 = res.option2;
  //             }
  //           });
  //         this.isLoading = false;
  //       }
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //     },
  //   });
  // }
  getquestiondetails(questionId: string) {
    this.isLoading = true;
    this.questionservice.getquestionById(questionId).subscribe({
      next: (res) => {
        if (res) {
          this.skillservice
            .getAllOrganizationSkill(
              this.loggedInUser.organizationId,
              '',
              '',
              res.skillId,
              this.pageSize,
              this.perpage,
              ''
            )
            .subscribe((Userres) => {
              this.UserSkills = Userres;
              this.filterskills = of(
                Userres.filter(
                  (skill) => skill.chasmaNOVOSkillId === res.skillId
                )
              );

              this.selectedQuestiontype = this.questionTypes.find(
                (type) => type.questionTypeId == res.questionType
              )!;
              this.selectedSkill = this.UserSkills.find(
                (x) => x.chasmaNOVOSkillId == res.skillId
              )!;
              this.selectedSkillLevel = this.levels.find(
                (x) => x.levelId == res.skillLevelId
              )!;

              this.marks.patchValue(res.marks);
              this.isActive = res.isActive;
              this.questionId = res.questionId;

              if (
                this.selectedQuestiontype.questionType === 'Multiple Choice'
              ) {
                this.isMultipleChoice = true;

                this.editorModel.question = res.question;
                this.editorModel.option1 = res.option1;
                this.editorModel.option2 = res.option2;
                this.editorModel.option3 = res.option3;
                this.editorModel.option4 = res.option4;

                const correctoption = this.mapCorrectAnswerToOption(res);
                this.correctanswer.patchValue(correctoption);
              } else if (
                this.selectedQuestiontype.questionType === 'Multiselect Type'
              ) {
                this.isMultiselect = true;

                this.editorModel.question = res.question;
                this.editorModel.option1 = res.option1;
                this.editorModel.option2 = res.option2;
                this.editorModel.option3 = res.option3;
                this.editorModel.option4 = res.option4;

                const correctoptions = this.mapCorrectAnswerToOption(
                  res,
                  true
                ) as string[];
                this.multicorrectanswer.patchValue(correctoptions);
              } else if (
                this.selectedQuestiontype.questionType === 'Match Type'
              ) {
                this.isMatchType = true;

                const questionObj = JSON.parse(res.question);
                this.editorModel.question = questionObj.question;
                this.matchPairs = questionObj.pairs.map((pair: any) => ({
                  left: pair.left,
                  right: pair.right,
                  leftEditor: new Editor(),
                  rightEditor: new Editor(),
                }));
                this.editorModel.option1 = res.option1;
                this.editorModel.option2 = res.option2;
                this.editorModel.option3 = res.option3;
                this.editorModel.option4 = res.option4;
                const correctoption = this.mapCorrectAnswerToOption(res);
                this.correctanswer.patchValue(correctoption);
              } else {
                // Boolean type
                this.IsBooleanQuestion = true;

                this.editorModel.question = res.question;
                this.editorModel.option1 = res.option1;
                this.editorModel.option2 = res.option2;

                const correctoption = this.mapCorrectAnswerToOption(res);
                this.correctanswer.patchValue(correctoption);
              }
            });

          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  getSkillLevels(res: SkillLevel[]) {
    if (res) {
      this.levels = res;
      const desiredOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      this.levels = res.sort((a, b) => {
        return (
          desiredOrder.indexOf(a.levelValue) -
          desiredOrder.indexOf(b.levelValue)
        );
      });
    }
    this.filterskillLevels = this.skillLevelfilter.valueChanges.pipe(
      startWith(''),
      map((level) =>
        level ? this._filterskillslevels(level) : this.levels.slice()
      )
    );
  }

  private _filterskillslevels(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.levels.filter((l) =>
      l.levelValue.toLowerCase().includes(filterValue)
    );
  }

  onLevelValueChanged(level: LevelModel) {
    this.selectedSkillLevel = this.levels.find(
      (s) => s.levelId === level.levelId
    )!;
  }

  getQuestionTypes(res: QuestionTypeModel[]) {
    if (res) {
      this.questionTypes = res;
    }
    this.filterquestionTypes = this.questiontypefilter.valueChanges.pipe(
      startWith(''),
      map((type) =>
        type ? this._filterquestiontypes(type) : this.questionTypes.slice()
      )
    );
  }

  private _filterquestiontypes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.questionTypes.filter((s) =>
      s.questionType.toLowerCase().includes(filterValue)
    );
  }

  resetEditorModel() {
    this.editorModel = {
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
    };
    this.correctanswer.reset();
    this.multicorrectanswer.reset();
    this.marks.reset();
    this.matchPairs = [];
  }

  onQuestionTypeValueChanged(item: QuestionTypeModel) {
    this.selectedQuestiontype = this.questionTypes.find(
      (s) => s.questionTypeId === item.questionTypeId
    )!;

    this.resetEditorModel();

    if (this.selectedQuestiontype.questionType == 'Match Type') {
      this.isMatchType = true;
      this.IsBooleanQuestion = false;
      this.isMultiselect = false;
      this.isMultipleChoice = false;
    } else if (this.selectedQuestiontype.questionType == 'Multiselect Type') {
      this.isMultiselect = true;
      this.IsBooleanQuestion = false;
      this.isMatchType = false;
      this.isMultipleChoice = false;
    } else if (this.selectedQuestiontype.questionType == 'Boolean Type') {
      this.IsBooleanQuestion = true;
      this.isMatchType = false;
      this.isMultiselect = false;
      this.isMultipleChoice = false;
    } else {
      this.isMultipleChoice = true;
      this.IsBooleanQuestion = false;
      this.isMatchType = false;
      this.isMultiselect = false;
    }
  }

  getOrgSkills(res: Skill[]) {
    if (res) {
      this.UserSkills = res;
      this.filterskills = of(this.UserSkills);
    }
  }

  onSkillValueChanged(skill: Skill) {
    this.selectedSkill = this.UserSkills.find(
      (s) => s.chasmaNOVOSkillId === skill.chasmaNOVOSkillId
    )!;
  }

  getCharFromIndex(i: number): string {
    return String.fromCharCode(65 + i);
  }

  cleanMatchValue(value: string): string {
    if (!value) return value;

    return value

      .replace(/^\d+\.\s*/, '')
      .replace(/^[A-Za-z]\.\s*/, '')

      .replace(/<p>\s*\d+\.\s*<\/p>/gi, '')
      .replace(/<p>\s*[A-Za-z]\.\s*<\/p>/gi, '')

      .replace(/<p>\s*\d+\.\s*(?=<\/p>)/gi, '')
      .replace(/<p>\s*[A-Za-z]\.\s*(?=<\/p>)/gi, '');
  }

  addquestion() {
    this.optionsCheck();
    if (this.optionError == false) {
      var data: QuestionModel = <QuestionModel>{};
      this.isLoading = true;
      let correctAnswer: string | string[];
      if (this.isMultiselect) {
        correctAnswer = this.optionselection(this.multicorrectanswer);
      } else {
        correctAnswer = this.optionselection(this.correctanswer);
      }

      if (this.isMatchType) {
        // const questionObj = {
        //   question: this.editorModel.question,
        //   pairs: this.matchPairs.map((pair, index) => ({
        //     left: `${index + 1}. ${pair.left}`,
        //     right: `${String.fromCharCode(65 + index)}. ${pair.right}`
        //   })),
        // };
        // data.question = JSON.stringify(questionObj);
        const cleanedPairs = this.matchPairs.map((pair, index) => {
          const cleanLeft = this.cleanMatchValue(pair.left);
          const cleanRight = this.cleanMatchValue(pair.right);

          return {
            left: `${index + 1}. ${cleanLeft}`,
            right: `${String.fromCharCode(65 + index)}. ${cleanRight}`,
          };
        });

        const questionObj = {
          question: this.editorModel.question,
          pairs: cleanedPairs,
        };

        data.question = JSON.stringify(questionObj);
      } else {
        data.question = this.editorModel.question;
      }
      data.option1 = this.editorModel.option1;
      data.option2 = this.editorModel.option2;
      data.option3 = this.editorModel.option3;
      data.option4 = this.editorModel.option4;
      data.correctAnswer = correctAnswer.toString();
      data.skillId = this.selectedSkill.chasmaNOVOSkillId;
      data.levelId = this.selectedSkillLevel.levelId;
      data.questiontypeId = this.selectedQuestiontype.questionTypeId;
      data.marks = this.marks.value;
      data.isActive = this.isActive;
      data.orgId = this.loggedInUser.organizationId;
      // data.negativeMarks = this.negativeMarks.value != null ? this.negativeMarks.value : 0;
      if (this.edit) {
        data.questionId = this.questionId;
        this.questionservice.updatequestion(data).subscribe({
          next: (res) => {
            this.display(res);
          },
          error: (err) => {
            this.toaster.error('Question update failed');
          },
        });
      } else {
        this.questionservice.addquestion(data).subscribe({
          next: (res) => {
            this.display(res);
          },
          error: (err) => {
            this.toaster.error('Question update failed');
          },
        });
      }
    }
    this.isLoading = false;
  }

  // Utility function to strip HTML tags
  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    const decodedString = div.innerText || ''; // Extract plain text

    // Optional: Replace any remaining encoded spaces like &#160;
    return decodedString.replace(/&#160;/g, ' ').trim();
  }

  // optionsCheck() {
  //   if (!this.IsBooleanQuestion) {
  //     if (
  //       this.editorModel.option1 != '' &&
  //       this.editorModel.option2 != '' &&
  //       this.editorModel.option3 != '' &&
  //       this.editorModel.option4 != ''
  //     ) {
  //       if (
  //         this.editorModel.option1 == this.editorModel.option2 ||
  //         this.editorModel.option1 == this.editorModel.option3 ||
  //         this.editorModel.option1 == this.editorModel.option4 ||
  //         this.editorModel.option2 == this.editorModel.option3 ||
  //         this.editorModel.option2 == this.editorModel.option4 ||
  //         this.editorModel.option3 == this.editorModel.option4
  //       ) {
  //         this.optionError = true;
  //         this.toaster.error(
  //           ' One of the option is matching. Make sure that none of the options should match'
  //         );
  //       } else {
  //         this.optionError = false;
  //       }
  //     }
  //   } else {
  //     if (this.editorModel.option1 != '' && this.editorModel.option2 != '') {
  //       if (
  //         this.editorModel.option1 == this.editorModel.option2 ||
  //         this.editorModel.option2 == this.editorModel.option1
  //       ) {
  //         this.optionError = true;
  //         this.toaster.error(
  //           ' One of the option is matching. Make sure that none of the options should match'
  //         );
  //       } else {
  //         this.optionError = false;
  //       }
  //     }
  //   }
  // }

  // optionselection(data: any) {
  //   var selectionoption: string;
  //   if (data.value == 'Option A') {
  //     selectionoption = this.editorModel.option1;
  //   } else if (data.value == 'Option B') {
  //     selectionoption = this.editorModel.option2;
  //   } else if (data.value == 'Option C') {
  //     selectionoption = this.editorModel.option3;
  //   } else {
  //     selectionoption = this.editorModel.option4;
  //   }
  //   return selectionoption;
  // }
  optionsCheck() {
    if (this.isMatchType) {
      // For Match Type, skip option duplication check
      this.optionError = false;
      return;
    }

    if (this.isMultiselect || (!this.IsBooleanQuestion && !this.isMatchType)) {
      // For Multiselect and Multiple Choice → 4 options must be non-empty and unique
      if (
        this.editorModel.option1 &&
        this.editorModel.option2 &&
        this.editorModel.option3 &&
        this.editorModel.option4
      ) {
        if (
          this.editorModel.option1 === this.editorModel.option2 ||
          this.editorModel.option1 === this.editorModel.option3 ||
          this.editorModel.option1 === this.editorModel.option4 ||
          this.editorModel.option2 === this.editorModel.option3 ||
          this.editorModel.option2 === this.editorModel.option4 ||
          this.editorModel.option3 === this.editorModel.option4
        ) {
          this.optionError = true;
          this.toaster.error(
            'One of the options is matching. Make sure that none of the options should match'
          );
        } else {
          this.optionError = false;
        }
      }
    } else if (this.IsBooleanQuestion) {
      // For Boolean Type → only 2 options
      if (this.editorModel.option1 && this.editorModel.option2) {
        if (this.editorModel.option1 === this.editorModel.option2) {
          this.optionError = true;
          this.toaster.error(
            'Both options are the same. Boolean question must have distinct values'
          );
        } else {
          this.optionError = false;
        }
      }
    }
  }

  optionselection(data: any) {
    if (Array.isArray(data.value)) {
      // Multi select case
      return data.value
        .map((val: string) => {
          if (val === 'Option A') return this.editorModel.option1;
          if (val === 'Option B') return this.editorModel.option2;
          if (val === 'Option C') return this.editorModel.option3;
          if (val === 'Option D') return this.editorModel.option4;
          return '';
        })
        .filter((v: string) => v) // remove empty values if any
        .join(' | ');
    } else {
      // Single select case
      if (data.value === 'Option A') return this.editorModel.option1;
      if (data.value === 'Option B') return this.editorModel.option2;
      if (data.value === 'Option C') return this.editorModel.option3;
      if (data.value === 'Option D') return this.editorModel.option4;
      return '';
    }
  }

  mapCorrectAnswerToOption(res: QuestionsList, isMultiselect: true): string[];
  mapCorrectAnswerToOption(res: QuestionsList, isMultiselect?: false): string;
  mapCorrectAnswerToOption(
    res: QuestionsList,
    isMultiselect = false
  ): string | string[] {
    const correctAnswer = res.correctAnswer;

    if (isMultiselect && correctAnswer) {
      const answers = correctAnswer.split('|').map((a) => a.trim());
      const result: string[] = [];

      if (answers.includes(res.option1)) result.push('Option A');
      if (answers.includes(res.option2)) result.push('Option B');
      if (answers.includes(res.option3)) result.push('Option C');
      if (answers.includes(res.option4)) result.push('Option D');

      return result;
    }

    if (correctAnswer === res.option1) return 'Option A';
    if (correctAnswer === res.option2) return 'Option B';
    if (correctAnswer === res.option3) return 'Option C';
    if (correctAnswer === res.option4) return 'Option D';
    return '';
  }

  display(data: any) {
    if (data.isSuccess) {
      this.toaster.success(data.message);
      this.location.back();
    } else this.toaster.error(data.message);
  }

  extractImageSrcs(html: string): string[] {
    const div = document.createElement('div');
    div.innerHTML = html;
    return Array.from(div.querySelectorAll('img')).map((img) => img.src);
  }

  onChange(field: string) {
    let prev: string[], current: string[], html: string;

    if (field === 'question') {
      html = this.editorModel.question;
      prev = this.prevQuestionImages;
      current = this.extractImageSrcs(html);
      this.prevQuestionImages = current;
    } else if (field === 'option1') {
      html = this.editorModel.option1;
      prev = this.prevOption1Images;
      current = this.extractImageSrcs(html);
      this.prevOption1Images = current;
    } else if (field === 'option2') {
      html = this.editorModel.option2;
      prev = this.prevOption2Images;
      current = this.extractImageSrcs(html);
      this.prevOption2Images = current;
    } else if (field === 'option3') {
      html = this.editorModel.option3;
      prev = this.prevOption3Images;
      current = this.extractImageSrcs(html);
      this.prevOption3Images = current;
    } else if (field === 'option4') {
      html = this.editorModel.option4;
      prev = this.prevOption4Images;
      current = this.extractImageSrcs(html);
      this.prevOption4Images = current;
    } else {
      return; // Add support for match pairs if needed
    }

    const deletedImages = (prev || []).filter(
      (src) => !(current || []).includes(src)
    );
    deletedImages.forEach((src) => this.deleteImageFromBackend(src));
  }

  deleteImageFromBackend(src: string) {
    this.questionservice.deleteImage(src).subscribe({
      next: () => {},
      error: () => this.toaster.error('Failed to delete image from backend'),
    });
  }

  back() {
    this.location.back();
  }

  disabledButton() {
    const leghthMulti = (this.multicorrectanswer.value ?? []).length > 0;
    if (this.isMatchType) {
      if (
        !this.editorModel.question ||
        !this.editorModel.option1 ||
        !this.editorModel.option2 ||
        !this.editorModel.option3 ||
        !this.editorModel.option4 ||
        !this.matchPairs.length ||
        this.matchPairs.some((pair) => !pair.left || !pair.right) || // No empty fields
        !this.selectedSkill ||
        !this.selectedSkillLevel ||
        !this.selectedQuestiontype
      ) {
        return true;
      }
      return false;
    }

    if (this.isMultiselect) {
      if (
        !this.editorModel.question ||
        !this.editorModel.option1 ||
        !this.editorModel.option2 ||
        !this.editorModel.option3 ||
        !this.editorModel.option4 ||
        !leghthMulti ||
        !this.selectedSkill ||
        !this.selectedSkillLevel ||
        !this.selectedQuestiontype
      ) {
        return true;
      }
      return false;
    }
    if (!this.IsBooleanQuestion) {
      if (
        !this.editorModel.question ||
        !this.editorModel.option1 ||
        !this.editorModel.option2 ||
        !this.editorModel.option3 ||
        !this.editorModel.option4 ||
        !this.selectedSkill ||
        !this.selectedSkillLevel ||
        !this.selectedQuestiontype
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      if (
        !this.editorModel.question ||
        !this.editorModel.option1 ||
        !this.editorModel.option2 ||
        !this.selectedSkill ||
        !this.selectedSkillLevel ||
        !this.selectedQuestiontype
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
}
