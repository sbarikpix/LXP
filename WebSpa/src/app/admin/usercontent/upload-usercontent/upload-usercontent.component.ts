import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import {
  ApplicationUser,
  LevelModel,
  Skill,
  SkillLevel,
  UserContentCommand,
} from '@app/shared/models/commonmodel';
import { SkillService } from '@app/shared/services/skill.service';
import {
  UserContentResponse,
  UserContentService,
} from '@app/shared/services/usercontent.service';
import { ToastrService } from 'ngx-toastr';
import { concatMap, forkJoin, map, of, startWith, tap } from 'rxjs';

@Component({
  selector: 'app-upload-usercontent',
  templateUrl: './upload-usercontent.component.html',
  styleUrl: './upload-usercontent.component.scss',
})
export class UploadUsercontentComponent implements OnInit {
  uploadForm: FormGroup;
  selectedTab: number = 0;
  selectedFile: File | null = null;
  selectedImage: any;
  fileError: string = '';
  isEditMode: boolean = false;

  skills: string[] = ['JavaScript', 'Angular', 'React', 'Python', 'C#'];
  skillLevels: string[] = ['Beginner', 'Intermediate', 'Advanced'];
  loggedInUser!: ApplicationUser;
  UserSkills: Skill[] = [];
  SkillFilter = new FormControl();
  skillLevelfilter = new FormControl();
  filterskills: any;
  filterskillLevels: any;
  selectedSkill!: Skill;
  selectedSkillLevel!: LevelModel;
  levels: SkillLevel[] = [];
  contentId?: string;

  loading: boolean = false;
  selectedSkillId: string = '';
  selectedSkillLevelId: string = '';
  pageSize: number = 1;
  skillsPerPage: number = 10;
  allSkills: any[] = [];
  searchText: string = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UploadUsercontentComponent>,
    private toaster: ToastrService,
    private skillservice: SkillService,
    private contentservice: UserContentService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.contentId = data.userContentId;
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      webUrl: [
        '',
        [
          Validators.pattern(
            /^(https?:\/\/)?([\w\d-]+\.)*[\w\d-]+\.[a-z]{2,6}([\/\w\d.-]*)*(\?[\w\d-]+(=[\w\d-]+)?(&[\w\d-]+(=[\w\d-]+)?)*)?\/?$/
          ),
        ],
      ],
      selectedSkill: ['', Validators.required],
      selectedSkillLevel: ['', Validators.required],
    });
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
  }
  @ViewChildren('fileInput') fileInput!: QueryList<ElementRef>;

  ngOnInit() {
    if (this.contentId) {
      this.fetchContentForEdit(this.contentId);
      this.isEditMode = true;
    } else {
      this.getallskills();
    }
    this.toggleEditableFields();
  }

  fetchContentForEdit(contentId: string) {
    this.loading = true;
    this.contentservice
      .getusercontent(this.loggedInUser.organizationId, contentId)
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res) {
            this.populateFormForEdit(res[0]); // Pre-populate the form with the first content in the array
          }
        },
        error: (err) => {
          this.loading = false;
          this.toaster.error('Failed to fetch content for editing.');
        },
      });
  }

  toggleEditableFields() {
    if (this.isEditMode) {
      // Disable all fields except for Title, Description, and Thumbnail
      this.uploadForm.get('webUrl')?.disable();
      this.uploadForm.get('selectedSkill')?.disable();
      this.uploadForm.get('selectedSkillLevel')?.disable();
    } else {
      // Enable all fields when not in edit mode (i.e., creating a new record)
      this.uploadForm.get('webUrl')?.enable();
      this.uploadForm.get('selectedSkill')?.enable();
      this.uploadForm.get('selectedSkillLevel')?.enable();
    }
  }

  populateFormForEdit(content: UserContentResponse) {
    this.uploadForm.patchValue({
      title: content.title,
      description: content.description,
      webUrl: content.contentPath,
      selectedSkill: content.skillName, // Directly bind skill name
      selectedSkillLevel: content.levelName, // Directly bind level name
      thumbnail: content.thumbnail,
    });
  }

  getallskills(pageSize?: number, skillsPerPage?: number, searchText?: string) {
    //this.loading = true;
    const page = pageSize ?? this.pageSize;
    const perPage = skillsPerPage ?? this.skillsPerPage;
    const searchInput = searchText ?? this.searchText;
    forkJoin({
      skillList: this.skillservice.getAllOrganizationSkill(
        this.loggedInUser.organizationId,
        '',
        '',
        '',
        page,
        perPage,
        searchInput
      ),
      skillLevellist: this.skillservice.getskillLevels(
        this.loggedInUser.applicationUserId
      ),
    })
      .pipe(
        tap(({ skillList, skillLevellist }) => {
          const existingSkillNames = new Set(
            this.allSkills.map((skill) => skill.name)
          );
          const newSkills = skillList.filter(
            (skill) => !existingSkillNames.has(skill.name)
          );
          this.allSkills = [...this.allSkills, ...newSkills];
          this.filterskills = this.allSkills;
          this.getOrgSkills(this.allSkills);
          this.getSkillLevels(skillLevellist);
        }),
        concatMap((res) => {
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        error: (err) => {
          this.loading = false;
          this.toaster.error('An unexpected error occurred.');
        },
      });
  }

  getOrgSkills(res: Skill[]) {
    if (res) {
      this.UserSkills = res;
    }
    this.filterskills = of(this.UserSkills); // no further filtering
  }

  // private _filterskills(value: string): any[] {
  //   const filterValue = value.toLowerCase();
  //   return this.UserSkills.filter((s) =>
  //     s.name.toLowerCase().includes(filterValue)
  //   );
  // }

  onSkillValueChanged(skill: Skill) {
    this.selectedSkill = this.UserSkills.find(
      (s) => s.chasmaNOVOSkillId === skill.chasmaNOVOSkillId
    )!;
    this.uploadForm.patchValue({
      selectedSkill: this.selectedSkill.name,
    });
    this.selectedSkillId = this.selectedSkill.chasmaNOVOSkillId;
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
    this.uploadForm.patchValue({
      selectedSkillLevel: this.selectedSkillLevel.levelValue,
    });
    this.selectedSkillLevelId = this.selectedSkillLevel.levelId;
  }

  tabChange(event: any) {
    this.selectedTab = event.index;
    this.searchText = '';
    this.pageSize = 1;
    this.getallskills(this.pageSize, this.skillsPerPage, this.searchText);

    // Only reset form if you're in create mode (not edit mode)
    if (!this.isEditMode) {
      this.uploadForm.reset();
      this.uploadForm.patchValue({
        selectedSkill: null,
        selectedSkillLevel: null,
      });
      this.selectedFile = null;
      this.selectedImage = null;
    }
    // Reset all file inputs
    this.fileInput.forEach((input) => (input.nativeElement.value = ''));
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSizeMB = 100;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/x-msvideo',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.fileError = 'Only PDFs, DOCs, MP4, AVI, and TXT files are allowed.';
      this.selectedFile = null;
    } else if (file.size > maxSizeMB * 1024 * 1024) {
      this.fileError = `File size should be less than ${maxSizeMB} MB.`;
      this.selectedFile = null;
    } else {
      this.fileError = '';
      this.selectedFile = file;
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      const thumbnailError = `Thumbnail must be less than ${maxSizeMB} MB.`;
      this.toaster.error(thumbnailError);
      this.selectedImage = null;
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      this.selectedImage = reader.result as string;
    };

    reader.onerror = (error) => {
      console.error('Error converting image to Base64:', error);
    };
  }

  isFormValid(): boolean {
    if (this.selectedTab === 0) {
      return (
        this.uploadForm.valid && !this.uploadForm.controls['webUrl'].errors
      );
    } else {
      return this.uploadForm.valid && this.selectedFile !== null;
    }
  }

  submitSmartCard() {
    if (!this.isFormValid()) return;

    const command: UserContentCommand = {
      userContentId: this.contentId,
      title: this.uploadForm.value.title,
      description: this.uploadForm.value.description,
      skillId: this.selectedSkillId,
      levelId: this.selectedSkillLevelId,
      userId: this.loggedInUser.applicationUserId,
      organizationId: this.loggedInUser.organizationId,
      thumbnail: this.selectedImage,
    };

    if (this.selectedTab === 0) {
      command.webURL = this.uploadForm.value.webUrl;
    } else {
      command.file = this.selectedFile;
    }
    this.loading = true;
    this.contentservice.uploadusercontent(command).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.toaster.success(res.message);
          this.dialogRef.close(res);
          this.loading = false;
        }
        this.loading = false;
      },
      error: (err) => {
        let errmsg = err.error['UserContent'];
        this.toaster.error(errmsg);
        this.loading = false;
      },
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  updateContent() {
    const updateContent: UserContentCommand = {
      userId: this.loggedInUser.applicationUserId,
      userContentId: this.contentId,
      organizationId: this.loggedInUser.organizationId,
      skillId: this.uploadForm.value.selectedSkill,
      levelId: this.uploadForm.value.selectedSkillLevel,
      title: this.uploadForm.controls['title'].value,
      description: this.uploadForm.controls['description'].value,
      thumbnail: this.selectedImage,
    };

    this.contentservice.editcontent(updateContent).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.toaster.success(res.message); // Show success message
          this.dialogRef.close(res); // Close the dialog on success
        }
      },
      error: (err) => {
        console.error('Error updating content:', err);
        this.toaster.error('Failed to update content'); // Show error message
      },
    });
  }

  onDropDownScroll(): void {
    this.pageSize++;
    this.getallskills(this.pageSize, this.skillsPerPage, this.searchText);
  }
  onSearchInput(event: Event): void {
    const target = (event.target as HTMLInputElement).value;
    const searchText = target.toLowerCase();
    this.pageSize = 1;
    this.allSkills = [];
    this.searchText = searchText;
    if (searchText) {
      this.getallskills(this.pageSize, this.skillsPerPage, searchText);
    }
  }
}
