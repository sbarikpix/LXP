import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../shared/services/user.service';
import {
  ApplicationUser,
  GetallOrgUsersquery,
} from '../../../shared/models/commonmodel';
import Swal from 'sweetalert2';
import { UserImportDocumentComponent } from '../user-import-document/user-import-document.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TableLazyLoadEvent } from 'primeng/table';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { AppConstants } from '@app/shared/App-Constants';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SideNavComponent } from '@app/shared/components/side-nav/side-nav.component';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  userList: ApplicationUser[] = [];
  dataSource: ApplicationUser[] = [];
  selectedTab: string = 'total';
  activeUsers: number = 0;
  inActiveUsers: number = 0;
  loggedInUser!: ApplicationUser;
  managerList: ApplicationUser[] = [];
  selectedUsers: ApplicationUser[] = [];
  allSelected: boolean = false;
  isLoading: boolean = false;
  userId: string = '';
  loading!: boolean;
  totalusers: number = 0;
  activerecords: number = 0;
  Inactiveusers: number = 0;
  totalRecords: number = 0;
  orgId: string = '';
  isEmulating: boolean = false;
  viewedUserRole: string = '';
  orgSkillId: string = '';
  emulatedUsers: Set<string> = new Set<string>();
  dataComparisonResult: any;
  userdata: any;
  skilldata: any;
  exportSource: any[] = [];
  addedUserSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];
  filteredUsers: ApplicationUser[] = [];
  isMobile: boolean = false;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private title: Title,
    private toastr: ToastrService,
    public emulationService: EmulateUserService,
    private snackBar: MatSnackBar,
    private platform: Platform
  ) {
    this.title.setTitle('Users');
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
      this.userId = this.loggedInUser.applicationUserId;
    } else if (userData) {
      this.loggedInUser = JSON.parse(userData);
      this.userId = this.loggedInUser.applicationUserId;
    }
    this.orgId =
      this.route.snapshot.paramMap.get('organizationId') ||
      this.loggedInUser.organizationId;
    this.getManagerList();
    this.getUserList();
    const emulatedUser = this.emulationService.getEmulatedUser();
    if (emulatedUser) {
      this.loggedInUser = emulatedUser;
      this.isEmulating = true;
    } else {
      const userData = localStorage.getItem('loggedInUser');
      if (userData) {
        this.loggedInUser = JSON.parse(userData);
      }
      this.isEmulating = false;
    }

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }
  canEditUser(user: ApplicationUser): boolean {
    const isAdmin =
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin;
    const isGlobalAdmin =
      user.roleName === AppConstants.ChasmanovoRoles.Global_admin;

    if (isAdmin) {
      return !isGlobalAdmin;
    }

    return !isAdmin || !isGlobalAdmin;
  }

  loadUsers(event?: TableLazyLoadEvent, tab?: string) {
    // this.loading = true;
    var query: GetallOrgUsersquery;
    if (this.isMobile) {
      var page = 1;
      const pageSize = this.totalRecords + 10;
      query = {
        page: page++,
        pagesize: pageSize,
        filters: event?.filters || {},
        sortField: event?.sortField || 'firstName',
        sortOrder: event?.sortOrder === 1 ? 'asc' : 'desc',
        loggedInUserId: this.loggedInUser.applicationUserId,
        organizationId: this.orgId,
        tab: tab || this.selectedTab,
      };
    } else {
      const page = event ? event.first! / event.rows! : 0;
      const size = event ? event.rows! : 10;

      query = {
        page,
        pagesize: size,
        filters: event?.filters || {},
        sortField: event?.sortField || 'firstName',
        sortOrder: event?.sortOrder === 1 ? 'asc' : 'desc',
        loggedInUserId: this.loggedInUser.applicationUserId,
        organizationId: this.orgId,
        tab: tab || this.selectedTab,
      };
    }

    this.userService.getAllOrganizationUsers(query).subscribe({
      next: (res) => {
        this.dataSource = res.orgusers || [];
        this.filteredUsers = [...this.dataSource];
        this.totalusers = res.total;
        this.totalRecords = res.total;
        this.activerecords = res.totalActive;
        this.Inactiveusers = res.totalInactive;

        this.dataSource.forEach((x) => {
          if (x.profileImagePath) {
            x.profileImagePath += '?t=' + new Date().getTime();
          }
        });

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.filteredUsers = [];
      },
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    const initials = `${firstName ? firstName.charAt(0) : ''} ${
      lastName ? lastName.charAt(0) : ''
    }`;
    return initials.toUpperCase();
  }
  getUserList() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers('', this.loggedInUser.applicationUserId, this.orgId)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.userList = res;
          this.activeUsers = 0;
          this.inActiveUsers = 0;
          this.activeTab(this.selectedTab);
          this.userList.forEach((user) => {
            if (user.isActive) this.activeUsers += 1;
            else this.inActiveUsers += 1;
          });
        },
      });
  }

  activeTab(text: string) {
    this.selectedTab = text;
    this.loadUsers(undefined, this.selectedTab);
    const tabs = document.querySelectorAll('.status');

    tabs.forEach((tab) => {
      (tab as HTMLElement).style.backgroundColor = 'white';
      (tab as HTMLElement).style.color = '#000';
    });

    const selectedTab = document.querySelector(`.${text}`);

    if (selectedTab) {
      (selectedTab as HTMLElement).style.backgroundColor = '#474C60';
      (selectedTab as HTMLElement).style.color = '#fff';
    }
  }

  changeActiveStatusForUser(user: ApplicationUser) {
    const alertMsg: string =
      'The User Will be ' + (user.isActive ? 'InActive' : 'Active');
    if (user.applicationUserId === this.loggedInUser.applicationUserId) {
      this.toastr.error('Logged In User cannot be In-Activated !');
    } else {
      Swal.fire({
        title: 'Are you sure?',
        text: alertMsg,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!',
        width: '400px',
        padding: '1rem',
      }).then((result) => {
        if (result.isConfirmed) {
          user.isActive = !user.isActive;
          const updateUserCommand = {
            applicationUserId: user.applicationUserId,
            organizationId: user.organizationId,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            userName: user.email,
            profileImagePath: user.profileImagePath,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address1: user.address1,
            address2: user.address2,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            userInterests: user.userInterests,
            jobTitleId: user.jobTitleId,
            teamId: user.organizationTeamId,
            userSkills: this.addedUserSkills,
            managerId: user.managerId,
            roleId: user.roleId,
          };
          this.isLoading = true;
          this.userService.updateOrganizationUser(updateUserCommand).subscribe({
            next: (res) => {
              this.getUserList();
              this.selectUser(user, false);
              this.isLoading = false;
              const status = updateUserCommand.isActive
                ? 'activated'
                : 'inactivated';
              this.toastr.success(`User ${status} successfully.`);
            },
            error: (err: HttpErrorResponse) => {
              this.isLoading = false;
              this.toastr.error('An unexpected error occurred.');
            },
          });
        }
      });
    }
  }
  hasActiveEmulation(): boolean {
    return this.isEmulating;
  }

  canEmulate(user: ApplicationUser): boolean {
    if (this.hasActiveEmulation()) {
      return false; // Prevent emulation under emulated user
    }
    if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin
    ) {
      // Global admin can emulate all other roles except themselves
      return user.roleName !== AppConstants.ChasmanovoRoles.Global_admin;
    }
    if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin) {
      // Admin can emulate managers and users
      return (
        user.roleName === AppConstants.ChasmanovoRoles.manager ||
        user.roleName === AppConstants.ChasmanovoRoles.learner
      );
    }
    if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager) {
      // Manager can emulate users
      return user.roleName === AppConstants.ChasmanovoRoles.learner;
    }
    return false;
  }

  emulateUser(user: ApplicationUser) {
    if (this.canEmulate(user)) {
      if (
        this.loggedInUser.roleName ===
          AppConstants.ChasmanovoRoles.Global_admin ||
        this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin ||
        this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager
      ) {
        this.emulationService.emulateUser(user);
        this.loggedInUser = user;
        this.toastr.success('User emulation started');
        this.router.navigate(['']);
      } else {
        this.toastr.error('Only Global Admin can emulate users');
      }
    } else {
      this.toastr.error('You cannot emulate this user.');
    }
  }

  getManagerList() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers('', 'managerlist', this.orgId)
      .subscribe({
        next: (res) => {
          res.forEach((user: ApplicationUser) => {
            if (user.roleName == 'Manager') this.managerList.push(user);
          });
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toastr.error('An unexpected error occurred.');
        },
      });
  }

  getManagerName(managerId: string): string {
    const manager = this.managerList.find(
      (user) => user.applicationUserId === managerId
    );
    return manager
      ? `${manager.firstName} ${
          manager.middleName ? manager.middleName + ' ' : ''
        }${manager.lastName}`
      : '';
  }

  selectAll(event: any) {
    this.selectedUsers = event.target.checked ? [...this.dataSource] : [];
    this.allSelected = event.target.checked;
  }

  isSelected(user: ApplicationUser): boolean {
    return this.selectedUsers.some(
      (u) => u.applicationUserId === user.applicationUserId
    );
  }

  selectUser(user: ApplicationUser, event: any) {
    if (event == false) {
      this.selectedUsers = this.selectedUsers.filter(
        (u) => u.applicationUserId !== user.applicationUserId
      );
      this.allSelected = false;
    } else if (event.target.checked) {
      this.selectedUsers.push(user);
    } else {
      this.selectedUsers = this.selectedUsers.filter(
        (u) => u.applicationUserId !== user.applicationUserId
      );
      this.allSelected = false;
    }
  }

  modifySelectedUsers(action: 'activate' | 'inactivate' | 'delete') {
    if (this.selectedUsers.length) {
      if (action == 'activate' || action == 'inactivate') {
        this.isLoading = true;
        this.selectedUsers.forEach((user) => {
          user.isActive = action == 'activate' ? true : false;
          const updateUserCommand = {
            applicationUserId: user.applicationUserId,
            organizationId: user.organizationId,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            userName: user.email,
            profileImagePath: user.profileImagePath,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address1: user.address1,
            address2: user.address2,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            interestIds: user.userInterests,
            jobTitleId: user.jobTitleId,
            teamId: user.organizationTeamId,
            userSkills: this.addedUserSkills,
            managerId: user.managerId,
            roleId: user.roleId,
          };
          this.userService.updateOrganizationUser(updateUserCommand).subscribe({
            next: (res) => {
              const index = this.dataSource.findIndex((x) => {
                return x.applicationUserId == user.applicationUserId;
              });
              if (index !== -1) {
                this.dataSource[index].isActive =
                  action == 'activate' ? true : false;
                this.isLoading = false;
                this.selectUser(this.dataSource[index], false);
                this.toastr.success(`User ${action + 'd'} successfully.`);
              } else this.selectUser(this.dataSource[index], false);
            },
            error: (err: HttpErrorResponse) => {
              this.isLoading = false;
              this.toastr.error('An unexpected error occurred.');
            },
          });
        });
        this.selectedUsers = [];
      } else {
        Swal.fire({
          text: 'Are you sure you want to delete?',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes!',
          width: '400px',
          padding: '1rem',
        }).then((result) => {
          if (result.isConfirmed) {
            this.selectedUsers.forEach((user) => {
              const index = this.dataSource.findIndex((x) => {
                return x.applicationUserId == user.applicationUserId;
              });
              const selectedUser = this.dataSource[index];
              if (index !== -1) this.dataSource.splice(index, 1);
              this.loading = true;
              if (
                user.applicationUserId != this.loggedInUser.applicationUserId
              ) {
                this.userService
                  .deleteOrganizationUser(
                    user.organizationId,
                    user.applicationUserId
                  )
                  .subscribe({
                    next: (res) => {
                      this.getUserList();
                      this.toastr.success(`User ${action + 'd'} successfully`);
                      this.loading = false;
                    },
                    error: (err: HttpErrorResponse) => {
                      let errormsg = err.error['UsersOrganizations'];
                      this.toastr.error(errormsg);
                      this.isLoading = false;
                    },
                  });
              } else {
                this.getUserList();
                this.selectUser(selectedUser, false);
                this.toastr.error('Login User cannot be deleted');
                this.loading = false;
              }
              this.selectedUsers = [];
            });
          }
        });
      }
    }
  }
  openImportDialog(): void {
    const dialogRef = this.dialog.open(UserImportDocumentComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getUserList();
    });
  }

  // Exporting in Excel
  exportToExcel(): void {
    this.isLoading = true;
    const queryParams = {
      loggedInUserId: this.loggedInUser.applicationUserId,
      OrganizationId: this.orgId,
    };
    this.userService.exportToExcelApi(queryParams).subscribe({
      next: (res) => {
        if (res) {
          this.exportSource = res;
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
            this.exportSource
          );
          const workbook: XLSX.WorkBook = {
            Sheets: { data: worksheet },
            SheetNames: ['data'],
          };
          const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          });
          this.saveAsExcelFile(excelBuffer, 'user_data');
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const url: string = window.URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = fileName + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  navigateToAddUser() {
    const orgId = this.route.snapshot.paramMap.get('organizationId');
    if (orgId)
      this.router.navigate([
        `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${orgId}/users/add`,
      ]);
    else
      this.router.navigate([`${this.loggedInUser.organizationId}/add`], {
        relativeTo: this.route,
      });
  }

  navigateToUserEdit(userId: string) {
    const orgId = this.route.snapshot.paramMap.get('organizationId');
    if (orgId) {
      this.router.navigate([
        `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${orgId}/users/${userId}/overview/edit`,
      ]);
    } else {
      this.router.navigate(
        [`${this.loggedInUser.organizationId}/${userId}/overview/edit`],
        { relativeTo: this.route }
      );
    }
  }

  navigateToUserView(userId: string) {
    const orgId = this.route.snapshot.paramMap.get('organizationId');
    if (orgId) {
      this.router.navigate([
        `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${orgId}/users/${userId}/overview`,
      ]);
    } else {
      this.router.navigate(
        [`${this.loggedInUser.organizationId}/${userId}/overview`],
        { relativeTo: this.route }
      );
    }
  }

  back() {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home`,
    ]);
  }

  //Mobile View changes
  userFilter(event: any) {
    const value = event.target.value.toLowerCase();
    if (value) {
      this.filteredUsers = this.dataSource.filter((user) =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(value)
      );
      this.totalusers = this.filteredUsers.length;
      this.activerecords = this.filteredUsers.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveusers = this.filteredUsers.filter(
        (user) => !user.isActive
      ).length;
    } else {
      this.filteredUsers = this.dataSource;
      this.totalusers = this.filteredUsers.length;
      this.activerecords = this.filteredUsers.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveusers = this.filteredUsers.filter(
        (user) => !user.isActive
      ).length;
    }
  }
}
