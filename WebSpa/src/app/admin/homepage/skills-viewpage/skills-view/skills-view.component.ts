import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddSkillDialogComponent } from '@app/admin/components/user-view-item/add-skill-dialog/add-skill-dialog.component';
import {
  ApplicationUser,
  Interest,
  JobTitle,
  learningJourneyByIdResponse,
  Skill,
  SkillLevel,
  UpdateUserSkillModel,
  UserDataModel,
  UserSkillRating,
  UserSkillsModel,
} from '@app/shared/models/commonmodel';
import { InterestService } from '@app/shared/services/interest.service';
import { JobTitleService } from '@app/shared/services/job-title.service';
import { SkillLevelService } from '@app/shared/services/skill-level.service';
import {
  SkillPassportCommand,
  SkillService,
} from '@app/shared/services/skill.service';
import { UserSkillRatingService } from '@app/shared/services/user-skill-rating.service';
import { UserService } from '@app/shared/services/user.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { TreeNode } from 'primeng/api';
import { concatMap, forkJoin, of, tap } from 'rxjs';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { Platform } from '@angular/cdk/platform';
import { Input } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { AppConstants } from '@app/shared/App-Constants';

@Component({
  selector: 'app-skills-view',
  templateUrl: './skills-view.component.html',
  styleUrl: './skills-view.component.scss',
})
export class SkillsViewComponent implements OnInit {
  @ViewChild('resumecontent', { static: false }) previewRef!: ElementRef;
  @Input() userJobfromParent = '';
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  proficiencyCount: { [key: string]: number } = {
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
    Expert: 0,
  };
  jobTitleTree: TreeNode[] = [];
  userData!: UserDataModel;
  pdfBase64!: string;
  originalSkillTree: any[] = [];
  isMobile: boolean = false;
  // Pie
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    // cutout: '60%', // Creates the hollow effect (adjust as needed)
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
      data: [20, 20, 10, 30],
      backgroundColor: ['#36A2EB', '#FFCE56', ' #FC5723;', '#ffa1b5'],
      hoverBackgroundColor: ['#36A2EB', '#FFCE56', ' #FC5723;', '#ffa1b5'],
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
  skillLevelList!: SkillLevel[];
  userInterestList!: Interest[];
  jobTitleList: JobTitle[] = [];
  userJob: any;
  userSkills: UserSkillsModel[] = [];
  userTargettedskills: Skill[] = [];
  aquiredSkills: boolean = true;
  targettedSkills: boolean = false;
  interestedSkills: boolean = false;
  addedUserSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];
  // userInterests: {
  //   ChasmaNOVOInterestId: string;
  //   levelId: string;
  // }[] = [];
  userId: any;
  skillsList: UserSkillsModel[] = [];
  // activeColor = '#00897B';
  // inactiveColor = '#26C6DA';
  activeColor = '#FC5722';
  inactiveColor = '#FBE3D7';
  searchuserSkills: UserSkillsModel[] = [];
  searchuserTargettedskills: Skill[] = [];
  searchjobTitleList: JobTitle[] = [];
  expandedIndex: number | null = null; // Track which skill is expanded
  isbackbtn: boolean = true;
  user!: ApplicationUser;
  qrData: any;
  showQR: boolean = false;
  userlearninglist!: learningJourneyByIdResponse[];
  showWalletOption = false;

  // Detect Apple devices
  isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  isIOSdevice: boolean = false;
  isAndroiddevice: boolean = false;
  constructor(
    private toastr: ToastrService,
    private skillLevelService: SkillLevelService,
    private skillService: SkillService,
    private location: Location,
    private interestService: InterestService,
    private jobService: JobTitleService,
    private dialog: MatDialog,
    private userService: UserService,
    private skillRatingService: UserSkillRatingService,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private learningservice: LearningjourneyService,
    private platform: Platform
  ) {
    if (this.platform.IOS || this.platform.SAFARI) {
      this.isIOSdevice = true;
    } else if (this.platform.ANDROID) {
      this.isAndroiddevice = true;
    }
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
    this.route.paramMap.subscribe({
      next: (res) => {
        this.userId = res.get('id');
        if (this.userId) {
          this.isbackbtn = false;
        } else {
          this.title.setTitle('Skills');
          this.userId = this.loggedInUser.applicationUserId;
        }
      },
    });
    this.getOrganizationUser(this.userId);
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getOrganizationUser(userId: string) {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers(userId, this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.user = res[0];
          if (this.user) {
            const username = this.user.firstName + this.user.lastName;
            const resumeURL =
              environment.redirectUri +
              '/resume/' +
              this.user.organizationId +
              '/' +
              userId +
              '/' +
              username;
            this.qrData = resumeURL;
          }
          forkJoin({
            skillLevels: this.skillLevelService.getAllSkillLevel(),
            interestList: this.interestService.getAllInterest(userId, ''),
            jobTitleList: this.jobService.getAllOrganizationJobTitle(
              this.user.organizationId,
              ''
            ),
            // orgTeam: this.teamService.getOrganizationTeams(this.orgId, this.user?.organizationTeamId || ''),
            skillRatings: this.skillRatingService.getAllUserSkillRatings(
              this.user.applicationUserId
            ),
            usertargetedskills: this.skillService.getAllSkills(
              this.user.jobTitleId
            ),
            skillList: this.skillService.getuserSkills(
              this.user.applicationUserId,
              ''
            ),
            learninglist: this.learningservice.getuserlearningJourneydetails(
              '',
              this.userId
            ),
          })
            .pipe(
              tap(
                ({
                  skillLevels,
                  interestList,
                  jobTitleList,
                  skillRatings,
                  usertargetedskills,
                  skillList,
                  learninglist,
                }) => {
                  this.getSkillLevels(skillLevels);
                  this.getInterestList(interestList);
                  this.getJobTitle(jobTitleList);
                  this.searchjobTitleList = jobTitleList;
                  // this.getOrgTeam(orgTeam);
                  this.skillRatings = skillRatings;
                  this.getUserSkills(usertargetedskills);
                  this.getorgUsersskills();
                  this.getAllLevels(skillList);
                  this.getUserData(this.user, jobTitleList, skillList);
                  this.getuserlearningJourneydetails(learninglist);
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
      });
  }

  changeUpperTab(tabIndex: number) {
    this.aquiredSkills = tabIndex === 0;
    this.targettedSkills = tabIndex === 1;
    this.interestedSkills = tabIndex === 2;
    this.filterSkills('');
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

  getorgUsersskills() {
    this.skillService.getOrgUsersSkills(this.user.organizationId).subscribe({
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

  getJobTitle(jobTitleList: JobTitle[]) {
    if (this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.learner) {
      this.userJobfromParent =
        jobTitleList.find((x) => x.chasmaNOVOJobTitleId == this.user.jobTitleId)
          ?.name || '';
    }
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

  getInterestList(interestList: Interest[]) {
    this.userInterestList = interestList;
    this.isLoading = false;
  }
  getSkillLevels(skillLevel: SkillLevel[]) {
    const desiredOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    this.skillLevelList = skillLevel.sort((a, b) => {
      return (
        desiredOrder.indexOf(a.levelValue) - desiredOrder.indexOf(b.levelValue)
      );
    });
  }

  getUserSkills(targettedSkills?: Skill[]) {
    this.skillService.getuserSkills(this.user.applicationUserId).subscribe({
      next: (skill) => {
        this.userSkills = skill;
        this.skillsList = skill;
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
        }
        this.searchuserTargettedskills = this.userTargettedskills;
        let skillLevelCounts: { [key: string]: number } = {
          Beginner: 0,
          Intermediate: 0,
          Advanced: 0,
          Expert: 0,
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

  // getAllskills(data: ApplicationUser) {
  //   this.isLoading = true;
  //   this.skillService.getuserSkills(data.applicationUserId, '').subscribe({
  //     next: (res) => {
  //       if (res) {
  //         this.skillsList = res;
  //         this.isLoading = false;
  //       }
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //     },
  //   });
  //   this.isLoading = false;
  //   this.getAllLevels();
  // }

  getAllLevels(skillList: UserSkillsModel[]) {
    this.isLoading = true;
    this.skillsList = skillList;
    setTimeout(() => {
      if (this.skillsList && this.skillLevelList) {
        this.skillsList.forEach((skill) => {
          skill.proficiencyValue = this.getProficiencyLevel(skill.skillLevelId);
          skill.gradient = this.getGradient(skill.proficiencyValue);
        });
      }
    }, 2000);
    this.isLoading = false;
  }

  getProficiencyLevel(skillLevelId: string) {
    this.isLoading = true;
    const levelIndex = this.skillLevelList.findIndex(
      (level) => level.levelId === skillLevelId
    );
    this.isLoading = false;
    return levelIndex + 1;
  }

  getGradient(proficiencyLevel: number): string {
    this.isLoading = true;
    const percentage =
      ((proficiencyLevel - 1) / (this.skillLevelList.length - 1)) * 100;
    this.isLoading = false;
    return `linear-gradient(to right, ${this.activeColor} ${percentage}%, ${this.inactiveColor} ${percentage}%)`;
  }

  getSkillLevelName(levelId: string) {
    return (
      this.skillLevelList.find((level) => level.levelId == levelId)
        ?.levelValue || ''
    );
  }

  updatePieChartData() {
    this.pieChartDatasets = [
      {
        data: [
          this.proficiencyCount['Beginner'],
          this.proficiencyCount['Intermediate'],
          this.proficiencyCount['Advanced'],
          this.proficiencyCount['Expert'],
        ],
        backgroundColor: ['#5F318E', '#F58E33', '#56C6D3', '#4D4760'],
        hoverBackgroundColor: ['#301947', '#CF4C07', '#007891', '#010203'],
        borderWidth: 1,
      },
    ];
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
        node.showSearch = node.children.length > 0;
        node.loading = false;
        this.originalSkillTree = skills;
      },
      () => {
        node.loading = false;
      }
    );
  }
  collapseSkills(event: any) {
    const node = event.node;
    node.showSearch = false;
  }
  filterSkillLabel(event: any, node: any) {
    let value = event.target.value.toLowerCase();
    if (value) {
      node.children = this.originalSkillTree
        .map((skill) => ({
          label: skill.name,
          data: skill,
          icon: 'pi pi-fw pi-briefcase',
          leaf: true,
        }))
        .filter((child) => child.label.toLowerCase().includes(value));
      if (!node.children || node.children.length < 1) {
        node.children = [
          {
            label: 'No skill found',
            leaf: true,
            isMatch: true,
          },
        ];
      }
    } else {
      node.children = this.originalSkillTree.map((skill) => ({
        label: skill.name,
        data: skill,
        icon: 'pi pi-fw pi-briefcase',
        leaf: true,
      }));
    }
  }

  getSkillsByJobTitleId(jobtitleId: string) {
    return this.skillService.getAllSkills(jobtitleId);
  }

  openAddSkillDialog(skillnames: string, node?: any) {
    let jobTitleId = null;
    if (node) {
      jobTitleId = node.data.chasmaNOVOJobSetId;
    }
    const ref = this.dialog.open(AddSkillDialogComponent, {
      disableClose: true,
      data: {
        orgId: this.user.organizationId,
        jobtitleId: jobTitleId != null ? jobTitleId : this.user.jobTitleId,
        skillnames: skillnames,
      },
    });

    ref.afterClosed().subscribe({
      next: (res) => {
        this.isLoading = true;
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
            organizationId: this.user.organizationId,
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
                // this.getUserSkills();
                // this.getorgUsersskills();
                this.getOrganizationUser(this.user.applicationUserId);
                this.changeUpperTab(0);
                this.isLoading = false;
              },
            });
        } else {
          this.isLoading = false;
        }
      },
    });
    this.isLoading = false;
  }

  toggleDetails(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  onFileUpload(event: any, skill: UserSkillsModel): void {
    const file = event.target.files[0];
    if (!file) {
      console.error('No file selected.');
      return;
    }
    if (file.type !== 'application/pdf') {
      this.toastr.error('Only PDF files are allowed.');
      return;
    }
    const maxSizeInMB = 2;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      this.toastr.error(
        'File size exceeds 2 MB. Please select a smaller file.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      skill.certificatePath = base64String;
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.toastr.error('An error occurred while reading the file.');
    };

    reader.readAsDataURL(file);
  }

  saveDetails(skill: UserSkillsModel) {
    this.isLoading = true;
    const command: UpdateUserSkillModel = {
      skillId: skill.skillId,
      userId: skill.userId ? skill.userId : this.user.applicationUserId,
      organizationId: this.user.organizationId,
      levelId: skill.skillLevelId,
      experience: skill.experience,
      certificate: skill.certificatePath,
    };
    this.skillService.updateuserSkill(command).subscribe({
      next: (res) => {
        if (res) {
          this.toastr.success('skill updated successfully');
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });

    this.expandedIndex = null; // Close the details section
  }

  back() {
    this.location.back();
  }

  previewCertificate(event: string) {
    const newWindow = window.open();
    newWindow?.document.write(
      `<iframe src="${event}" frameborder="0" style="width:100%;height:100%;"></iframe>`
    );
  }

  getuserlearningJourneydetails(learninglist: learningJourneyByIdResponse[]) {
    this.userlearninglist = learninglist;
  }

  upskill(skill: UserSkillsModel) {
    const matchingLearning = this.userlearninglist.find(
      (userLearning) => userLearning.skillId === skill.skillId
    );
    if (matchingLearning) {
      const matchingSubModule =
        matchingLearning.getLearningJourneySubModuleResponses.find(
          (subModule) => subModule.levelId === skill.skillLevelId
        );

      if (matchingSubModule && matchingSubModule.isCompleted) {
        this.router.navigate([
          `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/learningpath/${skill.skillId}/${skill.skillLevelId}/${this.userId}`,
        ]);
      } else {
        const levelName = this.skillLevelList.find(
          (x) => x.levelId == skill.skillLevelId
        );
        this.toastr.warning(
          `Please complete ${skill.skillName} (${levelName?.levelValue}) from training before proceeding.`
        );
      }
    } else {
      const levelName = this.skillLevelList.find(
        (x) => x.levelId == skill.skillLevelId
      );
      this.toastr.warning(
        `Please complete ${skill.skillName} (${levelName?.levelValue}) from training before proceeding.`
      );
    }
  }

  // generatePDF() {
  //   this.isLoading = true;
  //   const DATA = this.previewRef.nativeElement;
  //   const marginLeft = 20;
  //   const marginTop = 20;
  //   const marginRight = 20;
  //   const pdfWidth = 210;
  //   const pdfHeight = 297;

  //   html2canvas(DATA, { scale: 2 }).then((canvas) => {
  //     const imgData = canvas.toDataURL('image/png');
  //     const imgWidth = pdfWidth - marginLeft - marginRight;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     let position = marginTop;
  //     let heightLeft = imgHeight;

  //     pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
  //     heightLeft -= pdfHeight - marginTop;

  //     while (heightLeft > 0) {
  //       position = heightLeft - imgHeight + marginTop;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
  //       heightLeft -= pdfHeight - marginTop;
  //     }

  //     const pdfBlob = pdf.output('blob');
  //     const reader = new FileReader();

  //     reader.readAsDataURL(pdfBlob);
  //     reader.onloadend = () => {
  //       const base64String = reader.result?.toString().split(',')[1];
  //       if (base64String) {
  //         this.uploadToBackend(base64String);
  //       }
  //     };
  //   });
  // }

  // uploadToBackend(base64String: string) {
  //   const pdfData: SkillPassportCommand = {
  //     userId: this.userId,
  //     organizationId: this.loggedInUser.organizationId,
  //     base64string: base64String,
  //   };
  //   this.skillService.generateSkillPassport(pdfData).subscribe({
  //     next: (res) => {
  //       if (res.isSuccess) {
  //         this.showQRViewButton = true;
  //         this.qrData = res.message;
  //         this.isLoading = false;
  //       }
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //     },
  //   });
  // }

  downloadQRCode() {
    const qrElement = document.querySelector('canvas'); // Select the QR code canvas
    if (qrElement) {
      const qrImage = qrElement.toDataURL('image/png'); // Convert canvas to image
      if (this.isMobile) {
      } else {
        const a = document.createElement('a');
        a.href = qrImage;
        a.download = 'QRCode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else {
      console.error('QR code not found');
    }
  }

  addToAppleWallet(): void {
    try {
      const passUrl = `${environment.issuer}/api/OrganizationSkill/generate-applepass?userId=${this.userId}&oraganizationId=${this.loggedInUser.organizationId}&skillpassport=${this.qrData}`;
      if (this.platform.IOS) {
        window.location.href = passUrl;
      } else {
        this.skillService
          .getaddToAppleWallet(
            this.userId,
            this.loggedInUser.organizationId,
            this.qrData
          )
          .subscribe({
            next: (res) => {
              this.downloadFile(res, 'skillproficiency.pkpass');
            },
            error: (err) => {
              console.log('fail', err);
            },
          });
      }
    } catch (error) {
      console.error('Error adding to Apple Wallet:', error);
    }
  }

  addToGoogleWallet(): Promise<void> {
    return new Promise((resolve, reject) => {
      // const passUrl = `${environment.issuer}/api/OrganizationSkill/generate-googlepass?userId=${this.userId}&oraganizationId=${this.loggedInUser.organizationId}&skillpassport=${this.qrData}`;
      this.skillService
        .getaddToGoogleWallet(
          this.userId,
          this.loggedInUser.organizationId,
          this.qrData
        )
        .subscribe({
          next: (response) => {
            // Android devices
            if (this.platform.ANDROID) {
              window.location.href = response.url;
            } else {
              // Open in new tab for other devices
              window.open(response.url, '_blank');
            }
            resolve();
          },
          error: (err) => reject(err),
        });
    });
  }

  downloadFile(blob: Blob, filename: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // a.style.display = 'none';
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      this.toastr.error('Failed to initiate download');
    }
  }

  getUserData(
    user: ApplicationUser,
    jobTitleList: JobTitle[],
    skillList: UserSkillsModel[]
  ) {
    const jobname = jobTitleList.find(
      (x) => x.chasmaNOVOJobTitleId === user.jobTitleId
    );

    const skilldata: UserSkillsModel[] = [];
    if (skillList) {
      user.userSkills.forEach((x) => {
        const skilldetails = skillList.find((s) => s.skillId === x);
        if (skilldetails) {
          const skillname: UserSkillsModel = {
            skillId: skilldetails.skillName,
            skillLevelId: this.skillLevelList.find(
              (x) => x.levelId === skilldetails.skillLevelId
            )?.levelValue!,
            experience: skilldetails.experience,
            certificatePath: skilldetails.certificatePath,
          };
          skilldata.push(skillname);
        }
      });
    }

    const data: UserDataModel = {
      fullname: user.firstName + ' ' + user.lastName,
      email: user.email,
      mobile: user.phoneNumber,
      jobtitle: jobname?.name || '',
      gender: user.gender,
      dateofbirth: user.dateOfBirth,
      skills: skilldata,
    };
    this.userData = data;
  }
}
