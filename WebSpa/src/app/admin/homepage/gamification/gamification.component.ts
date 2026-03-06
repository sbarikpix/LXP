import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TableModule } from 'primeng/table';
import { AddBadgeDialogComponent } from './add-badge-dialog/add-badge-dialog.component';
import { UserBadgeServiceService } from '@app/shared/services/userBadgeService.service';
import { Title } from '@angular/platform-browser';
import { AppConstants } from '@app/shared/App-Constants';
import { environment } from 'src/environments/environment';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import {
  ApplicationUser,
  badgeCriteria,
  badgesdata,
  UserBadge,
  userPoinResponses,
} from '@app/shared/models/commonmodel';
import { Platform } from '@angular/cdk/platform';
@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrl: './gamification.component.scss',
})
export class GamificationComponent {
  @ViewChild('linkedinBadgesUI', { static: false })
  linkedinBadgesRef!: ElementRef;
  loggedInUser!: ApplicationUser;
  userBadgeData: UserBadge[] = [];
  badges: badgesdata[] = [];
  topUser: userPoinResponses[] = [];
  userpoints: any;
  loading: boolean = false;
  linkedInBadges: UserBadge[] = [];
  combinedBadges: any[] = [];
  badgeCriteria: badgeCriteria[] = [];

  responsiveOptions = [
    {
      breakpoint: '1500px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '767px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '500px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  showNavigator: boolean = true;
  showBadgeNavigator: boolean = true;
  cardVidibility: number = 0;
  isMobile: boolean = false;

  constructor(
    private dialog: MatDialog,
    private userBadge: UserBadgeServiceService,
    private toastr: ToastrService,
    private title: Title,
    private platform: Platform
  ) {
    this.title.setTitle('Gamification');
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

    if (
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.Global_admin ||
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.admin ||
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.manager
    ) {
      this.getBadges();
      this.getAssignBadges();
    }
    this.fetchUserBadges();
    this.getUserpoints();

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  fetchUserBadges() {
    this.loading = true;
    this.userBadge
      .getUserBadges(this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.userBadgeData = res;
          this.loading = false;
          if (this.userBadgeData.length > 0) {
            this.updateNavigatorVisibility();
          }
        },
        error: (err) => {
          this.loading = false;
        },
      });
  }

  getUserpoints() {
    this.loading = true;
    this.userBadge
      .getUserPoints(
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (res) => {
          this.topUser = res;
          this.userpoints = this.topUser.find(
            (x) => x.applicationUserId == this.loggedInUser.applicationUserId
          )?.points;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
        },
      });
  }

  getBadges() {
    this.userBadge
      .getbadges(this.loggedInUser.applicationUserId)
      .subscribe((res) => {
        this.badges = res;
        this.checkAndCombineBadges();
      });
  }

  getAssignBadges() {
    this.userBadge
      .getBadgeCriteria(this.loggedInUser.applicationUserId, this.loggedInUser.organizationId)
      .subscribe((res) => {
        this.badgeCriteria = res;
        this.checkAndCombineBadges();
      });
  }

  checkAndCombineBadges() {
    if (this.badges.length > 0 || this.badgeCriteria.length > 0) {
      this.combineBadges();
    }
  }

  combineBadges() {
    // Combine both badges and badgeCriteria into one array
    this.combinedBadges = [...this.badges, ...this.badgeCriteria];
    if (this.combinedBadges.length) {
      this.updateNavigatorVisibility();
    }
  }

  generateLinkedInUrl(badge: UserBadge): any {
    // if (badge.isLinkedIn) {
    //   this.toastr.warning('Already share to linkedIn');
    // } else {
    const command: UserBadge = {
      userBadgeId: badge.userBadgeId,
      badgeId: badge.badgeId,
      name: badge.name,
      description: badge.description,
      badgeUrl: badge.badgeUrl,
      isActive: true,
      isLinkedIn: true,
      skillId: badge.skillId,
      skillName: badge.skillName,
      jobtitleName: badge.jobtitleName,
      levelId: badge.levelId,
      levelName: badge.levelName,
      createdOn: badge.createdOn,
      updatedOn: badge.updatedOn,
      organizationName: badge.organizationName,
      userId: this.loggedInUser.applicationUserId,
    };
    this.loading = true;
    this.userBadge.updateuserbadge(command).subscribe({
      next: (res) => {
        if (res) {
          const createdDate = new Date(badge.createdOn);
          const issueYear = createdDate.getUTCFullYear();
          const issueMonth = createdDate.getUTCMonth() + 1;
          const url =
            environment.redirectUri +
            '/view-badge/' + this.loggedInUser.organizationId + "/" +
            this.loggedInUser.applicationUserId;
          const linkedInUrl = `https://www.linkedin.com/profile/add?name=${badge.name}&organizationName=${badge.organizationName}
            &issueYear=${issueYear}&issueMonth=${issueMonth}&&certId=${badge.userBadgeId}&certUrl=${url}`;
          window.open(linkedInUrl, '_blank');
          this.fetchUserBadges();
          this.loading = false;
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
      },
    });
    // }
  }

  openAddBadgeDialog() {
    const dialogRef = this.dialog.open(AddBadgeDialogComponent, {
      disableClose: true,
      width: 'auto',
      maxWidth: '100vw',
      maxHeight: '70vh',
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.getBadges();
      this.getAssignBadges();
    });
  }

  updateNavigatorVisibility() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 768) {
      this.showNavigator = this.combinedBadges.length > 1;
      this.showBadgeNavigator = this.userBadgeData.length > 1;
    } else if (screenWidth <= 1024) {
      this.showNavigator = this.combinedBadges.length > 2;
      this.showBadgeNavigator = this.userBadgeData.length > 2;
    } else {
      this.showNavigator = this.combinedBadges.length > 3;
      this.showBadgeNavigator = this.userBadgeData.length > 3;
    }
  }

  back() {
    window.history.back();
  }
}
