import { Platform } from '@angular/cdk/platform';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AppConstants } from '@app/shared/App-Constants';
import {
  ApplicationUser,
  GetallOrgUsersquery,
  SelectedSkills,
  SkillLevel,
  UserSkillsModel,
} from '@app/shared/models/commonmodel';
import {
  ExamServicesService,
  skillDetails,
} from '@app/shared/services/assessment-services.service';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { InterestService } from '@app/shared/services/interest.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { concatMap, forkJoin, of, tap } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  Interests: Interests[] = [];
  isLoading: boolean = false;
  isPre_assesment: boolean = false;
  UserAssessmentMetrices: any[] = [];
  UserAssessmentAttempts: any[] = [];
  allUserSkills: SelectedSkills = {
    assessmentName: '',
    selectedskills: [],
    questionIds: [],
  };
  levelsList: SkillLevel[] = [];
  SkillsList: UserSkillsModel[] = [];
  backgroundcolors = ['#d2c6e0', '#fce0c6', '#d0eff3', '#fed0c1', '#A1A5A8'];
  // colors = ['#5f318e', '#f58e33', '#56c6d3', '#fc5722', '#0c0c10'];
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Top Interested Skills',
        type: 'bar',
        barThickness: 50, // Decrease this value
        maxBarThickness: 40, // Optional maximum thickness
        borderRadius: 6,
        backgroundColor: [
          '#5f318e',
          '#f58e33',
          '#56c6d3',
          '#fc5722',
          '#474c60',
          '#56c6d3',
          '#474c60',
          '#5f318e',
          '#f58e33',
          '#fc5722',
        ],
      },
    ],
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false, // This will hide the vertical grid lines
        },
        ticks: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
      },
    },
  };

  public lineChartLegend = true;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [], // Dynamically populated with assessment names
    datasets: [
      {
        data: [], // Dynamically populated with obtained marks
        label: 'Results',
        fill: true,
        tension: 0.5,
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66, 165, 245, 0.2)',
        pointBackgroundColor: '#1976d2',
        pointBorderColor: '#ffffff',
      },
    ],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Assessments',
        },
        ticks: {
          display: false, // Hides x-axis labels
        },
      },
      y: {
        title: {
          display: true,
          text: 'Obtained Marks',
        },
        beginAtZero: true,
      },
    },
  };
  totalusers: number = 0;
  platformOrgs: number = 0;
  platformUsers: number = 0;
  platformLearningJourneys: number = 0;
  isMobile: boolean = false;
  isEmulated: boolean = false;
  constructor(
    private skillService: SkillService,
    private interestService: InterestService,
    private examservice: ExamServicesService,
    private userservice: UserService,
    // private toastr: ToastrService,
    private router: Router,
    private title: Title,
    private emulateservice: EmulateUserService,
    private platform: Platform
  ) {
    this.title.setTitle('Home');
  }
  ngOnInit() {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
      this.isEmulated = true;
    } else if (userData) {
      this.loggedInUser = JSON.parse(userData);
      this.isEmulated = false;
    }
    this.getallusers();
    this.getUserAssessmentAttempts();
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getallusers() {
    let query: GetallOrgUsersquery = {
      page: 0,
      pagesize: 10,
      loggedInUserId: this.loggedInUser.applicationUserId,
      organizationId: this.loggedInUser.organizationId,
    };
    this.isLoading = true;
    this.userservice.getAllOrganizationUsers(query).subscribe({
      next: (res) => {
        this.totalusers = res.total;
        this.platformOrgs = res.platformOrgs;
        this.platformUsers = res.platformUsers;
        this.platformLearningJourneys = res.platformLearningJourneys;
        forkJoin({
          userskills: this.skillService.getOrgUsersSkills(
            this.loggedInUser.organizationId
          ),
          orguserinterests: this.interestService.getOrgUserInterests(
            this.loggedInUser.organizationId
          ),
          usermetrices: this.examservice.getAssessmentMetrices(
            this.loggedInUser.applicationUserId,
            this.loggedInUser.organizationId
          ),
        })
          .pipe(
            tap(({ userskills, orguserinterests, usermetrices }) => {
              this.getorgUsersskills(userskills);
              this.getOrgUserInterests(orguserinterests);
              this.getuserMetrices(usermetrices);
            }),
            concatMap((res) => {
              this.isLoading = false;
              return of(null);
            })
          )
          .subscribe({
            error: (err) => {
              this.isLoading = false;
              // this.toastr.error('An unexpected error occurred.');
            },
          });
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  getorgUsersskills(userskills: any) {
    if (userskills) {
      const labels = userskills.map(
        (item: { skillName: any }) => item.skillName
      );
      const data = userskills.map(
        (item: { skillCount: any }) => item.skillCount
      );
      this.barChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
            label: 'Top Interested Skills',
            type: 'bar',
            barThickness: 50, // Decrease this value
            maxBarThickness: 40, // Optional maximum thickness
            borderRadius: 6,
            backgroundColor: [
              '#5f318e',
              '#f58e33',
              '#56c6d3',
              '#fc5722',
              '#474c60',
              '#56c6d3',
              '#474c60',
              '#5f318e',
              '#f58e33',
              '#fc5722',
            ],
          },
        ],
      };
    }
  }

  getOrgUserInterests(orguserinterests: Interests[]) {
    if (orguserinterests) {
      this.Interests = orguserinterests;
    }
  }

  getuserMetrices(usermetrices: any[]) {
    if (usermetrices) {
      this.UserAssessmentMetrices = usermetrices;
      if (
        this.loggedInUser.roleName ==
          AppConstants.ChasmanovoRoles.Global_admin ||
        this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.manager ||
        this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.admin
      ) {
        this.setLineChartAdminData(this.UserAssessmentMetrices);
      } else {
        this.setLineChartData(this.UserAssessmentMetrices);
      }
    }
  }

  setLineChartData(data: any[]) {
    const labels: string[] = [];
    const marks: number[] = [];

    data.forEach((item) => {
      labels.push(item.assessmentName);
      marks.push(item.optainedMarks);
    });

    this.updatelinechart(labels, marks);
  }

  setLineChartAdminData(data: any[]) {
    const labels: string[] = [];
    const marks: number[] = [];

    data.forEach((item) => {
      labels.push(item.applicationUser.email);
      marks.push(item.optainedMarks);
    });

    this.updatelinechart(labels, marks);
  }

  updatelinechart(label: any, data: any) {
    this.lineChartData = {
      labels: label,
      datasets: [
        {
          data: data,
          label: 'Results',
          fill: true,
          tension: 0.5,
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.2)',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#ffffff',
        },
      ],
    };
  }

  allusers() {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/users`,
    ]);
  }

  getUserAssessmentAttempts() {
    this.isLoading = true;
    this.examservice
      .getAssessmentMetrices(
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (res) => {
          this.UserAssessmentAttempts = res;
          if (
            this.UserAssessmentAttempts.length &&
            this.loggedInUser.roleName != 'Learner'
          ) {
            this.isPre_assesment = false;
          } else if (
            !this.UserAssessmentAttempts.length &&
            this.loggedInUser.roleName == 'Learner'
          ) {
            this.isPre_assesment = true;
            if (!this.isEmulated) {
              Swal.fire({
                text: 'Please attened the Pre-Assessment based on the selected skills',
                confirmButtonColor: '#fc5723',
                confirmButtonText: 'Proceed',
                allowOutsideClick: false,
                backdrop: true,
              }).then((result) => {
                if (result.isConfirmed) {
                  this.getuserSkills();
                }
              });
            } else if (this.isEmulated) {
              this.isPre_assesment = false;
            }
          }

          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
    // this.isLoading = false;
  }

  getuserSkills() {
    this.isLoading = true;
    this.skillService
      .getuserSkills(this.loggedInUser.applicationUserId, '')
      .subscribe({
        next: (res) => {
          this.SkillsList = res;
          this.SkillsList.forEach((x) => {
            const skilldetails: skillDetails = {
              skillId: x.skillId,
              skillLevelId: x.skillLevelId,
            };
            this.allUserSkills.selectedskills.push(skilldetails);
          });
          this.isLoading = false;
          this.onstartexam(this.allUserSkills);
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
    // this.isLoading = false;
  }

  onstartexam(userSkill: SelectedSkills) {
    userSkill.questionIds = [];
    this.emulateservice.setSkills(userSkill);
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/assessment/startexam`,
    ]);
  }
}

export class Interests {
  interestId: any;
  name: any;
  interestCount: any;
}
