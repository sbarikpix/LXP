import { Platform } from '@angular/cdk/platform';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepper } from '@angular/material/stepper';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  badgeCriteria,
  badgesdata,
  JobTitle,
  learningJourneyByIdResponse,
  learningJourneyResponse,
  LevelModel,
  Skill,
} from '@app/shared/models/commonmodel';
import { JobTitleService } from '@app/shared/services/job-title.service';
import {
  learningJourneyCommand,
  LearningjourneyService,
} from '@app/shared/services/learningjourney.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserBadgeServiceService } from '@app/shared/services/userBadgeService.service';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  concatMap,
  debounceTime,
  forkJoin,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
@Component({
  selector: 'app-createlearningjourney',
  templateUrl: './createlearningjourney.component.html',
  styleUrl: './createlearningjourney.component.scss',
})
export class CreatelearningjourneyComponent implements OnInit, AfterViewInit {
  loggedInUser!: ApplicationUser;
  jobTitles: JobTitle[] = [];
  isLoading: boolean = false;
  combinedBadges: any[] = [];
  public skillPerPage = 10;
  private allSkillsLoaded = false;
  public JobsPerPage = 10;
  private alljobsLoaded = false;
  public pageSize = 1;
  searchText: string = '';
  chasmaNOVOJobSetId: string = '';
  allbadges: badgesdata[] = [];
  badgeCriteria: badgeCriteria[] = [];
  selectedJobTitle: any;
  filteredJobTitles = new BehaviorSubject<JobTitle[]>([]);
  selectedSkills: Array<{
    name: string;
    level: string;
    levelId: string;
    skillid: string;
  }> = [];
  allSkills: any[] = [];
  filteredSkills = new BehaviorSubject<Skill[]>([]);
  LevelList: LevelModel[] = [];
  settingsFormGroup!: FormGroup;
  skillsFormGroup!: FormGroup;
  isEditable: boolean = true;
  learningjourneyId: any;
  journeydetails: learningJourneyByIdResponse[] = [];
  isEditMode: boolean = false;
  originalSectionsCount: number = 0;
  isMobile: boolean = false;
  currentStepIndex: number = 0;

  constructor(
    private _formBuilder: FormBuilder,
    private skillservice: SkillService,
    private jobService: JobTitleService,
    private toaster: ToastrService,
    private learningservice: LearningjourneyService,
    private route: ActivatedRoute,
    private title: Title,
    private platform: Platform
  ) {
    this.skillsFormGroup = this._formBuilder.group({
      sections: this._formBuilder.array([]),
    });

    this.route.paramMap.subscribe({
      next: (res) => {
        this.learningjourneyId = res.get('journeyId');
        if (this.learningjourneyId) {
          this.title.setTitle('Edit Journey');
        } else {
          this.title.setTitle('Create Journey');
        }
      },
    });
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.isMobile) {
        this.onStepSelection({ selectedIndex: 0 });
      }
    }, 0);
  }

  selectedFileName: string = '';
  isStepCompleted: boolean = false;
  @ViewChild(MatStepper) stepper!: MatStepper;

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }

    this.settingsFormGroup = this._formBuilder.group({
      journeyTitle: ['', Validators.required],
      description: [''],
      jobTitleId: ['', Validators.required],
      thumbnail: [''],
    });

    this.skillsFormGroup = this._formBuilder.group({
      sections: this._formBuilder.array([]),
    });
    // this.chasmaNOVOJobSetId =
    //   this.loggedInUser.jobTitleId != null
    //     ? this.loggedInUser.jobTitleId
    //     : '';

    if (this.learningjourneyId) {
      this.getlearningdetails(this.learningjourneyId);
    } else {
      this.getorganizationJobTitle(
        this.loggedInUser.organizationId,
        this.chasmaNOVOJobSetId,
        this.JobsPerPage,
        this.pageSize,
        this.searchText
      );
    }
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  get sections(): FormArray {
    return this.skillsFormGroup.get('sections') as FormArray;
  }

  getlearningdetails(learningjourneyId: any) {
    this.isLoading = true;
    this.isEditMode = true;
    this.learningservice
      .getuserlearningJourneydetails(learningjourneyId, '')
      .subscribe({
        next: (res) => {
          this.journeydetails = res;
          if (res && res.length > 0) {
            const journey = res[0];
            this.originalSectionsCount = res.length;
            this.settingsFormGroup.patchValue({
              journeyTitle: journey.learningJourneyTitle,
              description: journey.learningJourneyDescription,
              thumbnail: journey.learningJourneyImage || 'No Thumbnail',
              jobTitleId: journey.learningJourneyJobTitleId,
            });
            this.chasmaNOVOJobSetId = journey.learningJourneyJobTitleId;
            this.getorganizationJobTitle(
              this.loggedInUser.organizationId,
              this.chasmaNOVOJobSetId,
              this.JobsPerPage,
              this.pageSize,
              this.searchText
            );
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  populateSections(modules: learningJourneyByIdResponse[]) {
    // Clear existing sections
    while (this.sections.length) {
      this.sections.removeAt(0);
    }
    modules.forEach((module) => {
      const section = this._formBuilder.group({
        sectionTitle: [
          {
            value: module.learningJourneyModuleTitle,
            disabled: this.isEditMode,
          },
          Validators.required,
        ],
        selectedSkill: [
          { value: module.skillName, disabled: this.isEditMode },
          Validators.required,
        ],
        selectedSkillId: [module.skillId, Validators.required],
        subSections: this._formBuilder.array([]),
      });

      this.sections.push(section);

      // Add subsections
      const subSections = this.getSubSections(this.sections.length - 1);
      module.getLearningJourneySubModuleResponses.forEach((subModule: any) => {
        const subSection = this._formBuilder.group({
          subSectionTitle: [
            {
              value: subModule.learningJourneySubModuleName,
              disabled: this.isEditMode,
            },
            Validators.required,
          ],
          level: [
            { value: subModule.levelName, disabled: true },
            Validators.required,
          ],
          levelId: [subModule.levelId],
        });
        subSections.push(subSection);
      });
    });
  }

  getorganizationJobTitle(
    organizationId: string,
    chasmaNOVOJobSetId: string,
    JobsPerPage: number,
    pageSize: number,
    searchText: string
  ) {
    this.selectedJobTitle = '';
    this.jobService
      .getAllOrganizationJobTitle(
        organizationId,
        chasmaNOVOJobSetId,
        JobsPerPage,
        pageSize,
        searchText
      )
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.jobTitles = [
              ...this.jobTitles,
              ...res.filter(
                (newJob) =>
                  !this.jobTitles.some(
                    (existingJob) =>
                      existingJob.chasmaNOVOJobTitleId ===
                      newJob.chasmaNOVOJobTitleId
                  )
              ),
            ]; // Append results
            this.filteredJobTitles.next(this.jobTitles);

            if (!this.selectedJobTitle) {
              const userJob = this.jobTitles.find(
                (x) =>
                  x.chasmaNOVOJobTitleId === this.loggedInUser.jobTitleId ||
                  this.chasmaNOVOJobSetId
              );
              if (userJob) {
                this.onJobTitleChange(userJob.name);
              }
            }
            if (res && res.length < this.JobsPerPage) {
              this.alljobsLoaded = true;
            }
          } else {
            this.alljobsLoaded = true;
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error fetching job titles:', err);
          this.isLoading = false;
        },
      });
  }

  onJobTitleChange(event: any): void {
    this.filteredJobTitles.pipe(take(1)).subscribe((jobTitles: JobTitle[]) => {
      const selectedJob = jobTitles.find(
        (job) => job.name === event || job.chasmaNOVOJobTitleId === event
      );
      if (selectedJob) {
        this.selectedJobTitle = selectedJob.chasmaNOVOJobTitleId;
        this.chasmaNOVOJobSetId = selectedJob.chasmaNOVOJobTitleId;
        this.selectedSkills = [];
        this.skillsFormGroup.reset();
        this.allSkills = [];
        this.filteredSkills.next([]);
        this.allSkillsLoaded = false;
        this.pageSize = 1;
        this.selectedJobTitle = selectedJob.name;
        this.settingsFormGroup.get('jobTitleId')?.setValue(selectedJob.name);
        this.fetchSkills(
          this.chasmaNOVOJobSetId,
          this.skillPerPage,
          this.pageSize,
          (this.searchText = '')
        );
        this.getSkillLevels();
        if (this.journeydetails.length && this.learningjourneyId) {
          this.populateSections(this.journeydetails);
        }
      }
    });
  }

  fetchSkills(
    jobTitleId: string,
    skillsperpage: number,
    pageSize: number,
    searchText: string
  ): void {
    this.skillservice
      .getAllSkills(jobTitleId, skillsperpage, pageSize, searchText)
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.allSkills = [...this.allSkills, ...res];
            this.filteredSkills.next(this.allSkills);
            if (res.length < this.skillPerPage) {
              this.allSkillsLoaded = true;
            }
          } else {
            this.filteredSkills.next([]);
            this.allSkillsLoaded = true;
          }
        },
        error: () => {
          console.error('Error fetching skills');
          return of([]);
        },
      });
  }

  getSkillLevels() {
    this.skillservice
      .getskillLevels(this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          const desiredOrder = [
            'Beginner',
            'Intermediate',
            'Advanced',
            'Expert',
          ];
          this.LevelList = res.sort((a, b) => {
            return (
              desiredOrder.indexOf(a.levelValue) -
              desiredOrder.indexOf(b.levelValue)
            );
          });
        },
      });
  }

  onDropdownScroll(type: 'jobTitles' | 'skills'): void {
    // Trigger fetching when scrolled to the bottom

    if (type === 'skills' && !this.allSkillsLoaded) {
      this.pageSize++;
      this.fetchSkills(
        this.chasmaNOVOJobSetId,
        this.skillPerPage,
        this.pageSize,
        this.searchText
      );
    } else if (type === 'jobTitles' && !this.alljobsLoaded) {
      this.pageSize++;
      this.getorganizationJobTitle(
        this.loggedInUser.organizationId,
        this.chasmaNOVOJobSetId,
        this.JobsPerPage,
        this.pageSize,
        this.searchText
      ); // Fetch more job titles when scrolled to the bottom
    }
  }

  onSearchInput(event: Event, type: 'job' | 'skill'): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchText = input;
    this.pageSize = 1;
    if (type === 'job') {
      this.selectedJobTitle = '';
      this.chasmaNOVOJobSetId = '';
      this.jobTitles = [];
      this.alljobsLoaded = false;
      this.filteredJobTitles.next([]);
      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() => {
            // Return the observable from fetchJobTitles
            return this.jobService.getAllOrganizationJobTitle(
              this.loggedInUser.organizationId,
              this.chasmaNOVOJobSetId,
              this.JobsPerPage,
              this.pageSize,
              this.searchText
            );
          })
        )
        .subscribe({
          next: (res) => {
            if (res && res.length > 0) {
              this.jobTitles = [...res];
              this.filteredJobTitles.next(this.jobTitles);
              if (res.length < this.JobsPerPage) {
                this.alljobsLoaded = true; // Mark as loaded if less than a full page is returned
              }
            } else {
              this.filteredJobTitles.next([]);
              this.alljobsLoaded = true;
            }
          },
          error: (err) => {
            console.error('Error fetching job titles:', err);
          },
        });
    } else if (type === 'skill') {
      this.allSkills = [];
      this.pageSize = 1;
      this.allSkillsLoaded = false;
      this.filteredSkills.next([]);

      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() =>
            this.skillservice.getAllSkills(
              this.chasmaNOVOJobSetId,
              this.skillPerPage,
              this.pageSize,
              this.searchText
            )
          )
        )
        .subscribe({
          next: (res) => {
            if (res && res.length > 0) {
              this.allSkills = [...res];
              this.filteredSkills.next(this.allSkills);
              this.allSkillsLoaded = res.length < this.skillPerPage;
              // this.allSkillsLoaded=true;
            } else {
              this.filteredSkills.next([]);
              this.allSkillsLoaded = true;
            }
          },
          error: (err) => {
            console.error('Error fetching skills:', err);
          },
        });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    // Check file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      this.toaster.info('File size should not exceed 15MB');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      this.toaster.info('Only JPEG and PNG images are allowed');
      return;
    }
    this.selectedFileName = file.name;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      this.settingsFormGroup.get('thumbnail')?.setValue(base64String);
    };
    reader.onerror = (error) => {
      console.error('Error converting image to Base64:', error);
      this.settingsFormGroup.get('thumbnail')?.setValue(null);
    };
  }

  addSection() {
    const section = this._formBuilder.group({
      sectionTitle: ['', Validators.required],
      selectedSkill: ['', Validators.required],
      selectedSkillId: ['', Validators.required],
      subSections: this._formBuilder.array([]),
    });

    this.sections.push(section);
  }

  removeSection(index: number) {
    if (this.isEditMode && index < this.originalSectionsCount) {
      this.toaster.warning('Cannot remove original sections in edit mode');
      return;
    }
    this.sections.removeAt(index);
  }

  getSubSections(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('subSections') as FormArray;
  }

  onSkillSelect(skill: Skill, sectionIndex: number) {
    if (this.isSkillAlreadySelected(skill.chasmaNOVOSkillId)) {
      this.toaster.error(
        'This skill has already been selected in another section!'
      );
      return;
    }

    const subSections = this.getSubSections(sectionIndex);
    subSections.clear();
    const section = this.sections.at(sectionIndex) as FormGroup;
    section.get('selectedSkill')?.setValue(skill.name);
    section.get('selectedSkillId')?.setValue(skill.chasmaNOVOSkillId);

    this.LevelList.forEach((level) => {
      const subSection = this._formBuilder.group({
        subSectionTitle: [
          `${skill.name} - ${level.levelValue}`,
          Validators.required,
        ],
        level: [level.levelValue, Validators.required],
        levelId: [level.levelId],
        skillId: [skill.chasmaNOVOSkillId],
      });
      subSections.push(subSection);
      subSection.controls['level'].disable();
    });
  }

  submitForm() {
    if (this.settingsFormGroup.valid && this.skillsFormGroup.valid) {
      const formData = this.settingsFormGroup.getRawValue(); // Use getRawValue() to get disabled fields
      const sectionsData = this.skillsFormGroup.getRawValue().sections;

      const command: learningJourneyCommand = {
        learningJourneyId: this.isEditMode ? this.learningjourneyId : '',
        learningJourneyTitle: formData.journeyTitle,
        learningJourneyDescription: formData.description,
        learningJourneyImage: formData.thumbnail,
        jobTitleId: this.chasmaNOVOJobSetId,
        organizationId: this.loggedInUser.organizationId,
        journeyModules: sectionsData.map((section: any) => ({
          moduleTitle: section.sectionTitle,
          skillId: section.selectedSkillId,
          journeySubModules: section.subSections.map((sub: any) => ({
            subModuleTitle: sub.subSectionTitle,
            levelId: sub.levelId,
          })),
        })),
      };
      this.isLoading = true;

      const apiCall = this.isEditMode
        ? this.learningservice.updatelearningJourney(command)
        : this.learningservice.addlearningJourney(command);

      apiCall.subscribe({
        next: (res) => {
          if (res.isSuccess) {
            const message = this.isEditMode
              ? 'Learning Journey Updated Successfully'
              : 'Learning Journey Created Successfully';
            this.toaster.success(message);
            this.isLoading = false;
            this.isEditable = false;
            window.history.back();
          } else {
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.toaster.error(err.error.LearningJourney || 'An error occurred');
          if (err.error.LearningJourney?.length > 0) {
            this.settingsFormGroup
              .get('journeyTitle')
              ?.setErrors({ journeyExists: true });
            this.settingsFormGroup.get('journeyTitle')?.markAsTouched();
          }
        },
      });
    } else {
      this.markFormGroupTouched(this.settingsFormGroup);
      this.markFormGroupTouched(this.skillsFormGroup);
    }
  }

  isSkillAlreadySelected(skillId: string): boolean {
    return this.sections.controls.some((section) => {
      const selectedSkillId = section.get('selectedSkillId')?.value;
      return selectedSkillId === skillId;
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
  onNext() {
    if (this.settingsFormGroup.valid) {
      this.isStepCompleted = true;
      this.stepper.next();
    } else {
      this.settingsFormGroup.markAllAsTouched();
      this.isStepCompleted = false;
    }
  }

  cancel() {
    this.settingsFormGroup.reset();
    window.history.back();
  }
  onStepSelection(event: any) {
    this.currentStepIndex = event.selectedIndex;
    const steps = document.querySelectorAll('.mat-step-header');

    if (!steps || steps.length === 0) return; // Prevent undefined

    steps.forEach((step, index) => {
      const stepElement = step as HTMLElement;
      if (this.isMobile) {
        // Hide all labels except the currently selected one
        if (index === this.currentStepIndex) {
          stepElement.classList.remove('hidden-label');
        } else {
          stepElement.classList.add('hidden-label');
        }
      } else {
        // On desktop, always show labels
        stepElement.classList.remove('hidden-label');
      }
    });
  }
}
