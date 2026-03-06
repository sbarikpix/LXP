import { Platform } from '@angular/cdk/platform';
import { Component, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  Badge,
  badgesdata,
  GetResumeDetailsResponse,
  UserSkills,
} from '@app/shared/models/commonmodel';
import { SkillService } from '@app/shared/services/skill.service';

@Component({
  selector: 'app-resume-template',
  templateUrl: './resume-template.component.html',
  styleUrl: './resume-template.component.scss',
})
export class ResumeTemplateComponent implements OnInit {
  userId: any;
  resumeDetails!: GetResumeDetailsResponse;
  userSkills: UserSkills[] = [];
  badges: Badge[] = [];
  showNavigator: boolean = false;
  isMobile: boolean = false;
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
    private route: ActivatedRoute,
    private router: Router,
    private skillService: SkillService,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    const segments = this.route.snapshot.url;

    let currentPath = segments.map((segment) => segment.path).join('/');
    // Fallback: If currentPath is empty, use this.router.url
    if (!currentPath) {
      currentPath = this.router.url.slice(1);
      this.userId = currentPath.split('/')[2];
    }

    if (this.userId) {
      this.getresumedetails();
    }
    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  getresumedetails() {
    this.skillService.getResumeDetails(this.userId).subscribe({
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
}
