import { Component, ElementRef, viewChild, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  ApplicationUser,
  JobTitle,
  Skill,
  SkillLevel,
} from '@app/shared/models/commonmodel';
import { JobTitleService } from '@app/shared/services/job-title.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserBadgeServiceService } from '@app/shared/services/userBadgeService.service';
import { ToastrService } from 'ngx-toastr';
import { validateHeaderValue } from 'node:http';
import { BehaviorSubject, debounceTime, of, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'app-add-badge-dialog',
  templateUrl: './add-badge-dialog.component.html',
  styleUrl: './add-badge-dialog.component.scss',
})
export class AddBadgeDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<AddBadgeDialogComponent>,
    private jobTitleService: JobTitleService,
    private skillService: SkillService,
    private _formBuilder: FormBuilder,
    private toaster: ToastrService,
    private badgeCriteria: UserBadgeServiceService
  ) {}
  public skillPerPage = 10;
  private allSkillsLoaded = false;
  isLoadingSkills: boolean = false;
  isLoading: boolean = false;

  public JobsPerPage = 10;
  private alljobsLoaded = false;
  selectJobTitle: string = '';
  jobTitles: JobTitle[] = [];
  chasmaNOVOJobSetId: string = '';
  filteredJobTitles = new BehaviorSubject<JobTitle[]>([]);

  public skillSize = 1;
  public jobSize = 1;
  searchText: string = '';

  BadgeFormGroup = this._formBuilder.group({
    badgeName: ['', Validators.required],
    badgeDescription: ['', Validators.required],
    jobTitle: ['', Validators.required],
  });

  skillsFormGroup = this._formBuilder.group({
    skills: [''],
    level: [''],
  });

  allSkills: any[] = [];
  filteredSkills = new BehaviorSubject<Skill[]>([]);
  selectedSkills: Array<{
    name: string;
    level: string;
    levelId: string;
    skillid: string;
  }> = [];
  userSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];

  userId: string = '';
  orgId: string = '';
  loggedInUser!: ApplicationUser;
  LevelList: SkillLevel[] = [];
  skills: string[] = [];
  selectedJobTitle: string = '';
  selectedFile: File | null = null;
  errMessage: string = '';
  maxFileSizeMB = 2; // 2 MB
  allowedTypes = ['image/png', 'image/jpeg'];
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  @ViewChild('autoJobTitles') autoJobTitles!: MatAutocomplete;
  @ViewChild('autoSkills') autoSkills!: MatAutocomplete;
  imagePreview: string | ArrayBuffer | null = null;

  isFetchingJobs: boolean = false;
  isFetchingSkills: boolean = false;

  ngOnInit(): void {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
      this.userId = this.loggedInUser.applicationUserId;
      this.orgId = this.loggedInUser.organizationId;
    } else if (userData) {
      this.loggedInUser = JSON.parse(userData);
      this.userId = this.loggedInUser.applicationUserId;
      this.orgId = this.loggedInUser.organizationId;
    }
    this.fetchJobTitles(
      this.orgId,
      this.chasmaNOVOJobSetId,
      this.JobsPerPage,
      this.jobSize,
      this.searchText
    );
  }

  onDrop(event: any) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (this.isValidFile(file)) {
      if (file.size <= 4194304) {
        this.selectedFile = file;
        this.errMessage = '';
      } else {
        this.errMessage = 'Please upload an image of maximum size 4 MB';
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.errMessage = 'Only PNG and JPEG images are allowed.';
      this.imagePreview = '';
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isValidFile(file)) {
        if (this.isFileSizeValid(file)) {
          this.selectedFile = file;
          this.errMessage = '';

          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreview = reader.result;
          };
          reader.readAsDataURL(file);
        } else {
          this.errMessage = `Image size should not exceed ${this.maxFileSizeMB} MB.`;
        }
      } else {
        this.errMessage = 'Only PNG and JPEG images are allowed.';
      }
    }
  }

  isValidFile(file: File): boolean {
    return this.allowedTypes.includes(file.type);
  }

  isFileSizeValid(file: File): boolean {
    const maxSizeInBytes = this.maxFileSizeMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  formatBytes(bytes: number) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  cancelFileSelection() {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
      this.imagePreview = '';
    }
  }

  closeUploader() {
    this.dialogRef.close('');
  }

  onSearchInput(event: Event, type: 'job' | 'skill'): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchText = input;
    this.jobSize = 1;
    this.skillSize = 1;
    if (type === 'job') {
      this.chasmaNOVOJobSetId = '';
      this.jobTitles = [];
      this.alljobsLoaded = false;
      this.filteredJobTitles.next([]);
      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() => {
            return this.jobTitleService.getAllOrganizationJobTitle(
              this.orgId,
              this.chasmaNOVOJobSetId,
              this.JobsPerPage,
              this.jobSize,
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
                this.alljobsLoaded = true;
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
      if (!this.selectedJobTitle) {
        return;
      }

      this.allSkills = [];
      this.allSkillsLoaded = false;
      this.filteredSkills.next([]);

      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() =>
            this.skillService.getAllSkills(
              this.chasmaNOVOJobSetId,
              this.skillPerPage,
              this.skillSize,
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

  onJobTitleChange(event: any): void {
    this.searchText = '';
    this.filteredJobTitles.pipe(take(1)).subscribe((jobTitles: JobTitle[]) => {
      const selectedJob = jobTitles.find((job) => job.name === event);
      if (selectedJob) {
        this.selectedJobTitle = selectedJob.chasmaNOVOJobTitleId;
        this.chasmaNOVOJobSetId = selectedJob.chasmaNOVOJobTitleId;
        this.selectedSkills = [];
        this.skillsFormGroup.reset();
        this.allSkills = [];
        this.filteredSkills.next([]);
        this.allSkillsLoaded = false;
        this.skillSize = 1;
        this.selectedJobTitle = selectedJob.name;
        this.BadgeFormGroup.get('jobTitle')?.setValue(selectedJob.name);
        this.isLoadingSkills = true;
        this.fetchSkills(
          this.chasmaNOVOJobSetId,
          this.skillPerPage,
          this.skillSize,
          this.searchText
        );
        this.getSkillLevels();
      }
    });
  }

  fetchSkills(
    jobTitleId: string,
    skillsperpage: number,
    pageSize: number,
    searchText: string
  ): void {
    this.skillService
      .getAllSkills(jobTitleId, skillsperpage, pageSize, searchText)
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.allSkills = [...this.allSkills, ...res];
            this.filteredSkills.next(this.allSkills);
            this.isLoadingSkills = false;
            if (res.length < this.skillPerPage) {
              this.allSkillsLoaded = true;
            }
          } else {
            this.filteredSkills.next([]);
            this.allSkillsLoaded = true;
          }
          this.isFetchingSkills = false;
        },
        error: () => {
          console.error('Error fetching skills');
          this.isFetchingSkills = false;
          return of([]);
        },
      });
  }

  getSkillLevels() {
    this.skillService.getskillLevels(this.userId).subscribe({
      next: (res) => {
        const desiredOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
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
    if (type === 'skills' && !this.allSkillsLoaded && !this.isFetchingSkills) {
      this.isFetchingSkills = true;
      this.skillSize++;
      this.fetchSkills(
        this.chasmaNOVOJobSetId,
        this.skillPerPage,
        this.skillSize,
        this.searchText
      );
    } else if (
      type === 'jobTitles' &&
      !this.alljobsLoaded &&
      !this.isFetchingJobs
    ) {
      this.isFetchingJobs = true;
      this.jobSize++;
      this.fetchJobTitles(
        this.orgId,
        this.chasmaNOVOJobSetId,
        this.JobsPerPage,
        this.jobSize,
        this.searchText
      );
    }
  }
  fetchJobTitles(
    orgId: string,
    organisationJobId: string,
    JobsPerPage: number,
    pageSize: number,
    searchText: string
  ): void {
    this.selectedJobTitle = '';
    this.jobTitleService
      .getAllOrganizationJobTitle(
        orgId,
        organisationJobId,
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

            if (res && res.length < this.JobsPerPage) {
              this.alljobsLoaded = true;
            }
          } else {
            this.alljobsLoaded = true;
          }
          this.isFetchingJobs = false;
        },
        error: (err) => {
          console.error('Error fetching job titles:', err);
          this.isFetchingJobs = false;
        },
      });
  }

  addSkills(): void {
    const skill = this.skillsFormGroup.get('skills')?.value;
    const level = this.skillsFormGroup.get('level')?.value;
    if (skill || typeof skill == 'string') {
      this.skills.push(skill);
    }
    if (this.selectedSkills.find((i) => i.name === skill)) {
      this.skillsFormGroup.get('skills')?.setErrors({ alreadyAdded: true });
    }
    if (skill && level && !this.selectedSkills.find((i) => i.name === skill)) {
      const skillId = this.allSkills.find(
        (x) => x.name === skill
      )?.chasmaNOVOSkillId;
      const skillLevel = this.LevelList.find((x) => x.levelValue === level);
      if (skillId && skillLevel) {
        this.selectedSkills.push({
          name: skill,
          level: skillLevel.levelValue,
          levelId: skillLevel.levelId,
          skillid: skillId,
        });
        this.skillsFormGroup.get('skills')?.setValue('');
      } else {
        console.error('Skill ID or Level not found.');
      }
    }
    this.allSkills = [];
    this.allSkillsLoaded = false;
    this.fetchSkills(
      this.chasmaNOVOJobSetId,
      this.skillPerPage,
      this.skillSize,
      (this.searchText = '')
    );
  }

  onLevelChange(event: any): void {
    const selectedLevel = event.value;
    this.selectedSkills = [];
    this.skillsFormGroup.get('level')?.setValue(selectedLevel);
  }

  onSubmit(): void {
    if (this.BadgeFormGroup.valid && this.selectedSkills.length > 0) {
      const selectedJobTitleName = this.BadgeFormGroup.get('jobTitle')?.value;
      const selectedJob = this.jobTitles.find(
        (job) => job.name === selectedJobTitleName
      );
      const jobTitleId = selectedJob ? selectedJob.chasmaNOVOJobTitleId : '';
      const requestBody = {
        BadgeCriteriaId: '',
        OrganizationId: this.orgId,
        ApplicationUserId: this.userId,
        ChasmaNOVOJobTitleId: jobTitleId,
        BadgeName: this.BadgeFormGroup.get('badgeName')?.value,
        BadgeDescription: this.BadgeFormGroup.get('badgeDescription')?.value,
        BadgeImage: this.imagePreview,
        skillCriteria: this.selectedSkills.map((skill) => ({
          SkillBadgeCriteriaId: '',
          BadgeCriteriaId: '',
          ChasmaNOVOSkillId: skill.skillid,
          LevelId: skill.levelId,
        })),
      };
      this.isLoading = true;
      this.badgeCriteria.addBadgeCriteria(requestBody).subscribe({
        next: (response) => {
          try {
            if (typeof response === 'string') {
              Swal.fire({
                icon: 'info',
                title: 'Notification',
                text: response,
                confirmButtonText: 'OK',
              });
              this.isLoading = false;
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: response?.message || 'Badge added successfully!',
                confirmButtonText: 'OK',
              });
              this.isLoading = false;
            }
          } catch (e) {
            console.error('Error parsing response:', e);
            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              text: 'Badge added, but response format is unexpected.',
              confirmButtonText: 'OK',
            });
            this.isLoading = false;
          }
          this.dialogRef.close('success');
        },
        error: (error) => {
          this.toaster.error('Failed to create badge. Try again.');
          this.isLoading = false;
        },
      });
    } else {
      this.toaster.error(
        'Please fill all required fields and add at least one skill.'
      );
      this.isLoading = false;
    }
  }

  removeSkill(skill: { name: string; level: string }): void {
    this.selectedSkills = this.selectedSkills.filter(
      (i) => !(i.name === skill.name && i.level === skill.level)
    );
  }

  isFormValid(): boolean {
    return (
      this.BadgeFormGroup.valid &&
      this.skillsFormGroup.valid &&
      this.selectedSkills.length > 0 &&
      this.selectedFile !== null
    );
  }
}
