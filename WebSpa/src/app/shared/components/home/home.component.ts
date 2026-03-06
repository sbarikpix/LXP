import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  Interest,
  JobTitle,
  Skill,
  SkillLevel,
} from '@app/shared/models/commonmodel';
import { InterestService } from '@app/shared/services/interest.service';
import { JobTitleService } from '@app/shared/services/job-title.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinct,
  finalize,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  public skillPerPage = 10;
  public JobsPerPage = 10;
  public pageSize = 1;
  private allSkillsLoaded = false;
  private alljobsLoaded = false;
  searchText: string = '';
  selectJobTitle: string = '';
  loading = false;
  isLoading = false;

  isEditable = true;
  selectedJobTitle: string = '';

  profileFormGroup = this._formBuilder.group({
    firstName: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$')]],
    lastName: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$')]],
    jobTitle: ['', Validators.required],
  });

  jobTitles: JobTitle[] = [];
  chasmaNOVOJobSetId: string = '';
  // filteredJobTitles: JobTitle[] = [];
  filteredJobTitles = new BehaviorSubject<JobTitle[]>([]);

  interestsFormGroup = this._formBuilder.group({
    interests: [''],
  });
  allInterests: any[] = [];
  filteredInterests!: Observable<Interest[]>;
  filteredInterest = new BehaviorSubject<Interest[]>([]);
  selectedInterests: Array<{ name: string; interestid: string }> = [];
  userInterests?: string[];

  skillsFormGroup = this._formBuilder.group({
    skills: [''],
    level: [''],
  });

  allSkills: any[] = [];
  // filteredSkills!: Observable<Skill[]>;
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
  isemailvarified: boolean = false;
  LevelList: SkillLevel[] = [];
  skills: string[] = [];
  interestSkill: string[] = [];
  isMoble = window.innerWidth < 767;
  @ViewChild('stepper') stepper?: MatStepper;
  @Output() getMainmenu: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private jobTitleService: JobTitleService,
    private skillService: SkillService,
    private router: Router,
    private _formBuilder: FormBuilder,
    private userInterest: InterestService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.skillsFormGroup = this._formBuilder.group({
      skills: [''],
      level: [''], // Initialize with an empty value
    });
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      this.loggedInUser = JSON.parse(userData);
      this.userId = this.loggedInUser.applicationUserId;
      this.orgId = this.loggedInUser.organizationId;
      this.chasmaNOVOJobSetId =
        this.loggedInUser.jobTitleId != null
          ? this.loggedInUser.jobTitleId
          : '';
      this.getUserDetails();
      this.fetchJobTitles(
        this.orgId,
        this.chasmaNOVOJobSetId,
        this.JobsPerPage,
        this.pageSize,
        this.searchText
      );
    }
  }

  getUserDetails() {
    if (this.loggedInUser) {
      this.jobTitleService
        .getAllOrganizationJobTitle(
          this.loggedInUser.organizationId,
          this.loggedInUser.jobTitleId
        )
        .subscribe({
          next: (jobtitle: JobTitle[]) => {
            const jobtileName = jobtitle
              .filter(
                (x) => x.chasmaNOVOJobTitleId == this.loggedInUser.jobTitleId
              )
              .find((y) => y.name);
            this.profileFormGroup.patchValue({
              firstName: this.loggedInUser.firstName,
              lastName: this.loggedInUser.lastName,
              jobTitle: jobtileName?.name, //job title name instead of id
            });
          },
        });

      if (this.loggedInUser.isEmailVerified == true) {
        this.router.navigate([
          '/user',
          this.loggedInUser.organizationId,
          this.loggedInUser.applicationUserId,
        ]);
        return;
      }
    } else {
      console.error('LoggedIn User is missing');
    }
  }

  fetchJobTitles(
    orgId: string,
    organisationJobId: string,
    JobsPerPage: number,
    pageSize: number,
    searchText: string
  ): void {
    this.loading = true;
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
          this.loading = false;
          if (res && res.length > 0) {
            this.jobTitles = [
              ...this.jobTitles,
              ...res.filter(
                (j) =>
                  !this.jobTitles.some(
                    (existing) =>
                      existing.chasmaNOVOJobTitleId === j.chasmaNOVOJobTitleId
                  )
              ),
            ];
            this.jobTitles.sort((a, b) => a.name.localeCompare(b.name));
            this.filteredJobTitles.next(this.jobTitles);
            if (this.filteredJobTitles.value.length > 0) {
              this.onJobTitleChange(this.chasmaNOVOJobSetId);
            }
            if (res.length < JobsPerPage) {
              this.alljobsLoaded = true;
            }
          } else {
            this.alljobsLoaded = true;
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error fetching job titles:', err);
        },
      });
  }

  onJobTitleChange(event: any): void {
    this.filteredJobTitles.pipe(take(1)).subscribe((jobTitles: JobTitle[]) => {
      const selectedJob = jobTitles.find(
        (job) => job.chasmaNOVOJobTitleId === event
      );
      if (selectedJob) {
        this.selectedJobTitle = selectedJob.chasmaNOVOJobTitleId;
        this.chasmaNOVOJobSetId = selectedJob.chasmaNOVOJobTitleId;
        this.selectedSkills = [];
        this.skillsFormGroup.reset();
        this.allSkills = [];
        this.filteredSkills.next([]);
        this.pageSize = 1;
        this.profileFormGroup.get('jobTitle')?.setValue(selectedJob.name);
        this.allSkillsLoaded = false;
        this.fetchSkills(
          this.chasmaNOVOJobSetId,
          this.skillPerPage,
          this.pageSize,
          ''
        );
        this.getSkillLevels();
        this.fetchInterests();
      }
    });
  }

  onSearchInput(event: Event, type: 'job' | 'skill' | 'interest'): void {
    this.loading = true;
    const input = (event.target as HTMLInputElement).value;
    this.searchText = input;
    this.pageSize = 1;
    if (type === 'job') {
      this.selectedJobTitle = '';
      this.chasmaNOVOJobSetId = '';
      this.pageSize = 1;
      this.alljobsLoaded = false;
      this.jobTitles = [];
      this.filteredJobTitles.next([]);

      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() =>
            this.jobTitleService.getAllOrganizationJobTitle(
              this.orgId,
              this.chasmaNOVOJobSetId,
              this.JobsPerPage,
              this.pageSize,
              this.searchText
            )
          )
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res && res.length > 0) {
              this.jobTitles = res;
              this.filteredJobTitles.next(this.jobTitles);
              this.alljobsLoaded = res.length < this.JobsPerPage;
            } else {
              this.filteredJobTitles.next([]);
              this.alljobsLoaded = true;
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('Error fetching job titles:', err);
          },
        });
    } else if (type === 'skill') {
      this.pageSize = 1;
      this.allSkillsLoaded = false;
      this.allSkills = [];
      this.filteredSkills.next([]);

      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() =>
            this.skillService.getAllSkills(
              this.selectedJobTitle,
              this.skillPerPage,
              this.pageSize,
              this.searchText
            )
          )
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res && res.length > 0) {
              this.allSkills = res;
              this.filteredSkills.next(this.allSkills);
              this.allSkillsLoaded = res.length < this.skillPerPage;
            } else {
              this.filteredSkills.next([]);
              this.allSkillsLoaded = true;
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('Error fetching skills:', err);
          },
        });
    } else if (type === 'interest') {
      this.allInterests = [];
      this.filteredInterest.next([]);
      of(input)
        .pipe(
          debounceTime(300),
          switchMap(() =>
            this.userInterest.getAllInterest(
              '',
              this.loggedInUser.organizationId
            )
          )
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res && res.length > 0) {
              this.allInterests = [...res];
              this.filteredInterest.next(this.allInterests);
              const filtered = this.allInterests.filter((interest) =>
                interest.name
                  .toLowerCase()
                  .includes(this.searchText.toLowerCase())
              );
              this.filteredInterest.next(filtered);
            } else {
              this.filteredInterest.next([]);
            }
          },
        });
    }
  }

  onDropdownScroll(type: 'jobTitles' | 'skills'): void {
    if (type === 'skills' && !this.allSkillsLoaded) {
      this.pageSize++;
      this.fetchSkills(
        this.selectedJobTitle,
        this.skillPerPage,
        this.pageSize,
        this.searchText
      );
    } else if (type === 'jobTitles' && !this.alljobsLoaded) {
      this.pageSize++;
      this.fetchJobTitles(
        this.orgId,
        this.chasmaNOVOJobSetId,
        this.JobsPerPage,
        this.pageSize,
        this.searchText
      );
    }
  }

  fetchSkills(
    jobTitleId: string,
    skillsperpage: number,
    pageSize: number,
    searchText: string
  ): void {
    if (this.loading || this.allSkillsLoaded) return; // prevent duplicate calls

    this.skillService
      .getAllSkills(jobTitleId, skillsperpage, pageSize, searchText)
      .subscribe({
        next: (res) => {
          if (res && res.length > 0) {
            this.allSkills = [
              ...this.allSkills,
              ...res.filter(
                (s) =>
                  !this.allSkills.some(
                    (existing) =>
                      existing.chasmaNOVOSkillId === s.chasmaNOVOSkillId
                  )
              ),
            ];
            this.allSkills.sort((a, b) => a.name.localeCompare(b.name));
            this.filteredSkills.next(this.allSkills);

            if (res.length < this.skillPerPage) {
              this.allSkillsLoaded = true;
            }
          } else {
            this.allSkillsLoaded = true;
          }
        },
        error: () => {
          console.error('Error fetching skills');
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

  addSkills(): void {
    const skill = this.skillsFormGroup.get('skills')?.value;
    const level = this.skillsFormGroup.get('level')?.value;
    if (skill || typeof skill == 'string') {
      this.skills.push(skill);
    }
    if (this.selectedSkills.find((i) => i.name === skill)) {
      this.skillsFormGroup.get('skills')?.setErrors({ alreadyAdded: true });
    }
    if (this.skills.length >= 30) {
      this.skillsFormGroup.get('skills')?.setErrors({ limitExceeded: true });
    }
    if (
      skill &&
      level &&
      !this.selectedSkills.find((i) => i.name === skill) &&
      this.skills.length <= 30
    ) {
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
        this.skillsFormGroup.get('level')?.setValue('');
        this.updateInterestValidators();
      } else {
        console.error('Skill ID or Level not found.');
      }
    }
    this.allSkills = [];
    this.allSkillsLoaded = false;
    this.fetchSkills(
      this.chasmaNOVOJobSetId,
      this.skillPerPage,
      this.pageSize,
      (this.searchText = '')
    );
  }

  onSkillsStepChange(event: any): void {
    if (event.selectedIndex === 3) {
      // Check for completion step
      if (this.selectedSkills.length === 0) {
        event.preventDefault(); // Prevent moving to the completion step
        console.error(
          'You must add at least one skill to proceed to the completion step.'
        );
        // Optionally, you can show a notification or alert to the user
      }
    }
  }

  updateSkillValidator(): void {
    this.skillsFormGroup.get('skills')?.updateValueAndValidity();
    this.skillsFormGroup.get('level')?.updateValueAndValidity();
  }

  removeSkill(skill: { name: string; level: string }): void {
    this.selectedSkills = this.selectedSkills.filter(
      (i) => i.name !== skill.name
    );
  }

  fetchInterests(): void {
    this.userInterest
      .getAllInterest('', this.loggedInUser.organizationId)
      .subscribe({
        next: (res) => {
          this.allInterests = res;
          this.allInterests.sort((a, b) => a.name.localeCompare(b.name));
          this.filteredInterest.next(this.allInterests);
          // this.filteredInterests = this.interestsFormGroup
          //   .get('interests')!
          //   .valueChanges.pipe(
          //     startWith(''),
          //     map((value) =>
          //       value
          //         ? this.filterInterest(value || '')
          //         : this.allInterests.slice()
          //     )
          //   );
        },
      });
  }

  // private filterInterest(value: string): Interest[] {
  //   const filterValue = value.toLowerCase();
  //   const filtered = this.allInterests.filter((interest) =>
  //     interest.name.toLowerCase().includes(filterValue)
  //   );
  //   return filtered.length > 0 ? filtered : [];
  // }

  addInterest(): void {
    const interest = this.interestsFormGroup.get('interests')?.value;
    if (interest || typeof interest == 'string') {
      this.interestSkill.push(interest?.toString());
    }
    if (this.selectedInterests.find((i) => i.name === interest)) {
      this.interestsFormGroup
        .get('interests')
        ?.setErrors({ alreadyAdded: true });
    }

    if (interest && !this.selectedInterests.find((i) => i.name === interest)) {
      const interestId = this.allInterests.find(
        (x) => x.name === interest
      )?.chasmaNOVOInterestId;

      // Check if interestId and interestLevel are defined
      if (interestId) {
        this.selectedInterests.push({
          name: interest,
          interestid: interestId,
        });

        this.interestsFormGroup.reset();
        this.updateInterestValidators(); // Update validators
      } else {
        console.error('Interest ID or Level not found.');
      }
    }
    this.filteredInterest.next(this.allInterests);
  }

  removeInterest(interest: { name: string }): void {
    this.selectedInterests = this.selectedInterests.filter(
      (i) => i.name !== interest.name
    );
    this.updateInterestValidators();
  }

  updateInterestValidators(): void {
    this.interestsFormGroup.get('interests')?.updateValueAndValidity();
  }

  goToNextStep(): void {
    this.isLoading = true;

    setTimeout(() => {
      if (this.selectedSkills.length === 0) {
        this.toastr.warning(
          'No skills added. Please add at least one skill to proceed.'
        );
        this.isLoading = false;
        return;
      }

      if (this.selectedSkills.length === 0) {
        this.skillsFormGroup.reset();
      }

      this.userSkills = this.selectedSkills.map((skill) => ({
        chasmaNOVOSkillId: skill.skillid,
        levelId: skill.levelId,
      }));

      if (this.selectedInterests.length === 0) {
        this.interestsFormGroup.reset();
      }

      this.userInterests = this.selectedInterests.map((i) => i.interestid);

      if (this.selectedSkills.length && this.profileFormGroup.valid) {
        const updateUserOrgCommand = {
          applicationUserId: this.loggedInUser.applicationUserId,
          organizationId: this.orgId,
          firstName: this.profileFormGroup.get('firstName')?.value || '',
          middleName: this.loggedInUser.middleName,
          lastName: this.profileFormGroup.get('lastName')?.value || '',
          email: this.loggedInUser.email,
          userName: this.loggedInUser.email,
          profileImagePath: this.loggedInUser.profileImagePath,
          dateOfBirth: this.loggedInUser.dateOfBirth,
          gender: this.loggedInUser.gender,
          isMentor: this.loggedInUser.isMentor,
          address1: this.loggedInUser.address1,
          address2: this.loggedInUser.address2,
          city: this.loggedInUser.city,
          district: this.loggedInUser.district,
          state: this.loggedInUser.state,
          zip: this.loggedInUser.zip,
          country: this.loggedInUser.country,
          phoneNumber: this.loggedInUser.phoneNumber,
          isActive: this.loggedInUser.isActive,
          userInterests: this.userInterests,
          jobTitleId: this.selectedJobTitle || '',
          teamId: this.loggedInUser.organizationTeamId,
          userSkills: this.userSkills,
          managerId: this.loggedInUser.managerId,
          roleId: this.loggedInUser.roleId,
        };

        this.userService
          .updateOrganizationUser(updateUserOrgCommand)
          .pipe(
            finalize(() => {
              this.isLoading = false; // ✔ ALWAYS executed
            })
          )
          .subscribe({
            next: (res) => {
              console.log('API Response:', res);
              if (res?.isSuccess === true) {
                this.isLoading = false;
                this.stepper?.next();
                this.isEditable = false;
              } else {
                console.error('Error updating user organization');
              }
            },
            error: (err) => {
              console.error('API Error:', err);
            },
          });
      } else {
        this.isLoading = false;
      }
    }, 200);
  }

  redirectToProfile() {
    this.getMainmenu.emit(false);
  }

  skipInterests(stepper: any): void {
    this.selectedSkills = [];
    stepper.next();
  }
}
