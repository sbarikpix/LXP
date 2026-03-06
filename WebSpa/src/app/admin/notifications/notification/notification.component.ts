import { Platform } from '@angular/cdk/platform';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  ApplicationUser,
  GetScheduledAssessmentsResponseModel,
  learningJourneyByIdResponse,
  learningJourneyResponse,
  SelectedSkills,
  UserAssignedContent,
} from '@app/shared/models/commonmodel';
import { ExamServicesService } from '@app/shared/services/assessment-services.service';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { UserContentService } from '@app/shared/services/usercontent.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  notifications: GetScheduledAssessmentsResponseModel[] = [];
  contentnotifications: UserAssignedContent[] = [];
  selectedSkills: SelectedSkills = {
    assessmentName: '',
    selectedskills: [],
    questionIds: [],
  };
  isEmulating: boolean = false;
  learningusersnotifications: learningJourneyResponse[] = [];
  userlearninglist: learningJourneyByIdResponse[] = [];
  isMobile: boolean = false;
  constructor(
    private toastr: ToastrService,
    private assessmentservice: ExamServicesService,
    private emulateservice: EmulateUserService,
    private router: Router,
    private title: Title,
    private contentservice: UserContentService,
    private learningservice: LearningjourneyService,
    private journeyservice: LearningjourneyService,
    private platform: Platform
  ) {
    this.title.setTitle('Notifications');
  }

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
        this.isEmulating = true;
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    this.getscheduledAssessments(this.loggedInUser.applicationUserId);
    this.getuserassignedContent(this.loggedInUser.applicationUserId);
    this.getAllUserlearnings();
    this.getuserlearningjourneydetails();
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getscheduledAssessments(userId: string) {
    this.assessmentservice.getscheduledAssessments(userId).subscribe({
      next: (res) => {
        if (res) {
          this.notifications = res.sort(
            (a, b) =>
              new Date(b.assignedDate).getTime() -
              new Date(a.assignedDate).getTime()
          );
        }
      },
      error: (err) => {},
    });
  }

  getuserassignedContent(applicationUserId: string) {
    this.contentservice.getuserassignedContent(applicationUserId).subscribe({
      next: (res) => {
        this.contentnotifications = res.sort(
          (a, b) =>
            new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
        );
      },
      error: (err) => {},
    });
  }

  getAllUserlearnings() {
    this.journeyservice
      .getalllearningjourneys('', this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.learningusersnotifications = res.sort(
            (a, b) =>
              new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
          );
        },
        error: (err) => {},
      });
  }

  getuserlearningjourneydetails() {
    this.learningservice
      .getuserlearningJourneydetails('', this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.userlearninglist = res;
        },
      });
  }

  markAsRead(notification: any) {
    if (!notification.isRead && notification.userLearningJourneyId) {
      notification.isRead = true;
      this.updatelearningjourney(notification.userLearningJourneyId);
    } else {
      if (!notification.isRead) {
        notification.isRead = true;
        this.updateNotificationStatus(notification);
      }
    }
  }

  markAllAsRead() {
    this.contentnotifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.isRead = true;
        this.updateNotificationStatus(notification);
      }
    });
    this.learningusersnotifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.isRead = true;
        this.updatelearningjourney(notification.userLearningJourneyId);
      }
    });
  }

  updateNotificationStatus(notification: UserAssignedContent) {
    this.contentservice
      .updateuserassignedContent(notification.userAssignedContentId)
      .subscribe({
        next: (res) => {},
        error: (err) => {},
      });
  }

  updatelearningjourney(userLearningJourneyId: any) {
    this.journeyservice
      .updatesubmodulejourney('', userLearningJourneyId, false)
      .subscribe({
        next: (res) => {},
        error: (err) => {},
      });
  }

  formatAssignedDate(assignedDate: string): string {
    const date = new Date(assignedDate);

    const options: Intl.DateTimeFormatOptions = {
      // weekday: 'long', // Full day name (e.g., Monday)
      year: 'numeric',
      month: 'long', // Full month name (e.g., January)
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true, // Display time in 12-hour format
    };

    return date.toLocaleDateString('en-US', options);
  }

  startassessment(res: GetScheduledAssessmentsResponseModel) {
    if (res && res.skillsData?.length > 0) {
      const incompleteSkillLabels: string[] = [];
      res.skillsData.forEach((selectedSkill) => {
        const matchingLearning = this.userlearninglist.find(
          (userLearning) => userLearning.skillId === selectedSkill.skillId
        );

        if (matchingLearning) {
          const matchingSubModule =
            matchingLearning.getLearningJourneySubModuleResponses.find(
              (subModule) => subModule.levelId === selectedSkill.levelId
            );

          if (!matchingSubModule) {
            incompleteSkillLabels.push(
              `${selectedSkill.skillName} (${selectedSkill.levelName})`
            );
          } else if (!matchingSubModule.isCompleted) {
            incompleteSkillLabels.push(
              `${selectedSkill.skillName} (${selectedSkill.levelName})`
            );
          }
        } else {
          incompleteSkillLabels.push(
            `${selectedSkill.skillName} (${selectedSkill.levelName})`
          );
        }
      });

      if (incompleteSkillLabels.length > 0) {
        const formatted = incompleteSkillLabels.join(', ');
        this.toastr.warning(
          `Please complete the following from training before taking the assessment: ${formatted}`
        );
      } else {
        const assessmentName = res.assessmentName || '';
        const selectedquestions = res.questionsData?.map((question) => ({
          questionId: question.questionId,
        }));
        const selectedskills = res.skillsData.map((skill) => ({
          skillId: skill.skillId,
          skillLevelId: skill.levelId,
        }));
        this.selectedSkills.selectedskills.push(...selectedskills);
        this.selectedSkills.questionIds.push(...selectedquestions);
        this.selectedSkills.assessmentName = assessmentName;

        this.emulateservice.setSkills(this.selectedSkills);
        this.router.navigate([
          `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/assessment/startexam/${res.userAssignedAssessmentId}`,
        ]);
      }
    }
  }
}
