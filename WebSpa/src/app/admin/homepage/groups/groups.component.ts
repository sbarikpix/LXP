import { Platform } from '@angular/cdk/platform';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ApplicationUser,
  GroupCommand,
  Groups,
} from '@app/shared/models/commonmodel';
import { GroupsService } from '@app/shared/services/groups.service';
import { AddGroupDialogComponent } from './add-group-dialog/add-group-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { ViewGroupDialogComponent } from './view-group-dialog/view-group-dialog/view-group-dialog.component';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { privateDecrypt } from 'crypto';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss',
})
export class GroupsComponent implements OnInit {
  private allGroups: Groups[] = [];
  groupList: Groups[] = [];
  loading: boolean = false;
  isLoading: boolean = false;
  isMobile: boolean = false;
  totalRecords: number = 0;
  loggedInUser!: ApplicationUser;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  groupColors = [
    '#5B9BD5',
    '#ED7D31',
    '#A5A5A5',
    '#FFC000',
    '#4472C4',
    '#70AD47',
    '#264478',
    '#FF6F61',
    '#9E480E',
    '#4BACC6',
  ];
  groupdata: GroupCommand[] = [];

  constructor(
    private platform: Platform,
    private groupService: GroupsService,
    private dialog: MatDialog,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title
  ) {
    this.title.setTitle('Groups');
  }

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    if (userId !== this.loggedInUser.applicationUserId) {
      this.router.navigate(['/unauthorized']);
    }
    this.getGroups(this.loggedInUser.organizationId);

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getColorIndex(id: string | number): number {
    const hash =
      typeof id === 'string'
        ? Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0)
        : id;
    return hash % this.groupColors.length;
  }

  getStripColor(id: string | number): string {
    const index = this.getColorIndex(id);
    return this.groupColors[index];
  }

  getAvatarColor(id: string | number): string {
    let index = this.getColorIndex(id) + 1;
    if (index >= this.groupColors.length) index = 0;
    return this.groupColors[index];
  }

  getGroups(organizationId: string) {
    this.isLoading = true;
    this.groupService.getAllGroups(organizationId).subscribe({
      next: (res: any) => {
        this.allGroups = res.sort((a: Groups, b: Groups) =>
          a.groupName.localeCompare(b.groupName)
        );
        this.groupList = [...res];
        this.totalRecords = res.length;
        this.isLoading = false;
        this.filterByStatus(this.statusFilter);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  filterByStatus(status: 'all' | 'active' | 'inactive') {
    this.statusFilter = status;
    if (status === 'all') {
      this.groupList = [...this.allGroups];
    } else if (status === 'active') {
      this.groupList = this.allGroups.filter(
        (group) => group.isActive === true
      );
    } else if (status === 'inactive') {
      this.groupList = this.allGroups.filter(
        (group) => group.isActive === false
      );
    }
  }

  openAddGroupDialog() {
    const dialogRef = this.dialog.open(AddGroupDialogComponent, {
      width: '50%',
      maxWidth: '100%',
      disableClose: true,
      data: { GroupId: null },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getGroups(this.loggedInUser.organizationId);
    });
  }

  onEdit(group: Groups) {
    const dialogRef = this.dialog.open(AddGroupDialogComponent, {
      width: '50%',
      maxWidth: '100%',
      disableClose: true,
      data: { GroupId: group.groupId },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getGroups(this.loggedInUser.organizationId);
    });
  }

  onDelete(groupId: string) {
    this.isLoading = true;
    this.groupService.deleteGroup(groupId).subscribe({
      next: (res: any) => {
        if (res.isSuccess === true) {
          this.toaster.success(res.message);
          this.getGroups(this.loggedInUser.organizationId);
          this.isLoading = false;
        } else {
          console.error('Error Deleting group:', res);
          this.toaster.error(res.message);
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
        let errmsg = err?.error?.message || 'Failed to Delete group';
        this.toaster.error(errmsg);
        console.error('Error Deleting group:', err);
      },
    });
  }

  onView(groupId: string) {
    this.router.navigate(['view', groupId], {
      relativeTo: this.route,
    });
  }

  filterGroup(term: string) {
    const value = term?.trim().toLowerCase();
    if (!value) {
      this.groupList = [...this.allGroups];
      return;
    }
    this.groupList = this.allGroups.filter((g) =>
      g.groupName.toLowerCase().includes(value)
    );
  }

  changeGroupStatus(group: Groups) {
    this.groupService
      .updateGroup({
        groupId: group.groupId,
        groupName: group.groupName,
        description: group.description,
        isActive: !group.isActive,
        organizationId: this.loggedInUser.organizationId,
      })
      .subscribe({
        next: (res: any) => {
          this.toaster.success('Group status updated successfully');
          this.getGroups(this.loggedInUser.organizationId);
        },
        error: (err) => {
          console.error('Error updating group status:', err);
          this.toaster.error('Failed to update group status');
        },
      });
  }

  getInitials(groupName: string): string {
    if (!groupName) return '';
    const names = groupName.split(' ');
    let initials = '';
    for (let name of names) {
      if (name && name.length > 0) {
        initials += name[0].toUpperCase();
      }
    }
    return initials;
  }

  refreshGroup(groupId: string) {
    const organaizationId = this.loggedInUser.organizationId;
    this.groupService.refreshGroup(groupId, organaizationId).subscribe({
      next: (res: any) => {
        this.getGroups(this.loggedInUser.organizationId);
        this.toaster.success('Group refreshed successfully');
      },
      error: (err) => {
        console.error('Error refreshing group:', err);
        this.toaster.error('Failed to refresh group');
      },
    });
  }

  back() {
    window.history.back();
  }
}
