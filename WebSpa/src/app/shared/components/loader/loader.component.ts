import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import {
  ApplicationUser,
  Badge,
  GetResumeDetailsResponse,
  UserBadge,
  UserSkills,
} from '../../models/commonmodel';
import { AppConstants } from '@app/shared/App-Constants';
import { UserBadgeServiceService } from '@app/shared/services/userBadgeService.service';
import { environment } from 'src/environments/environment';
import { SkillService } from '@app/shared/services/skill.service';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  isPublicroute: boolean = false;
  userId: any;
  resumeuserId: any;
  userBadgeData: UserBadge[] = [];
  isBadgeRoute: boolean = false;
  isResumeRoute: boolean = false;
  isMobile: boolean = false;
  resumeDetails!: GetResumeDetailsResponse;
  userSkills: UserSkills[] = [];
  badges: Badge[] = [];
  showNavigator: boolean = false;
  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 2,
    },
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '600px',
      numVisible: 2,
      numScroll: 1,
    },
  ];

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private userBadge: UserBadgeServiceService,
    private skillService: SkillService,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    // setTimeout(() => {
    //   const segments = this.route.snapshot.url;
    //   let currentPath = segments.map((segment) => segment.path).join('/');
    //   // Fallback: If currentPath is empty, use this.router.url
    //   if (!currentPath) {
    //     currentPath = this.router.url.slice(1);
    //     this.userId = currentPath.split('/')[1];
    //   }
    //   //Only force login if the route is NOT public
    //   if (!this.authService.isLoggedIn() && !this.isPublicRoute(currentPath)) {
    //     this.authService.login();
    //   } else if (this.isPublicRoute(currentPath)) {
    //     this.isPublicroute = true;
    //     if (currentPath.startsWith('view-badge/') && this.userId) {
    //       this.isBadgeRoute = true;
    //       this.getUserbadges(this.userId);
    //     } else if (currentPath.startsWith('resume/')) {
    //       this.isResumeRoute = true;
    //       const parts = currentPath.split('/');
    //       this.resumeuserId = parts[2];
    //       if (this.resumeuserId) {
    //         this.getUserResume();
    //       }
    //     }
    //   } else {
    //     const storedUser = localStorage.getItem('loggedInUser');
    //     const emulateuserData = localStorage.getItem('emulatedUser');
    //     if (emulateuserData) {
    //       this.loggedInUser = JSON.parse(emulateuserData);
    //     } else if (storedUser) {
    //       this.loggedInUser = JSON.parse(storedUser);
    //     }
    //     this.router.navigate([
    //       this.loggedInUser.organizationName,
    //       this.loggedInUser.roleName,
    //       'home',
    //     ]);
    //     // if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager || this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin) {
    //     //   this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'users']);
    //     // }
    //     // else if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin) {
    //     //   this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'tenant']);
    //     // }
    //     // else {
    //     //   this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'users', this.loggedInUser.organizationId, this.loggedInUser.applicationUserId, 'overview']);
    //     // }
    //   }
    // }, 1000);
    // this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  getUserbadges(userId: any) {
    this.userBadge.getUserBadges(userId).subscribe({
      next: (res) => {
        this.userBadgeData = res;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getUserResume() {
    this.skillService.getResumeDetails(this.resumeuserId).subscribe({
      next: (res) => {
        this.resumeDetails = {
          userFullName: res.userFullName,
          email: res.email,
          profileImage: res.profileImage,
          city: res.city,
          district: res.district,
          state: res.state,
          country: res.country,
          mobile: res.mobile,
          address: res.address,
          jobTitle: res.jobTitle,
          jobTitleId: res.jobTitleId,
          badges: res.badges,
          userSkills: res.userSkills,
          certificateId: res.certificateId,
          certificate: res.certificate,
        };
        this.userSkills = this.resumeDetails.userSkills;
        this.badges = this.resumeDetails.badges;
        this.updateNavigatorVisibility();
      },
    });
  }

  updateNavigatorVisibility() {
    const screenWidth = window.innerWidth;
    if (screenWidth < 767) {
      this.showNavigator = this.resumeDetails.badges.length > 2;
    } else if (screenWidth < 1024) {
      this.showNavigator = this.resumeDetails.badges.length > 3;
    } else {
      this.showNavigator = this.resumeDetails.badges.length > 4;
    }
  }

  SignIn() {
    const url = environment.redirectUri;
    window.open(url, '_blank');
  }
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  private isPublicRoute(currentPath: string): boolean {
    const publicRoutePatterns = [
      'view-badge', // matches /view-badge/*
      'resume', // matches /resume/*/*/*
    ];

    const basePath = currentPath.split('/')[0];
    return publicRoutePatterns.includes(basePath);
  }
}
