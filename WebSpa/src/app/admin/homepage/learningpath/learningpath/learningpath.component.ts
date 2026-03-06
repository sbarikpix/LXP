import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import {
  ApplicationUser,
  GetAllCoursesResponse,
  UserContentbySkillCommand,
} from '@app/shared/models/commonmodel';
import { SkillService } from '@app/shared/services/skill.service';
import {
  CoursesServicesService,
  GetAllCoursesQuery,
} from '@app/shared/services/courses-services.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UserContentService } from '@app/shared/services/usercontent.service';
import { Platform } from '@angular/cdk/platform';
@Component({
  selector: 'app-learningpath',
  templateUrl: './learningpath.component.html',
  styleUrls: ['./learningpath.component.scss'],
})
export class LearningpathComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  courseResponse: GetAllCoursesResponse[] = [];
  searchcourseResponse: GetAllCoursesResponse[] = [];
  contentResponse: GetAllCoursesResponse[] = [];
  searchcontentResponse: GetAllCoursesResponse[] = [];
  isLoading: boolean = false;
  searchValue: string = '';
  userId: any;
  isMobile: boolean = false;

  constructor(
    private location: Location,
    private skillservice: SkillService,
    private coursesservice: CoursesServicesService,
    private router: Router,
    private route: ActivatedRoute,
    private contentservice: UserContentService,
    private title: Title,
    private platfrom: Platform
  ) {
    this.title.setTitle('Learningpath');
  }

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    this.route.paramMap.subscribe({
      next: (res) => {
        const skillId = res.get('skillId');
        // const integrationIds = res.get('integrationId');
        // const novoskillIds = res.get('novoskillId');
        const levelId = res.get('levelId');
        this.userId = res.get('userId');
        if (!this.userId) {
          this.userId = this.loggedInUser.applicationUserId;
        }
        if (
          skillId !== null &&
          levelId !== null &&
          skillId !== 'null' &&
          levelId !== 'null'
        ) {
          this.getallcourses(skillId, levelId);
        }
      },
    });
    if (this.platfrom.ANDROID || this.platfrom.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getuserskillcontent(skillId: any, levelId: any) {
    const command: UserContentbySkillCommand = {
      userId: this.userId,
      skillId: skillId,
      skillLevelId: levelId,
    };
    this.contentservice.getuserskillcontent(command).subscribe({
      next: (res) => {
        this.contentResponse = res;
        this.courseResponse = this.courseResponse.concat(this.contentResponse);
        this.searchcontentResponse = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  getallcourses(skillId: any, levelId: any) {
    const query: GetAllCoursesQuery = {
      userId: this.userId,
      skillId: skillId,
      levelId: levelId,
    };
    this.isLoading = true;
    this.coursesservice.getAllcourses(query).subscribe({
      next: (res: GetAllCoursesResponse[]) => {
        this.courseResponse = res;
        this.searchcourseResponse = res;
        this.getuserskillcontent(skillId, levelId);
      },

      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  allstatus() {
    this.courseResponse = this.searchcourseResponse;
    this.contentResponse = this.searchcontentResponse;
    this.clearSearch();
  }

  filterList(event?: Event) {
    if (this.searchValue) {
      const searchValue = this.searchValue.toLowerCase();
      const searchlists = this.searchcourseResponse.concat(
        this.searchcontentResponse
      );
      this.courseResponse = searchlists.filter(
        (item) =>
          item.activityName?.toLowerCase().includes(searchValue) ||
          item.title.toLowerCase().includes(searchValue)
      );
    } else {
      this.courseResponse = this.searchcourseResponse.concat(
        this.searchcontentResponse
      );
    }
  }

  clearSearch() {
    this.searchValue = '';
    this.filterList();
  }

  startcourse(cbtpath: any) {
    window.open(cbtpath, '_blank');
  }

  back() {
    this.location.back();
  }
}
