import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { AssignSkillDialogComponent } from '@app/admin/skillLibrary/assign-skill-dialog/assign-skill-dialog.component';
import { AppConstants } from '@app/shared/App-Constants';
import {
  ApplicationUser,
  learningJourneyResponse,
} from '@app/shared/models/commonmodel';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { UserService } from '@app/shared/services/user.service';
import { ManagerosterPopupComponent } from './manageroster-popup/manageroster-popup.component';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-learningjourney',
  templateUrl: './learningjourney.component.html',
  styleUrl: './learningjourney.component.scss',
})
export class LearningjourneyComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  learningjourney: learningJourneyResponse[] = [];
  filteredJourney: learningJourneyResponse[] = [];
  filteredMyJourney: learningJourneyResponse[] = [];
  isLoading: boolean = false;
  learningusers: any[] = [];
  users: any[] = [];
  selectedjourney!: learningJourneyResponse;
  useralljourneys!: learningJourneyResponse[];
  assignedjourneycount: any;
  myJourneycount: any;
  currentFilterMode: 'myjourney' | 'assigned' = 'myjourney';
  isMobile: boolean = false;
  responsiveOptions: any[] = [];
  constructor(
    private journeyservice: LearningjourneyService,
    private userService: UserService,
    private title: Title,
    private dialog: MatDialog,
    private platform: Platform
  ) {
    this.title.setTitle('Learning Journey');
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
    this.getAllLearningJourneys();

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
    this.responsiveOptions = [
      {
        breakpoint: '1500px',
        numVisible: 3,
        numScroll: 2,
      },
      {
        breakpoint: '1024px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '600px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }
  getAllLearningJourneys() {
    this.isLoading = true;
    this.journeyservice
      .getalllearningjourneys(this.loggedInUser.organizationId, '')
      .subscribe({
        next: (res) => {
          this.learningjourney = res;

          if (
            this.loggedInUser.roleName !== AppConstants.ChasmanovoRoles.learner
          ) {
            this.filteredJourney = [
              {
                learningJourneyId: '',
                learningJourneyTitle: 'Start a New Learning Journey',
                description:
                  'Design a new learning journey tailored to your goals.',
                learningImage:
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Plus_symbol.svg/1200px-Plus_symbol.svg.png',
                chasmaNOVOJobTitleId: '',
                chasmaNOVOJobTitleName: 'Choose a JobCatogory',
                organizationId: '',
                organizationName: '',
                isActive: '',
                createdOn: '',
                updatedOn: '',
                unlocked: true,
              },
              ...this.learningjourney.map((journey) => {
                return { ...journey, unlocked: true };
              }),
            ];
          } else {
            this.filteredJourney = this.learningjourney;
          }
          this.myJourney();
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  myJourney() {
    this.isLoading = true;
    this.journeyservice
      .getalllearningjourneys(
        this.loggedInUser.organizationId,
        this.loggedInUser.applicationUserId
      )
      .subscribe({
        next: (res) => {
          this.filteredMyJourney = res;
          this.useralljourneys = res;
          if (
            this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.learner
          ) {
            this.filteredJourney = this.filteredJourney.filter(
              (x) =>
                !this.filteredMyJourney.some(
                  (y) => y.learningJourneyId === x.learningJourneyId
                )
            );
          } else if (
            this.loggedInUser.roleName !== AppConstants.ChasmanovoRoles.learner
          ) {
            this.filteredJourney = this.filteredJourney.map((journey) => {
              const exists = this.filteredMyJourney.some(
                (myJourney) =>
                  myJourney.learningJourneyId === journey.learningJourneyId
              );
              if (!exists) {
                journey.unlocked = false;
              }
              return journey;
            });
          }
          this.getAllUserlearnings();
          this.myJourneyfilter();
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  myJourneyfilter() {
    this.currentFilterMode = 'myjourney';
    this.filteredMyJourney = this.useralljourneys.filter((x) => !x.isAssigned);
    this.myJourneycount = this.useralljourneys.filter(
      (x) => !x.isAssigned
    ).length;
    this.assignedjourneycount = this.useralljourneys.filter(
      (x) => x.isAssigned
    ).length;
  }

  assignedjourneyfilter() {
    this.currentFilterMode = 'assigned';
    this.filteredMyJourney = this.useralljourneys.filter((x) => x.isAssigned);
  }

  filterJourney(input: any) {
    input = input.toLowerCase();
    const filtered = this.learningjourney.filter(
      (item: any) =>
        item.learningJourneyTitle.toLowerCase().includes(input) ||
        item.chasmaNOVOJobTitleName.toLowerCase().includes(input)
    );

    if (this.loggedInUser.roleName !== AppConstants.ChasmanovoRoles.learner) {
      this.filteredJourney = [
        {
          learningJourneyId: '',
          learningJourneyTitle: 'Start a New Learning Journey',
          description: 'Design a new learning journey tailored to your goals.',
          learningImage:
            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Plus_symbol.svg/1200px-Plus_symbol.svg.png',
          chasmaNOVOJobTitleId: '',
          chasmaNOVOJobTitleName: '',
          organizationId: '',
          organizationName: '',
          isActive: '',
          createdOn: '',
          updatedOn: '',
        },
        ...filtered,
      ];
      this.filteredJourney = [...this.filteredJourney];
    } else {
      this.filteredJourney = filtered;
    }
  }

  filterMyJourney(input: string) {
    input = input.toLowerCase();

    let filteredList = this.useralljourneys.filter((x) =>
      this.currentFilterMode === 'myjourney' ? !x.isAssigned : x.isAssigned
    );

    if (!input || input.trim() === '') {
      this.filteredMyJourney = filteredList;
      return;
    }

    this.filteredMyJourney = filteredList.filter(
      (item: any) =>
        item.learningJourneyTitle?.toLowerCase().includes(input) ||
        item.chasmaNOVOJobTitleName?.toLowerCase().includes(input)
    );
  }

  //this method written for assigning learning journey to user
  getAllUserlearnings() {
    this.isLoading = true;
    this.journeyservice.getalllearningjourneys('', '').subscribe({
      next: (res) => {
        this.learningusers = res;
        this.getAllOrgUsers();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  //this method written for getting users to assign
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
              (x: { applicationUserId: string; }) => x.applicationUserId !== this.loggedInUser.applicationUserId
            );
          } else if (
            this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.admin
          ) {
            this.users = res.filter(
              (x: { applicationUserId: string; roleName: string; }) =>
                x.applicationUserId !== this.loggedInUser.applicationUserId &&
                x.roleName !== AppConstants.ChasmanovoRoles.Global_admin
            );
          } else if (
            this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.manager
          ) {
            this.users = res.filter(
              (x: { applicationUserId: string; roleName: string; }) =>
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

  onAssignJourney(journey: learningJourneyResponse) {
    if (journey) {
      this.selectedjourney = journey;
    }
    const dialogRef = this.dialog.open(AssignSkillDialogComponent, {
      width: '500px',
      data: {
        users: this.users,
        learningusers: this.learningusers,
        selectedjourney: this.selectedjourney,
        mode: 'assignlearning',
      },
    });
    dialogRef.disableClose = false;
    dialogRef.afterClosed().subscribe((result) => {
      // if (result.isSuccess) {
      this.getAllUserlearnings();
      // }
    });
  }

  manageroster(learningJourneyId: any) {
    if (learningJourneyId) {
      const dialogRef = this.dialog.open(ManagerosterPopupComponent, {
        disableClose: true,
        data: { learningjourneyId: learningJourneyId },
        width: '500px',
      });
      dialogRef.disableClose = false;
    }
  }

  back() {
    window.history.back();
  }
}
