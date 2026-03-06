import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ApplicationUser,
  Groups,
  GroupUsers,
  JobTitle,
  NotificationCommandModel,
} from '@app/shared/models/commonmodel';
import { FcmService } from '@app/shared/services/fcm.service';
import { GroupsService } from '@app/shared/services/groups.service';
import { JobTitleService } from '@app/shared/services/job-title.service';
import {
  groupuserlearningjourneyCommand,
  LearningjourneyService,
  userlearningjourneyCommand,
} from '@app/shared/services/learningjourney.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import {
  AssignContent,
  UserContentService,
} from '@app/shared/services/usercontent.service';
import { content } from 'html2canvas/dist/types/css/property-descriptors/content';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { error } from 'node:console';
import {
  BehaviorSubject,
  debounceTime,
  distinct,
  of,
  switchMap,
  take,
} from 'rxjs';

@Component({
  selector: 'app-assign-skill-dialog',
  templateUrl: './assign-skill-dialog.component.html',
  styleUrl: './assign-skill-dialog.component.scss',
})
export class AssignSkillDialogComponent implements OnInit {
  selectAllUsers: boolean = false;
  currentRoute: boolean = false;
  contentroute: boolean = false;
  users: any[] = [];
  selectedUsers: ApplicationUser[] = [];
  GroupUsers: GroupUsers[] = [];
  selectedSkill: any;
  selectedjourney: any;
  learningusers: any;
  mode: any;
  loggedInUser!: ApplicationUser;
  userSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];
  isLoading: boolean = false;
  filteredUser: any[] = [];
  title: any;

  jobTitleList: JobTitle[] = []; // Store job titles
  selectedJobTitle!: JobTitle; // Store selected job title
  skillName: string = '';
  skilldescription: any;
  allSelect: boolean = true;
  selectedTab: number = 0;
  groupList: any;
  selectedAllGroups: boolean = false;
  selectedGroups: Groups[] = [];
  filteredGroups: any[] = [];
  searchText: string = '';

  constructor(
    public dialogRef: MatDialogRef<AssignSkillDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private toastr: ToastrService,
    private jobservice: JobTitleService,
    private skillService: SkillService,
    private contentservice: UserContentService,
    private learningservice: LearningjourneyService,
    private groupService: GroupsService,
    private router: Router,
    private fcmService: FcmService
  ) {
    this.selectedSkill = data.selectedSkill;
    this.selectedjourney = data.selectedjourney;
    this.learningusers = data.learningusers;
    this.mode = data.mode;
    if (this.mode == 'assignlearning') {
      this.users = data.users
        .filter((user: any) => user.isActive)
        .map((user: any) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
          selected: false,
        }));
      if (this.selectedjourney && this.learningusers) {
        this.users = this.users.filter(
          (user) =>
            !this.learningusers.some(
              (learningUser: { learningJourneyId: any; userId: any }) =>
                learningUser.learningJourneyId ===
                  this.selectedjourney.learningJourneyId &&
                learningUser.userId === user.applicationUserId
            )
        );
      }
      this.users = [...this.users];
      this.filteredUser = [...this.users];
    } else {
      this.users = data.users
        .filter((user: any) => user.isActive)
        .map((user: any) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
          selected: false,
        }));
      if (this.selectedSkill) {
        this.users = this.users.filter(
          (x: { userSkills: string | any[] }) =>
            !x.userSkills.includes(this.selectedSkill.chasmaNOVOSkillId)
        );
      }
      this.users = [...this.users];
      this.filteredUser = [...this.users];
    }
  }

  ngOnInit() {
    this.currentRoute = this.router.url.includes('skillbase');
    this.contentroute = this.router.url.includes('usercontent');
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    if (!this.selectedSkill && !this.selectedjourney) {
      this.getAllJobs(this.loggedInUser.organizationId);
    }
  }

  getAllJobs(organizationId: string) {
    this.isLoading = true;
    this.jobservice.getAllOrganizationJobTitle(organizationId, '').subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.jobTitleList = [...this.jobTitleList, ...res];
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching job titles:', err);
      },
    });
  }

  toggleSelectAll(event: any) {
    if (this.selectedTab == 0) {
      this.selectAllUsers = event.checked;
      this.users.forEach((user) => (user.selected = this.selectAllUsers));
      this.selectedUsers = this.users.filter((u) => u.selected);
    } else if (this.selectedTab == 1) {
      this.selectedAllGroups = event.checked;
      this.groupList.forEach(
        (group: any) => (group.selected = this.selectedAllGroups)
      );
    }
  }

  updateSelectedGroups() {
    this.selectedGroups = this.groupList.filter((g: any) => g.selected);
    this.selectedAllGroups = this.groupList.every((g: any) => g.selected);
  }

  updateSelectedUsers() {
    this.selectedUsers = this.users.filter((u) => u.selected);
    this.selectAllUsers = this.users.every((u) => u.selected);
  }

  assignSkillToGroup() {
    this.selectedGroups = this.groupList.filter(
      (group: Groups & { selected?: boolean }) => group.selected
    );
    this.selectedSkill = this.data.selectedSkill;
    if (this.selectedGroups.length === 0) {
      this.toastr.error('Please select at least one group');
      return;
    }

    this.selectedGroups.forEach((group) => {
      const command = {
        organizationId: this.loggedInUser.organizationId,
        groupId: this.selectedGroups.map((group) => group.groupId),
        chasmaNOVOSkillId: this.selectedSkill.chasmaNOVOSkillId,
        levelId: this.selectedSkill.levelId || '',
        contentTitle: this.selectedSkill.title || '',
        assignedUserId: this.loggedInUser.applicationUserId,
      };

      this.isLoading = true;
      this.skillService.addskillToGroup(command).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.isSuccess) {
            this.toastr.success('Skill assigned to group successfully', '', {
              timeOut: 3000,
              closeButton: true,
            });
          } else {
            this.toastr.error(res.message);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.toastr.error('Error assigning skill to group');
        },
      });
    });

    const groupIds = this.selectedGroups.map((group) => group.groupId);
    this.groupService.getGroupUsers(groupIds).subscribe((res) => {
      this.GroupUsers = res as GroupUsers[];
    });
    this.dialogRef.close();
  }

  assignContentToGroup() {
    this.selectedGroups = this.groupList.filter(
      (group: Groups & { selected?: boolean }) => group.selected
    );

    if (this.selectedGroups.length === 0) {
      this.toastr.error('Please select at least one group');
      return;
    }
    this.dialogRef.close();
  }

  assignSkill() {
    this.selectedUsers = this.users.filter((user) => user.selected);
    if (this.selectedUsers.length != 0) {
      this.selectedUsers.forEach((x) => {
        this.userSkills.push({
          chasmaNOVOSkillId: this.selectedSkill.chasmaNOVOSkillId,
          levelId: this.selectedSkill.levelId || '', //by default we are adding beginner level for the skill
        });

        const updateUserCommand = {
          applicationUserId: x.applicationUserId,
          organizationId: x.organizationId,
          firstName: x.firstName,
          middleName: x.middleName,
          lastName: x.lastName,
          email: x.email,
          userName: x.email,
          profileImagePath: x.profileImagePath,
          dateOfBirth: x.dateOfBirth,
          gender: x.gender,
          isMentor: x.isMentor,
          address1: x.address1,
          address2: x.address2,
          city: x.city,
          district: x.district,
          state: x.state,
          zip: x.zip,
          country: x.country,
          phoneNumber: x.phoneNumber,
          isActive: x.isActive,
          jobTitleId: x.jobTitleId,
          teamId: x.organizationTeamId,
          userInterests: x.userInterests,
          userSkills: this.userSkills,
          managerId: x.managerId,
          roleId: x.roleId,
        };
        this.isLoading = true;
        this.userService.updateOrganizationUser(updateUserCommand).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.notifySkillAssignmentSuccess();
              const command: AssignContent = {
                assignedUserId: this.loggedInUser.applicationUserId,
                assignedToUserId: x.applicationUserId,
                organizationId: x.organizationId,
                skillId: this.selectedSkill.chasmaNOVOSkillId,
                levelId: this.selectedSkill.levelId || '',
                contentTitle: this.selectedSkill.title || '',
              };
              this.isLoading = false;
              this.toastr.success('Skill Assigned Successfully', '', {
                timeOut: 3000,
                closeButton: true,
              });
              this.contentservice.assignedContent(command).subscribe({
                next: (res) => {
                  this.isLoading = false;
                  this.toastr.success('Skill Assigned Successfully', '', {
                    timeOut: 3000,
                    closeButton: true,
                  });
                },
                error: (res) => {
                  this.isLoading = false;
                },
              });
            } else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          },
        });
      });
      this.dialogRef.close();
    } else {
      this.toastr.error('Please select atleast one user');
    }
  }

  addNewSkill() {
    if (!this.selectedJobTitle || !this.skillName.trim()) {
      this.toastr.error('Please select a Job Title and enter a Skill Name.');
      return;
    }

    const newSkill = {
      organizationId: this.loggedInUser.organizationId,
      userId: this.loggedInUser.applicationUserId,
      chasmaNOVOJobSetId: this.selectedJobTitle.chasmaNOVOJobTitleId,
      name: this.skillName,
      description: this.skilldescription || '',
    };
    this.isLoading = true;
    this.skillService.addOrganizationSkill(newSkill).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.isLoading = false;
          this.toastr.success('Skill added Successfully', '', {
            timeOut: 3000,
            closeButton: true,
          });
          this.dialogRef.close(res);
        }
      },
      error: (err) => {
        this.isLoading = false;
        let errmsg = err.error.Organizations[0];
        this.toastr.error(errmsg, '', {
          timeOut: 3000,
          closeButton: true,
        });
      },
    });
  }

  assignjourney() {
    this.selectedUsers = this.users.filter((user) => user.selected);
    if (this.selectedUsers.length != 0 || this.selectedGroups.length != 0) {
      this.selectedUsers.forEach((x) => {
        const command: userlearningjourneyCommand = {
          journeyId: this.selectedjourney.learningJourneyId,
          userId: x.applicationUserId,
          assignedUserId: this.loggedInUser.applicationUserId,
          isAssigned: true,
        };
        this.isLoading = true;
        this.learningservice.adduserlearningjourney(command).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              //  this.getlearningdetails(res.message);
              this.isLoading = false;
            }
          },
          error: (err) => {
            this.isLoading = false;
          },
        });
      });
    } else {
      this.toastr.error('Please select atleast one user');
    }
    this.dialogRef.close();
  }

  assignGroupJourney() {
    const selectedGroupIds = this.groupList
      .filter((group: Groups & { selected?: boolean }) => group.selected)
      .map((group: Groups & { selected?: boolean }) => group.groupId);

    if (selectedGroupIds.length > 0 || this.selectedUsers.length > 0) {
      const command: groupuserlearningjourneyCommand = {
        journeyId: this.selectedjourney.learningJourneyId,
        groupIds: selectedGroupIds, // NOTE: updated to send an array
        assignedUserId: this.loggedInUser.applicationUserId,
        isAssigned: true,
      };

      this.isLoading = true;

      this.learningservice.addgroupuserlearningjourney(command).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            // Optionally reload or show success message
            this.isLoading = false;
            this.dialogRef.close();
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error assigning group journey', err);
        },
      });
    }
    this.dialogRef.close();
  }

  // filterUser(event: any) {
  //   var value = event.target.value.toLowerCase();
  //   if (value) {
  //     this.filteredUser = this.users.filter(
  //       (x) =>
  //         x.fullName?.toLowerCase().includes(value) ||
  //         x.email?.toLowerCase().includes(value)
  //     );
  //     if (!this.filteredUser || this.filteredUser.length < 1) {
  //       this.allSelect = false;
  //     } else {
  //       this.allSelect = true;
  //     }
  //   } else {
  //     this.filteredUser = this.users;
  //     this.allSelect = true;
  //   }
  // }
  filterUser(event: any) {
    this.searchText = (event?.target?.value || '').toLowerCase();

    if (this.selectedTab === 0) {
      // Filtering users

      this.filteredUser = this.searchText
        ? this.users.filter(
            (x) =>
              x.fullName?.toLowerCase().includes(this.searchText) ||
              x.email?.toLowerCase().includes(this.searchText)
          )
        : [...this.users];
      this.allSelect = !!this.filteredUser.length;
    } else if (this.selectedTab === 1) {
      // Filtering groups

      this.filteredGroups = this.searchText
        ? this.groupList.filter((group: any) =>
            group.groupName?.toLowerCase().includes(this.searchText)
          )
        : [...this.groupList];
      this.allSelect = !!this.filteredGroups.length;
    }
  }

  getAllGroups() {
    this.groupService.getAllGroups(this.loggedInUser.organizationId).subscribe({
      next: (res: any) => {
        this.groupList = res.filter(
          (group: { isActive: boolean; totalUsers: any }) => group.isActive
        );
        this.filteredGroups = [...this.groupList];
      },
      error: (err: any) => {
        let errMsg = err.error[''];
        this.toastr.error(errMsg);
      },
    });
  }

  tabChange(event: any) {
    this.selectedTab = event.index;
    this.searchText = '';
    (document.querySelector('.searchInput') as HTMLInputElement)!.value = '';
    if (event.index === 0) {
      this.filteredUser = [...this.users];
    } else if (event.index === 1) {
      this.getAllGroups();
    }
  }
  notifySkillAssignmentSuccess() {
    const command: NotificationCommandModel = {
      title: 'Skill Assignment Successful',
      body: 'A new skill has been assigned to you. Please check your skill library to view and start learning!',
    };
    this.fcmService.sendNotification(command).subscribe();
  }
}
