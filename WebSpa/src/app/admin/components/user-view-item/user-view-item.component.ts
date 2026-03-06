import { Component, OnInit } from '@angular/core';
import {
  ApplicationUser,
  JobTitle,
  Skill,
  SkillLevel,
  Team,
  UserSkillRating,
  UserSkillsModel,
} from '../../../shared/models/commonmodel';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { Location } from '@angular/common';
import { InterestService } from '../../../shared/services/interest.service';
import { Interest } from '../../../shared/models/commonmodel';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { JobTitleService } from '../../../shared/services/job-title.service';
import { TeamService } from '../../../shared/services/team.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { SkillLevelService } from '@app/shared/services/skill-level.service';
import { SkillService } from '@app/shared/services/skill.service';
import { MatDialog } from '@angular/material/dialog';
import { AddSkillDialogComponent } from './add-skill-dialog/add-skill-dialog.component';
import { concatMap, forkJoin, of, tap } from 'rxjs';
import { UserSkillRatingService } from '@app/shared/services/user-skill-rating.service';
import { TreeNode } from 'primeng/api';
import { Platform } from '@angular/cdk/platform';
import { AppConstants } from '@app/shared/App-Constants';

@Component({
  selector: 'app-user-view-item',
  templateUrl: './user-view-item.component.html',
  styleUrl: './user-view-item.component.scss',
})
export class UserViewItemComponent implements OnInit {
  private page = undefined;
  private pageSize = undefined;
  private searchText = undefined;

  loggedInUser!: ApplicationUser;
  interestList: Interest[] = [];
  userInterestList: Interest[] = [];
  user: ApplicationUser = {
    applicationUserId: '',
    organizationId: '',
    organizationName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    userName: '',
    profileImagePath: '',
    dateOfBirth: new Date(),
    gender: '',
    address1: '',
    address2: '',
    city: '',
    district: '',
    state: '',
    zip: '',
    country: '',
    phoneNumber: '',
    isActive: false,
    userInterests: [],
    jobTitleId: '',
    organizationTeamId: '',
    userSkills: [],
    managerId: '',
    roleId: '',
    isEmailVerified: false,
  };
  userTeam: string = '';
  userJob: string = '';
  isLoading: boolean = false;
  jobTitle?: JobTitle;
  team?: Team;
  userId: string = '';
  orgId: string = '';
  aquiredUserSkills: Skill[] = [];
  aquiredSkills: boolean = true;
  targettedSkills: boolean = false;
  interestedSkills: boolean = false;
  userSkills: UserSkillsModel[] = [];
  searchuserSkills: UserSkillsModel[] = [];
  userTargettedskills: Skill[] = [];
  searchuserTargettedskills: Skill[] = [];
  jobTitleList: JobTitle[] = [];
  searchjobTitleList: JobTitle[] = [];
  skillLevelList: SkillLevel[] = [];

  addedUserSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];

  isMobile: boolean = false;

  proficiencyCount: { [key: string]: number } = {
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
  };
  jobTitleTree: TreeNode[] = [];
  // Pie
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    cutout: '60%', // Creates the hollow effect (adjust as needed)
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      tooltip: {
        displayColors: true,
      },
    },
  };
  public pieChartLabels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  public pieChartDatasets = [
    {
      data: [20, 20, 10],
      backgroundColor: ['#36A2EB', '#FFCE56', ' #FC5723;'],
      hoverBackgroundColor: ['#36A2EB', '#FFCE56', ' #FC5723;'],
      borderWidth: 1,
    },
  ];

  public pieChartLegend = true;
  public pieChartPlugins = [];
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
        maxBarThickness: 30, // Optional maximum thickness
        backgroundColor: 'lightblue', // Optional: To add color
      },
    ],
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
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
  stars = [1, 2, 3, 4, 5];
  skillRatings: UserSkillRating[] = [];
  userSkillRatingMap: { [key: string]: number } = {};

  constructor(
    private authService: AuthenticationService,
    private location: Location,
    private interestService: InterestService,
    private route: ActivatedRoute,
    private userService: UserService,
    private jobService: JobTitleService,
    private teamService: TeamService,
    private title: Title,
    private toastr: ToastrService,
    private skillLevelService: SkillLevelService,
    private skillService: SkillService,
    private dialog: MatDialog,
    private skillRatingService: UserSkillRatingService,
    private platform: Platform,
    private router: Router
  ) {
    this.title.setTitle('MyProfile');
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
        this.userId = res.get('id')!;
        this.orgId = res.get('organizationId')!;
        if (
          this.orgId !== this.loggedInUser.organizationId &&
          this.loggedInUser.roleName !==
            AppConstants.ChasmanovoRoles.Global_admin
        ) {
          this.router.navigate(['/unauthorized']);
        }
        this.getOrganizationUser(this.userId);
      },
    });

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }
  filterSkills(value: string): UserSkillsModel[] | Skill[] | JobTitle[] {
    const Value = value.toLowerCase();
    if (this.aquiredSkills && !this.targettedSkills && !this.interestedSkills) {
      if (Value) {
        this.userSkills = this.searchuserSkills.filter((x) =>
          x.skillName?.toLowerCase().includes(Value)
        );
      } else {
        this.userSkills = this.searchuserSkills;
      }
    }
    if (!this.aquiredSkills && this.targettedSkills && !this.interestedSkills) {
      if (Value) {
        this.userTargettedskills = this.searchuserTargettedskills.filter((x) =>
          x.name.toLowerCase().includes(Value)
        );
      } else {
        this.userTargettedskills = this.searchuserTargettedskills;
      }
    }
    if (!this.aquiredSkills && !this.targettedSkills && this.interestedSkills) {
      if (Value) {
        this.jobTitleList = this.searchjobTitleList.filter((x) =>
          x.name?.toLowerCase().includes(Value)
        );
        this.getJobTitle(this.jobTitleList);
      } else {
        this.jobTitleList = this.searchjobTitleList;
        this.getJobTitle(this.jobTitleList);
      }
    }
    return [];
  }
  getOrganizationUser(userId: string) {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers(userId, this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.user = res[0];
          forkJoin({
            skillLevels: this.skillLevelService.getAllSkillLevel(),
            interestList: this.interestService.getAllInterest(userId, ''),
            jobTitleList: this.jobService.getAllOrganizationJobTitle(
              this.orgId,
              this.user.jobTitleId || ''
            ),
            orgTeam: this.teamService.getOrganizationTeams(
              this.orgId,
              this.user?.organizationTeamId || ''
            ),
            skillRatings: this.skillRatingService.getAllUserSkillRatings(
              this.userId
            ),
            usertargetedskills: this.skillService.getAllSkills(
              this.user.jobTitleId
            ),
          })
            .pipe(
              tap(
                ({
                  skillLevels,
                  interestList,
                  jobTitleList,
                  orgTeam,
                  skillRatings,
                  usertargetedskills,
                }) => {
                  this.getSkillLevels(skillLevels);
                  this.getInterestList(interestList);
                  this.searchjobTitleList = jobTitleList;
                  this.getJobTitle(jobTitleList);
                  this.getOrgTeam(orgTeam);
                  this.skillRatings = skillRatings;
                  this.getUserSkills(usertargetedskills);
                  this.getorgUsersskills();
                }
              ),
              concatMap((res) => {
                this.isLoading = false;
                return of(null);
              })
            )
            .subscribe({
              error: (err) => {
                this.isLoading = false;
                this.toastr.error('An unexpected error occurred.');
              },
            });
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toastr.error('An unexpected error occurred.');
        },
      });
  }

  getJobTitle(jobTitleList: JobTitle[]) {
    const index = jobTitleList.findIndex(
      (x) => x.chasmaNOVOJobTitleId == this.user?.jobTitleId
    );
    this.jobTitleList = jobTitleList.filter(
      (job) => job.chasmaNOVOJobTitleId !== this.user?.jobTitleId
    );
    this.jobTitleTree = this.jobTitleList.map((job: any) => ({
      label: job.name,
      data: job,
      leaf: false,
      loading: false,
      fullyLoaded: false,
    }));
    if (index !== -1) this.userJob = jobTitleList[index].name;
  }

  loadSkills(event: any) {
    const node = event.node;
    node.loading = true;
    this.getSkillsByJobTitleId(node.data.chasmaNOVOJobTitleId).subscribe(
      (skills: Skill[]) => {
        node.children = skills.map((skill) => ({
          label: skill.name,
          data: skill,
          icon: 'pi pi-fw pi-briefcase',
          leaf: true,
        }));
        node.loading = false;
      },
      () => {
        node.loading = false;
      }
    );
  }

  getSkillsByJobTitleId(jobtitleId: string) {
    return this.skillService.getAllSkills(
      jobtitleId,
      this.pageSize,
      this.page,
      this.searchText
    );
  }

  getOrgTeam(teamList: Team[]) {
    const index = teamList.findIndex(
      (x) => x.organizationTeamId == this.user?.organizationTeamId
    );
    if (index !== -1) this.userTeam = teamList[index].name;
  }

  getUserSkills(targettedSkills?: Skill[]) {
    this.skillService.getuserSkills(this.userId).subscribe({
      next: (skill) => {
        this.userSkills = skill;
        this.searchuserSkills = skill;
        if (targettedSkills) {
          this.userTargettedskills = targettedSkills;
        }
        if (this.userTargettedskills) {
          this.userTargettedskills = this.userTargettedskills.filter(
            (skill) =>
              !this.userSkills.some(
                (userSkill) => userSkill.skillId === skill.chasmaNOVOSkillId
              )
          );
          this.searchuserTargettedskills = this.userTargettedskills;
        }
        let skillLevelCounts: { [key: string]: number } = {
          Beginner: 0,
          Intermediate: 0,
          Advanced: 0,
        };

        this.userSkills.forEach((skill) => {
          const levelName = this.getSkillLevelName(skill.skillLevelId);
          if (levelName) {
            skillLevelCounts[levelName] += 1;
          }
        });

        this.proficiencyCount = skillLevelCounts;
        this.updatePieChartData();

        this.skillRatings.forEach((rating) => {
          this.userSkillRatingMap[rating.chasmaNOVOSkillSetId] = Number(
            rating.ratingValue
          );
        });
      },
    });
  }

  rateSkill(chasmaNovoSkillId: string, index: number) {
    const addSkillRatingCommand = {
      ratingValue: this.stars[index].toString(),
      applicationUserId: this.user.applicationUserId,
      chasmaNOVOSkillId: chasmaNovoSkillId,
    };
    this.skillRatingService
      .addUserSkillRating(addSkillRatingCommand)
      .subscribe({
        next: (res) => {
          this.userSkillRatingMap[chasmaNovoSkillId] = this.stars[index];
        },
      });
  }

  getorgUsersskills() {
    this.skillService
      .getOrgUsersSkills(this.loggedInUser.organizationId)
      .subscribe({
        next: (res) => {
          if (res) {
            this.barChartData.labels = res.map(
              (item: { skillName: any }) => item.skillName
            );
            this.barChartData.datasets[0].data = res.map(
              (item: { skillCount: any }) => item.skillCount
            );
          }
        },
        error: (err) => {},
      });
  }

  getSkillLevels(skillLevel: SkillLevel[]) {
    this.skillLevelList = skillLevel;
  }

  getInterestList(interestList: Interest[]) {
    this.userInterestList = interestList;
    this.isLoading = false;
  }

  updatePieChartData() {
    this.pieChartDatasets = [
      {
        data: [
          this.proficiencyCount['Beginner'],
          this.proficiencyCount['Intermediate'],
          this.proficiencyCount['Advanced'],
        ],
        backgroundColor: ['#36A2EB', '#FFCE56', '#FC5723'],
        hoverBackgroundColor: ['#36A2EB', '#FFCE56', '#FC5723'],
        borderWidth: 1,
      },
    ];
  }

  getInitials(firstName?: string, lastName?: string): string {
    const initials = `${firstName ? firstName.charAt(0) : ''} ${
      lastName ? lastName.charAt(0) : ''
    }`;
    return initials.toUpperCase();
  }

  changeUpperTab(tabIndex: number) {
    this.aquiredSkills = tabIndex === 0;
    this.targettedSkills = tabIndex === 1;
    this.interestedSkills = tabIndex === 2;
    // this.filterSkills('');
  }

  getSkillLevelName(levelId: string) {
    return (
      this.skillLevelList.find((level) => level.levelId == levelId)
        ?.levelValue || ''
    );
  }

  openAddSkillDialog(skillnames: string) {
    const ref = this.dialog.open(AddSkillDialogComponent, {
      disableClose: true,
      data: {
        orgId: this.orgId,
        jobtitleId: this.user.jobTitleId,
        skillnames: skillnames,
      },
    });

    ref.afterClosed().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.addedUserSkills = [];
          // this.userInterests = [];
          res.forEach(
            (skill: { name: string; level: string; skillid: string }) => {
              this.addedUserSkills.push({
                chasmaNOVOSkillId: skill.skillid,
                levelId:
                  this.skillLevelList.find(
                    (level) => level.levelValue === skill.level
                  )?.levelId || '',
              });
            }
          );
          // res.forEach(
          //   (interest: { name: string; level: string; interestId: string }) => {
          //     this.userInterests.push({
          //       ChasmaNOVOInterestId: interest.interestId,
          //       levelId:
          //         this.skillLevelList.find(
          //           (level) => level.levelValue === interest.level
          //         )?.levelId || '',
          //     });
          //   }
          // );
          const updateUserOrgCommand = {
            applicationUserId: this.user.applicationUserId,
            organizationId: this.orgId,
            firstName: this.user.firstName,
            middleName: this.user.middleName,
            lastName: this.user.lastName,
            email: this.user.email,
            userName: this.user.email,
            profileImagePath: this.user.profileImagePath,
            dateOfBirth: this.user.dateOfBirth,
            gender: this.user.gender,
            isMentor: this.user.isMentor,
            address1: this.user.address1,
            address2: this.user.address2,
            city: this.user.city,
            district: this.user.district,
            state: this.user.state,
            zip: this.user.zip,
            country: this.user.country,
            phoneNumber: this.user.phoneNumber,
            isActive: this.user.isActive,
            userInterests: this.user.userInterests,
            jobTitleId: this.user.jobTitleId,
            teamId: this.user.organizationTeamId,
            userSkills: this.addedUserSkills,
            managerId: this.user.managerId,
            roleId: this.user.roleId,
          };

          this.userService
            .updateOrganizationUser(updateUserOrgCommand)
            .subscribe({
              next: (res) => {
                this.getUserSkills();
                this.getorgUsersskills();
              },
            });
        } else {
        }
      },
    });
  }

  back() {
    this.location.back();
  }
}

interface ExtendedTreeNode extends TreeNode {
  fullyLoaded?: boolean;
  page?: any;
}
