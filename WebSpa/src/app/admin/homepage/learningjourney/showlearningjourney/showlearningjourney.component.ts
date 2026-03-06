import { Platform } from '@angular/cdk/platform';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  learningJourneyByIdResponse,
} from '@app/shared/models/commonmodel';
import {
  LearningjourneyService,
  userlearningjourneyCommand,
} from '@app/shared/services/learningjourney.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-showlearningjourney',
  templateUrl: './showlearningjourney.component.html',
  styleUrl: './showlearningjourney.component.scss',
})
export class ShowlearningjourneyComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  learningJourneyId: any;
  learningJourney: learningJourneyByIdResponse[] = [];
  learningJourneyTitle: any;
  userLearningJourneyId: any;
  islearningJourneyCompleted: any;
  isModuleVisible: boolean[] = [];
  overallProgress: number = 0;
  // totalModules: any;
  isLoading: boolean = false;
  isMobile: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private learningservice: LearningjourneyService,
    private toaster: ToastrService,
    private router: Router,
    private platform: Platform
  ) {
    this.route.paramMap.subscribe({
      next: (res) => {
        this.learningJourneyId = res.get('journeyId');
      },
    });
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
    this.getlearningdetails(this.learningJourneyId);

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getlearningdetails(learningJourneyId: any) {
    this.isLoading = true;
    this.learningservice
      .getuserlearningJourneydetails(
        learningJourneyId,
        this.loggedInUser.applicationUserId
      )
      .subscribe({
        next: (res) => {
          // this.learningJourney = res;
          if (res.length && res[0].learningJourneyModuleId) {
            this.learningJourney = res.map((module) => ({
              ...module,
              getLearningJourneySubModuleResponses:
                module.getLearningJourneySubModuleResponses?.sort(
                  (a, b) =>
                    this.getLevelOrder(a.levelName) -
                    this.getLevelOrder(b.levelName)
                ),
            }));
          }
          this.learningJourneyTitle = res[0].learningJourneyTitle;
          this.userLearningJourneyId = res[0].userLearningJourneyId;
          this.islearningJourneyCompleted = res[0].isCompleted;
          this.calculateProgress();
          this.isLoading = false;
        },
        error: (err) => {
          let errmsg = err.error.LearningJourney[0];
          // this.toaster.error(errmsg)
          this.isLoading = false;
        },
      });
  }

  getLevelOrder(level: string): number {
    const order: Record<string, number> = {
      Beginner: 1,
      Intermediate: 2,
      Advanced: 3,
      Expert: 4,
    };
    return order[level] ?? 99;
  }

  startLearning() {
    const command: userlearningjourneyCommand = {
      journeyId: this.learningJourneyId,
      userId: this.loggedInUser.applicationUserId,
    };
    this.isLoading = true;
    this.learningservice.adduserlearningjourney(command).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.getlearningdetails(res.message);
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  onstart(skillId: any, levelId: any) {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/learningpath/${skillId}/${levelId}/${this.loggedInUser.applicationUserId}`,
    ]);
  }

  toggleModule(m: any) {
    this.isModuleVisible[m] = !this.isModuleVisible[m];
  }

  isCompleted(submoduleId: any) {
    this.isLoading = true;
    this.learningservice
      .updatesubmodulejourney(submoduleId, '', false)
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.getlearningdetails(this.learningJourneyId);
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  calculateProgress() {
    let totalProgress = 0;
    let totalModules = this.learningJourney.length;
    this.learningJourney.forEach((module) => {
      let totalSubmodules = module.getLearningJourneySubModuleResponses?.length;
      let completedSubmodules =
        module.getLearningJourneySubModuleResponses?.filter(
          (submodule) => submodule.isCompleted
        ).length;

      module.progress =
        totalSubmodules > 0 ? (completedSubmodules / totalSubmodules) * 100 : 0;

      totalProgress +=
        module.progress * (totalSubmodules / (totalModules * totalSubmodules));
    });

    this.overallProgress = totalModules > 0 ? totalProgress : 0;
    if (this.overallProgress === 100 && !this.islearningJourneyCompleted) {
      this.updateuserlearningJourney(this.userLearningJourneyId);
    }
  }

  updateuserlearningJourney(userLearningJourneyId: any) {
    this.isLoading = true;
    this.learningservice
      .updatesubmodulejourney('', userLearningJourneyId, true)
      .subscribe({
        next: (res) => {
          // this.toaster.success("Congratulations your learning journey was completed");
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  back() {
    window.history.back();
  }
}
