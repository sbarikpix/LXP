import { Component, OnInit } from '@angular/core';
import { UploadUsercontentComponent } from '../upload-usercontent/upload-usercontent.component';
import { MatDialog } from '@angular/material/dialog';
import {
  UserContentResponse,
  UserContentService,
} from '@app/shared/services/usercontent.service';
import { ApplicationUser } from '@app/shared/models/commonmodel';
import { AppConstants } from '@app/shared/App-Constants';
import { UserService } from '@app/shared/services/user.service';
import { AssignSkillDialogComponent } from '@app/admin/skillLibrary/assign-skill-dialog/assign-skill-dialog.component';
import { Title } from '@angular/platform-browser';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-user-contentview',
  templateUrl: './user-contentview.component.html',
  styleUrl: './user-contentview.component.scss',
})
export class UserContentviewComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  usercontent: UserContentResponse[] = [];
  searchusercontent: UserContentResponse[] = [];
  loading: boolean = false;
  searchValue: any;
  users: any[] = [];
  selectedSkill: any;
  isMobile: boolean = false;

  constructor(
    private dialog: MatDialog,
    private contentservice: UserContentService,
    private userService: UserService,
    private title: Title,
    private platform: Platform
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
    this.title.setTitle('Content Manager');
  }

  ngOnInit() {
    this.getusercontent(this.loggedInUser.organizationId);
    this.getAllOrgUsers();

    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  getusercontent(orgId: string) {
    this.loading = true;
    this.contentservice.getusercontent(orgId).subscribe({
      next: (res) => {
        this.usercontent = res;
        this.searchusercontent = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      },
    });
  }

  getAllOrgUsers() {
    this.loading = true;
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
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
        },
      });
  }

  openAddContentDialog() {
    const dialogRef = this.dialog.open(UploadUsercontentComponent, {
      width: '500px',
      disableClose: true,
      data: { userContentId: null },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getusercontent(this.loggedInUser.organizationId);
    });
  }

  onassign(skill: any) {
    if (skill) {
      this.selectedSkill = skill;
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

  onstart(content: string) {
    window.open(content, '_blank');
    this.clearSearch();
  }

  filterList(event?: Event) {
    if (this.searchValue) {
      const searchValue = this.searchValue.toLowerCase();
      this.usercontent = this.searchusercontent.filter((item) =>
        item.title.toLowerCase().includes(searchValue)
      );
    } else {
      this.usercontent = this.searchusercontent;
    }
  }

  clearSearch() {
    this.searchValue = '';
    this.filterList();
  }

  onEdit(content: UserContentResponse) {
    // Open the dialog to edit the content
    const dialogRef = this.dialog.open(UploadUsercontentComponent, {
      width: '600px',
      disableClose: true,
      data: { userContentId: content.userContentId }, // Pass the content to the dialog for editing
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getusercontent(this.loggedInUser.organizationId);
      this.clearSearch();
    });
  }
}
