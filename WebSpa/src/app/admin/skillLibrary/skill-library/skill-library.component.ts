import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ApplicationUser,
  JobTitle,
  Skill,
} from '@app/shared/models/commonmodel';
import { JobTitleService } from '@app/shared/services/job-title.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import { TreeNode } from 'primeng/api';
import { concatMap, forkJoin, of, tap } from 'rxjs';
import { AssignSkillDialogComponent } from '../assign-skill-dialog/assign-skill-dialog.component';
import { Title } from '@angular/platform-browser';
import { OrganizationSkillImportComponent } from '@app/admin/components/organization-skill-import/organization-skill-import.component';
import { AppConstants } from '@app/shared/App-Constants';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-skill-library',
  templateUrl: './skill-library.component.html',
  styleUrl: './skill-library.component.scss',
})
export class SkillLibraryComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  jobTitleTree: TreeNode[] = [];
  jobTitleList: JobTitle[] = [];
  searchjobTitleList: JobTitle[] = [];
  displayAssignDialog: boolean = false;
  selectedSkill: any;
  users: any[] = []; // Store users list
  selectedUsers: any[] = []; // Store selected users
  selectAllUsers: boolean = false; // Track select all state
  originalSkillTree: any;
  isMobile: boolean = false;

  constructor(
    private jobService: JobTitleService,
    private title: Title,
    private userService: UserService,
    private skillService: SkillService,
    private dialog: MatDialog,
    private platform: Platform
  ) {
    this.title.setTitle('Skill Base');
  }
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
    this.getAllJobTitle();
    this.getAllOrgUsers();
    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  getAllJobTitle() {
    this.isLoading = true;
    this.jobService
      .getAllOrganizationJobTitle(this.loggedInUser.organizationId, '')
      .subscribe({
        next: (res) => {
          this.jobTitleList = res;
          this.searchjobTitleList = res;
          this.getJobTitle(this.jobTitleList);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  getAllOrgUsers() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers(
        '',
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (res) => {
          if (
            this.loggedInUser.roleName ==
            AppConstants.ChasmanovoRoles.Global_admin
          ) {
            this.users = res.filter(
              (x: { applicationUserId: string }) =>
                x.applicationUserId !== this.loggedInUser.applicationUserId
            );
          } else if (
            this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.admin
          ) {
            this.users = res.filter(
              (x: { applicationUserId: string; roleName: string }) =>
                x.applicationUserId !== this.loggedInUser.applicationUserId &&
                x.roleName !== AppConstants.ChasmanovoRoles.Global_admin
            );
          } else if (
            this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.manager
          ) {
            this.users = res.filter(
              (x: { applicationUserId: string; roleName: string }) =>
                x.applicationUserId !== this.loggedInUser.applicationUserId &&
                x.roleName === AppConstants.ChasmanovoRoles.learner
            );
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  getJobTitle(jobTitleList: JobTitle[]) {
    this.jobTitleTree = jobTitleList.map((job: any) => ({
      label: job.name,
      data: job,
      leaf: false,
      loading: false,
      fullyLoaded: false,
    }));
  }

  loadSkills(event: any) {
    const node = event.node;
    node.loading = true;
    this.getSkillsByJobTitleId(node.data.chasmaNOVOJobTitleId).subscribe(
      (skills: Skill[]) => {
        node.children = skills.map((skill) => ({
          label: skill.name,
          data: skill,
          icon: 'pi pi-fw pi-briefcase',
          leaf: true,
        }));
        node.showSearch = node.children.length > 0;
        node.loading = false;
        this.originalSkillTree = skills;
      },
      () => {
        node.loading = false;
      }
    );
  }
  collapseSkills(event: any) {
    const node = event.node;
    node.showSearch = false;
  }
  getSkillsByJobTitleId(jobtitleId: string) {
    return this.skillService.getAllSkills(jobtitleId);
  }
  filterSkillLabel(event: any, node: any) {
    let value = event.target.value.toLowerCase();
    if (value) {
      node.children = this.originalSkillTree
        .map((skill: any) => ({
          label: skill.name,
          data: skill,
          icon: 'pi pi-fw pi-briefcase',
          leaf: true,
        }))
        .filter((child: any) => child.label.toLowerCase().includes(value));
      if (!node.children || node.children.length < 1) {
        node.children = [
          {
            label: 'No matched skill',
            leaf: true,
            isMatch: true,
          },
        ];
      }
    } else {
      node.children = this.originalSkillTree.map((skill: any) => ({
        label: skill.name,
        data: skill,
        icon: 'pi pi-fw pi-briefcase',
        leaf: true,
      }));
    }
  }

  openAssignDialog(skill: any = null) {
    if (skill == null) {
      this.selectedSkill = null;
    } else {
      this.selectedSkill = skill.data;
    }
    const dialogRef = this.dialog.open(AssignSkillDialogComponent, {
      width: '500px',
      data: { users: this.users, selectedSkill: this.selectedSkill },
    });
    dialogRef.disableClose = false;
    dialogRef.afterClosed().subscribe((result) => {
      // if (result.isSuccess) {
      this.getAllOrgUsers();
      // }
    });
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(OrganizationSkillImportComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Handle any post-dialog actions if needed
    });
  }

  filterSkills(value: string): JobTitle[] {
    const Value = value.toLowerCase();
    if (Value) {
      this.jobTitleList = this.searchjobTitleList.filter((x) =>
        x.name?.toLowerCase().includes(Value)
      );
      this.getJobTitle(this.jobTitleList);
    } else {
      this.jobTitleList = this.searchjobTitleList;
      this.getJobTitle(this.jobTitleList);
    }
    return [];
  }
}
