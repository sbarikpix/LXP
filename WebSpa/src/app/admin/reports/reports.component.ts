import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { AppConstants } from '@app/shared/App-Constants';
import {
  ApplicationUser,
  GetallOrgsquery,
  GetallOrgUsersquery,
  Organization,
} from '@app/shared/models/commonmodel';
import { OrganizationService } from '@app/shared/services/organization.service';
import {
  GetReportsData,
  ReportsService,
} from '@app/shared/services/reports.service';
import { UserService } from '@app/shared/services/user.service';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TableLazyLoadEvent } from 'primeng/table';
import * as XLSX from 'xlsx';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  selectedReport: any;
  customSkillTooltipMap: any;
  customAssessmentTooltipMap: any;
  customManagerTooltipMap: any;
  loading: boolean = false;
  loggedInUser!: ApplicationUser;
  isEmulate = false;
  UserAssessmentDetails: any = '';
  UserList: any[] = [];
  userId: any;
  learningreportFullData: any[] = [];
  learningreportFullDataOriginal: any[] = [];
  learningreportDataOriginal: any[] = [];
  learningreportData: any[] = [];
  skillsreportFullData: any[] = [];
  skillsreportFullDataOriginal: any[] = [];
  skillsreportDataOriginal: any[] = [];
  skillsreportData: any[] = [];
  assessmentreportFullData: any[] = [];
  assessmentreportFullDataOriginal: any[] = [];
  assessmentreportDataOriginal: any[] = [];
  assessmentreportData: any[] = [];
  managerusersreportFullData: any[] = [];
  managerusersreportFullDataOriginal: any[] = [];
  managerusersreportDataOriginal: any[] = [];
  managerusersreportData: any[] = [];
  allusersummaryreportFullData: any[] = [];
  allusersummaryreportFullDataOriginal: any[] = [];
  allusersummaryreportDataOriginal: any[] = [];
  allusersummaryreportData: any[] = [];
  selectedDateRange: Date[] = [];
  isLoading = false;
  totalAllUsers: any;
  // allUsersReportData: any[] = [];
  // allUsersReportFullData: any[] = [];
  managerList: any[] = [];

  reports = [
    {
      icon: 'fa-solid fa-graduation-cap',
      title: 'Users learning Journey Summary',
      description:
        'View users learning journey report and download it as a excel.',
      inputPlaceholder: 'Type user here',
      buttonLabel: 'Generate',
    },
    {
      icon: 'fa-solid fa-chart-line',
      title: 'Users Skill Proficiency Report',
      description:
        'View users skill proficiency summary report and download it as a excel.',
      inputPlaceholder: 'Type course here',
      buttonLabel: 'Generate',
    },
    {
      icon: 'fa-solid fa-file-lines',
      title: 'Users Assessment Summary',
      description:
        'View users assessment summary report and download it as a excel.',
      inputPlaceholder: null,
      buttonLabel: 'Generate',
    },
    {
      icon: 'fa-solid fa-user-group',
      title: 'All Users Summary',
      description: 'View All users summary report and download it as a excel.',
      inputPlaceholder: 'Type user here',
      buttonLabel: 'Generate',
    },
    {
      icon: 'fa-solid fa-people-roof',
      title: 'Manager Users Summary',
      description:
        'View a Managers user summary report and download it as a excel.',
      inputPlaceholder: 'Type user here',
      buttonLabel: 'Generate',
    },
  ];
  completionStatusOptions = [
    { label: 'Completed', value: 'true' },
    { label: 'In Progress', value: 'false' },
  ];

  showGraph = false;
  totallearnings: any;
  totalskills: any;
  totalassessments: any;
  totalmanagerusers: any;
  selectedUserEmail: any;
  isMobile: boolean = false;

  /////////////////////////// Assessment Report Chart ////////////////////////////////
  public passRate: number = 0;
  public averageScore: number = 0;
  public uniqueUsers: number = 0;

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };

  public typeBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };

  public heatmapData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  public barchartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 100,
      },
    },
  };

  public heatmapOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  ////////////////////////////// Learning Journey Report chart //////////////////////////
  public completionPieData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [],
  };

  public timelineData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [],
  };

  public journeyDistributionData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };

  public horizontalBar: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };
  public learningbarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public totalJourneys: number = 0;
  public completionRate: number = 0;
  public averageDuration: number = 0;
  public popularJourney: string = '';
  public popularJourneyCount: number = 0;

  public PieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  public horizontalBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Most Popular Learning Journeys' },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Ensures whole numbers
        },
      },
      y: {
        ticks: {
          autoSkip: false,
          callback: function (value: number | string) {
            if (typeof value === 'number') {
              const label = this.getLabelForValue(value);
              return label.length > 20 ? label.substring(0, 20) + '...' : label;
            }
            return value;
          },
        },
      },
    },
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const label = tooltipItem.dataset.label || '';
            const value = tooltipItem.raw as number;
            return `${label}: ${value} learning journeys`;
          },
        },
      },
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Learning Journey Completion',
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Users',
        },
        ticks: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Journeys',
        },
      },
    },
  };

  ////////////////////////////// Skill Proficiency Report //////////////////////////////

  public proficiencyPieData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [],
  };
  public skillsBarChartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };
  public userSkillMatrixData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };
  public skillCategoryData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [],
  };

  // KPI properties
  public totalSkills: number = 0;
  public expertSkills: number = 0;
  public expertPercentage: number = 0;
  public popularSkill: string = '';
  public popularSkillCount: number = 0;
  public averageProficiency: number = 0;

  // Chart options
  public stackedBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        ticks: {
          display: false,
        },
      },
      y: { stacked: true, beginAtZero: true },
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            return `${label}: ${value} skills`;
          },
        },
      },
    },
  };

  public HeatmapOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            return `${items[0].label} - ${items[0].dataset.label}`;
          },
          label: (context) => {
            const levelNames = [
              '',
              'Beginner',
              'Intermediate',
              'Advanced',
              'Expert',
            ];
            const value = context.raw as number;

            if (value === -1) return 'Skill Not Assessed';
            if (value >= 0 && value <= 3)
              return `Proficiency: ${levelNames[value]}`;
            return 'Skill Data Missing';
          },
        },
      },
    },
    scales: {
      x: { display: true },
      y: {
        ticks: {
          autoSkip: false,
          callback: function (value) {
            const label = this.getLabelForValue(value as number);
            return label.length > 20 ? label.substr(0, 20) + '...' : label;
          },
        },
      },
    },
  };

  //////////////////////////// Manager Users Report //////////////////////////////////
  public managerUsersBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  public userSkillsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  public learningJourneysChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };
  public assessmentsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  // KPI properties
  public totalManagedUsers: number = 0;
  public avgSkillsPerUser: number = 0;
  public topManager: { name: string; count: number } = { name: '', count: 0 };

  // Chart options
  public BaRChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  public PiEChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  ///////////////////////////// All Users Summary Report /////////////////////////////
  public userDetailsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  public UserSkillsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  public userAssessmentsChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };
  public userLearningJourneysChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };

  // KPI properties
  public totalUsers: number = 0;
  public completedJourneys: number = 0;
  public topSkill: string = '';
  public topSkillCount: number = 0;

  // Chart options
  public bArChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  public skillbArChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
      },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  public pIeChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  public doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  organizations: Organization[] = [];
  selectedOrganization: Organization | null = null;
  userData: any[] = [];
  managerData: any[] = [];
  constructor(
    private title: Title,
    private reportservice: ReportsService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private orgService: OrganizationService,
    private platform: Platform
  ) {
    this.title.setTitle('Report');
  }

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
        this.isEmulate = true;
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }

    this.route.paramMap.subscribe({
      next: (res) => {
        this.userId = res.get('id');
      },
    });

    if (this.userId !== this.loggedInUser.applicationUserId) {
      this.router.navigate(['/unauthorized']);
    }

    this.getManagerList();
    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  loadReportData(event?: TableLazyLoadEvent, organizationId?: any) {
    setTimeout(() => {
      this.loading = true;
    });
    const page = event ? event.first! / event.rows! : 0;
    const size = event ? event.rows! : 10;
    const filters = event ? event.filters || {} : {};
    const sortField = event ? event.sortField : null;
    const sortOrder = event ? (event.sortOrder === 1 ? 'asc' : 'desc') : 'asc';
    let command: GetReportsData = {
      page: page ? page : 0,
      pagesize: size,
      filters: filters,
      sortField: sortField,
      sortOrder: sortOrder,
      userId: this.userId,
      organizationId: this.loggedInUser.organizationId,
    };
    if (organizationId || this.selectedOrganization?.organizationId) {
      command.organizationId =
        organizationId || this.selectedOrganization?.organizationId;
    }
    if (this.selectedReport.title === 'Users learning Journey Summary') {
      this.reportservice.getlearningjourneyreport(command).subscribe({
        next: (res) => {
          this.learningreportDataOriginal = res.userLearningJourneyReports;
          this.learningreportData = [...res.userLearningJourneyReports];
          this.learningreportFullData = res.fullUsersLearningJourneyReports; //without pagination
          this.learningreportFullDataOriginal =
            res.fullUsersLearningJourneyReports;
          this.totallearnings = res.total;
          if (
            this.learningreportData.length < command.pagesize &&
            command.page === 0
          ) {
            this.totallearnings = this.learningreportData.length;
          } else {
            this.totallearnings = res.total;
          }
          this.prepareGraphData(
            this.learningreportFullData,
            this.selectedReport.title
          );
          this.loading = false;
        },
      });
    } else if (this.selectedReport.title === 'Users Skill Proficiency Report') {
      this.reportservice.getusersskillsreport(command).subscribe({
        next: (res) => {
          this.skillsreportDataOriginal = res.usersSkillsReports;
          this.skillsreportData = [...res.usersSkillsReports];
          this.skillsreportFullData = res.fullUsersSkillsReports; //without pagination
          this.skillsreportFullDataOriginal = res.fullUsersSkillsReports;
          this.totalskills = res.total;

          if (
            this.skillsreportData.length < command.pagesize &&
            command.page === 0
          ) {
            this.totalskills = this.skillsreportData.length;
          } else {
            this.totalskills = res.total;
          }

          this.prepareGraphData(
            this.skillsreportFullData,
            this.selectedReport.title
          );
          this.loading = false;
        },
      });
    } else if (this.selectedReport.title === 'Users Assessment Summary') {
      this.reportservice.getuserassessmentdetails(command).subscribe({
        next: (res) => {
          this.assessmentreportDataOriginal = res.userAssessmentReports;
          this.assessmentreportData = [...res.userAssessmentReports];
          this.assessmentreportFullData = res.fullUsersAssessmentReport; //without pagination
          this.assessmentreportFullDataOriginal = res.fullUsersAssessmentReport;
          this.totalassessments = res.total;
          if (
            this.assessmentreportData.length < command.pagesize &&
            command.page === 0
          ) {
            this.totalassessments = this.assessmentreportData.length;
          } else {
            this.totalassessments = res.total;
          }
          this.prepareGraphData(
            this.assessmentreportFullData,
            this.selectedReport.title
          );
          this.loading = false;
        },
      });
    } else if (this.selectedReport.title === 'Manager Users Summary') {
      this.reportservice.getManagerusersreport(command).subscribe({
        next: (res) => {
          this.managerusersreportFullData = res.fullManagerUsersReports; //without pagination
          this.managerusersreportFullDataOriginal = res.fullManagerUsersReports;
          this.managerusersreportDataOriginal = res.managerUsersReports;
          this.managerusersreportData = [...res.managerUsersReports];
          this.totalmanagerusers = res.total;
          if (
            this.managerusersreportData.length < command.pagesize &&
            command.page === 0
          ) {
            this.totalmanagerusers = this.managerusersreportData.length;
          } else {
            this.totalmanagerusers = res.total;
          }
          this.prepareGraphData(
            this.managerusersreportFullData,
            this.selectedReport.title
          );
          this.loading = false;
        },
      });
    } else if (this.selectedReport.title === 'All Users Summary') {
      this.reportservice.getallusersreport(command).subscribe({
        next: (res) => {
          this.allusersummaryreportFullData = res.fullAllUsersSummaryReport; //without pagination
          this.allusersummaryreportFullDataOriginal =
            res.fullAllUsersSummaryReport;
          this.allusersummaryreportDataOriginal = res.allUsersSummaryReport;
          this.allusersummaryreportData = [...res.allUsersSummaryReport];
          this.totalAllUsers = res.total;
          if (
            this.allusersummaryreportData.length < command.pagesize &&
            command.page === 0
          ) {
            this.totalAllUsers = this.allusersummaryreportData.length;
          } else {
            this.totalAllUsers = res.total;
          }
          this.prepareGraphData(
            this.allusersummaryreportFullData,
            this.selectedReport.title
          );
          this.loading = false;
        },
      });
    }
  }

  selectReport(index: number): void {
    this.selectedReport = this.reports[index];
    if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.orgService
        .getOrganization('', this.loggedInUser.applicationUserId)
        .subscribe({
          next: (res) => {
            this.loading = true;
            this.organizations = res;
            this.selectedOrganization =
              this.organizations.find(
                (defaultOrg) =>
                  defaultOrg.organizationId === this.loggedInUser.organizationId
              ) || null;
            this.onOrganizationChange(this.selectedOrganization);
          },
          error: (err) => {},
        });
      this.loading = false;
    }
  }

  get filteredReports() {
    return this.reports.filter(
      (report) => !this.shouldHideReport(report.title)
    );
  }

  shouldHideReport(reportTitle: string): boolean {
    // Example condition - hide "Manager Users Summary" if user is not a manager
    if (
      reportTitle === 'Manager Users Summary' &&
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.manager
    ) {
      return true;
    }
    return false;
  }

  onOrganizationChange(event: any) {
    this.loadReportData(undefined, this.selectedOrganization?.organizationId);
  }

  onDateRangeChange() {
    if (
      this.selectedDateRange &&
      this.selectedDateRange.length === 2 &&
      this.selectedDateRange[0] != null &&
      this.selectedDateRange[1] != null
    ) {
      const [from, to] = this.selectedDateRange;

      if (this.selectedReport.title === 'Users learning Journey Summary') {
        this.learningreportData = this.learningreportFullData.filter((item) => {
          const createdDate = new Date(item.completedDate);
          return createdDate >= from && createdDate <= to;
        });
        //I written this code for download full of daterange without pagination
        this.learningreportFullData = this.learningreportFullData.filter(
          (item) => {
            const createdDate = new Date(item.completedDate);
            return createdDate >= from && createdDate <= to;
          }
        );
        this.prepareGraphData(
          this.learningreportFullData,
          this.selectedReport.title
        );
      } else if (this.selectedReport.title === 'Users Assessment Summary') {
        this.assessmentreportData = this.assessmentreportFullData.filter(
          (item) => {
            const createdDate = new Date(item.takenDate);
            return createdDate >= from && createdDate <= to;
          }
        );
        //I written this code for download full of daterange without pagination
        this.assessmentreportFullData = this.assessmentreportFullData.filter(
          (item) => {
            const createdDate = new Date(item.takenDate);
            return createdDate >= from && createdDate <= to;
          }
        );

        this.prepareGraphData(
          this.assessmentreportFullData,
          this.selectedReport.title
        );
      }
    }
  }

  clearDateFilter() {
    this.selectedDateRange = [];
    if (this.selectedReport.title === 'Users learning Journey Summary') {
      this.learningreportData = [...this.learningreportDataOriginal];
      this.learningreportFullData = [...this.learningreportFullDataOriginal];
      this.prepareGraphData(
        this.learningreportFullData,
        this.selectedReport.title
      );
    } else if (this.selectedReport.title === 'Users Assessment Summary') {
      this.assessmentreportData = [...this.assessmentreportDataOriginal];
      this.assessmentreportFullData = [
        ...this.assessmentreportFullDataOriginal,
      ];
      this.prepareGraphData(
        this.assessmentreportFullData,
        this.selectedReport.title
      );
    }
  }

  prepareGraphData(reportData: any[], reporttype: string) {
    if (reporttype == 'Users learning Journey Summary') {
      this.totalJourneys = reportData.length;
      const completed = reportData.filter((j) => j.isCompleted).length;
      this.completionRate = Math.round((completed / this.totalJourneys) * 100);

      // Calculate average duration for completed journeys
      const durations = reportData
        .filter((j) => j.isCompleted && j.completedDate && j.createdOn)
        .map((j) => this.dateDiff(j.createdOn, j.completedDate));
      this.averageDuration = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // Find most popular journey
      const journeyGroups = this.groupBy(reportData, 'learningJourneyName');
      const journeyCounts = Object.entries(journeyGroups).map(
        ([name, items]) => ({ name, count: (items as any[]).length })
      );
      journeyCounts.sort((a, b) => b.count - a.count);
      this.popularJourney = journeyCounts[0]?.name || 'N/A';
      this.popularJourneyCount = journeyCounts[0]?.count || 0;

      // Unique users
      this.uniqueUsers = new Set(reportData.map((j) => j.userEmail)).size;

      // 1. Completion Pie Chart
      this.completionPieData = {
        labels: ['Completed', 'In Progress'],
        datasets: [
          {
            data: [completed, this.totalJourneys - completed],
            backgroundColor: ['#4CAF50', '#FFA726'],
            hoverBackgroundColor: ['#66BB6A', '#FFB74D'],
          },
        ],
      };

      // 2. Timeline Chart (weekly completions)
      this.prepareTimelineData(reportData);

      // 3. Journey Distribution (horizontal bar)
      const topJourneys = journeyCounts.slice(0, 10); // Show top 10
      this.journeyDistributionData = {
        labels: topJourneys.map((j) => j.name),
        datasets: [
          {
            label: 'Users',
            data: topJourneys.map((j) => j.count),
            backgroundColor: '#9c27b0',
          },
        ],
      };

      // 4. Existing stacked bar chart (user progress)
      const userGroups = this.groupBy(reportData, 'userEmail');
      const userLabels = Object.keys(userGroups);

      this.learningbarChartData = {
        labels: userLabels,
        datasets: [
          {
            label: 'Completed',
            data: userLabels.map(
              (email) =>
                userGroups[email].filter((j: any) => j.isCompleted).length
            ),
            backgroundColor: '#4782b9',
            stack: 'stack1',
          },
          {
            label: 'In Progress',
            data: userLabels.map(
              (email) =>
                userGroups[email].filter((j: any) => !j.isCompleted).length
            ),
            backgroundColor: '#FFA726',
            stack: 'stack1',
          },
        ],
      };
    } else if (reporttype == 'Users Skill Proficiency Report') {
      this.totalSkills = reportData.length;
      this.expertSkills = reportData.filter(
        (s) => s.levelName === 'Expert'
      ).length;
      this.expertPercentage = Math.round(
        (this.expertSkills / this.totalSkills) * 100
      );

      const skillGroups = this.groupBy(reportData, 'skillName');
      const skillCounts = Object.entries(skillGroups).map(([name, items]) => ({
        name,
        count: (items as any[]).length,
      }));
      skillCounts.sort((a, b) => b.count - a.count);
      this.popularSkill = skillCounts[0]?.name || 'N/A';
      this.popularSkillCount = skillCounts[0]?.count || 0;

      // Calculate average proficiency (convert levels to numbers)
      const levelValues = reportData.map(
        (s) =>
          ['Beginner', 'Intermediate', 'Advanced', 'Expert'].indexOf(
            s.levelName
          ) + 1
      );
      this.averageProficiency = levelValues.length
        ? Math.round(
            (levelValues.reduce((a, b) => a + b, 0) / levelValues.length) * 10
          ) / 10
        : 0;

      this.uniqueUsers = new Set(reportData.map((s) => s.userEmail)).size;

      // 1. Proficiency Distribution Pie Chart
      const levelGroups = this.groupBy(reportData, 'levelName');
      const orderedLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      this.proficiencyPieData = {
        labels: orderedLevels,
        datasets: [
          {
            data: orderedLevels.map((level) => levelGroups[level]?.length || 0),
            backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB', '#4BC0C0'],
            hoverBackgroundColor: ['#FF8FA6', '#FFE085', '#67B7DC', '#7CD9D9'],
          },
        ],
      };

      // 2. Top Skills by Level Bar Chart
      const topSkills = skillCounts.slice(0, 10).map((s) => s.name);
      this.skillsBarChartData = {
        labels: topSkills,
        datasets: orderedLevels.map((level) => ({
          label: level,
          data: topSkills.map(
            (skill) =>
              reportData.filter(
                (item) => item.skillName === skill && item.levelName === level
              ).length
          ),
          backgroundColor: this.getLevelColor(level),
        })),
      };

      // 3. User Skill Matrix Heatmap
      const users = Array.from(
        new Set(reportData.map((s) => s.userName))
      ).slice(0, 10);
      const skills = Array.from(
        new Set(reportData.map((s) => s.skillName))
      ).slice(0, 10);
      this.userSkillMatrixData = {
        labels: users,
        datasets: skills.map((skill) => ({
          label: skill,
          data: users.map((user) => {
            // if (user === "Bharathi Datla" && skill === "12factor") return 1;
            const userSkill = reportData.find(
              (s) => s.userName === user && s.skillName === skill
            );
            return userSkill
              ? ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'].indexOf(
                  userSkill.levelName
                )
              : -1;
          }),
          backgroundColor: (context) => {
            const value = context.raw as number;
            if (value === -1) return '#F5F5F5';
            return ['', '#FF6384', '#FFCE56', '#36A2EB', '#4BC0C0'][value];
          },
        })),
      };

      // 4. Skill Category Distribution (group similar skills)
      this.prepareTopSkillsChart(reportData);
    } else if (reporttype == 'Users Assessment Summary') {
      const passed = reportData.filter((item) => item.result === 'Pass').length;
      this.passRate = Math.round((passed / reportData.length) * 100);
      this.averageScore = Math.round(
        reportData.reduce((sum, item) => sum + item.score, 0) /
          reportData.length
      );
      this.uniqueUsers = new Set(reportData.map((item) => item.userEmail)).size;

      // 1. Pie Chart - Pass/Fail Distribution
      const passCount = reportData.filter(
        (item) => item.result === 'Pass'
      ).length;
      const failCount = reportData.filter(
        (item) => item.result === 'Fail'
      ).length;

      this.pieChartData = {
        labels: ['Pass', 'Fail'],
        datasets: [
          {
            data: [passCount, failCount],
            backgroundColor: ['#b496c4', '#4782b9'],
            // hoverBackgroundColor: ['#66BB6A', '#EF5350']
          },
        ],
      };

      // 2. Bar Chart - Assessments by Type
      const typeGroups = this.groupBy(reportData, 'assessmentType');
      this.typeBarChartData = {
        labels: Object.keys(typeGroups),
        datasets: [
          {
            label: 'Assessments',
            data: Object.values(typeGroups).map((group: any) => group.length),
            backgroundColor: '#4782b9',
          },
        ],
      };

      // 3. Line Chart - Average Scores Over Time
      const dateGroups = this.groupBy(reportData, (item: any) => {
        const date = new Date(item.takenDate);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });

      const sortedDates = Object.keys(dateGroups).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      this.lineChartData = {
        labels: sortedDates,
        datasets: [
          {
            label: 'Average Score',
            data: sortedDates.map((date) => {
              const group = dateGroups[date];
              return (
                group.reduce((sum: number, item: any) => sum + item.score, 0) /
                group.length
              );
            }),
            borderColor: '#FFA726',
            backgroundColor: 'rgba(255, 167, 38, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      };

      // 4. Heatmap - User Activity
      const users = Array.from(
        new Set(reportData.map((item) => item.userName))
      );
      const assessmentNames = Array.from(
        new Set(reportData.map((item) => item.assessmentName))
      );

      this.heatmapData = {
        labels: users,
        datasets: assessmentNames.map((assessment) => ({
          label: assessment,
          data: users.map(
            (user) =>
              reportData.filter(
                (item) =>
                  item.userName === user && item.assessmentName === assessment
              ).length
          ),
          backgroundColor: this.getRandomColor(),
        })),
      };
    } else if (reporttype == 'Manager Users Summary') {
      this.managerData = reportData;

      // 1. Manager Users Details Chart (Users per Manager)
      this.managerUsersBarChartData = {
        labels: reportData.map((m) => m.managerName),
        datasets: [
          {
            label: 'Number of Users',
            data: reportData.map((m) => m.managerUsers.length),
            backgroundColor: '#4782b9',
          },
        ],
      };

      // 2. User Skills Chart (Top Skills across all users)
      const allSkills = reportData.flatMap((m) =>
        m.managerUsers.flatMap(
          (u: { managerUserSkills: any }) => u.managerUserSkills
        )
      );
      const skillCounts = this.countSkills(allSkills);
      this.userSkillsChartData = {
        labels: skillCounts.map((s) => s.name),
        datasets: [
          {
            label: 'Skill Count',
            data: skillCounts.map((s) => s.count),
            backgroundColor: this.generateColors(skillCounts.length),
          },
        ],
      };

      // 3. Learning Journeys Chart (Completed vs Incomplete)
      const allLearningJourneys = reportData.flatMap((m) =>
        m.managerUsers.flatMap(
          (u: { managerUserLearningJourneys: any }) =>
            u.managerUserLearningJourneys
        )
      );
      const completedCount = allLearningJourneys.filter(
        (lj) => lj.isCompleted
      ).length;
      const incompleteCount = allLearningJourneys.filter(
        (lj) => !lj.isCompleted
      ).length;

      this.learningJourneysChartData = {
        labels: ['Completed', 'In Progress'],
        datasets: [
          {
            data: [completedCount, incompleteCount],
            backgroundColor: ['#36A2EB', '#FFCE56'],
          },
        ],
      };

      // 4. Assessments Chart (Pass vs Fail)
      const allAssessments = reportData.flatMap((m) =>
        m.managerUsers.flatMap(
          (u: { managerUserAssessments: any }) => u.managerUserAssessments
        )
      );
      const passCount = allAssessments.filter(
        (a) => a.result === 'Pass'
      ).length;
      const failCount = allAssessments.filter(
        (a) => a.result === 'Fail'
      ).length;

      this.assessmentsChartData = {
        labels: ['Passed', 'Failed'],
        datasets: [
          {
            label: 'Assessments',
            data: [passCount, failCount],
            backgroundColor: ['#4BC0C0', '#FF6384'],
          },
        ],
      };

      // Calculate KPIs (keep your existing ones)
      this.totalManagedUsers = reportData.reduce(
        (sum, m) => sum + m.managerUsers.length,
        0
      );
      this.avgSkillsPerUser = allSkills.length / this.totalManagedUsers;
      this.topManager = reportData.reduce(
        (prev, curr) =>
          curr.managerUsers.length > prev.count
            ? { name: curr.managerName, count: curr.managerUsers.length }
            : prev,
        { name: '', count: 0 }
      );
    } else if (reporttype == 'All Users Summary') {
      this.userData = reportData;

      // Calculate KPIs
      this.totalUsers = reportData.length;

      const totalSkills = reportData.reduce(
        (sum, user) => sum + (user.userSkills?.length || 0),
        0
      );
      this.avgSkillsPerUser = totalSkills / this.totalUsers;

      this.totalJourneys = reportData.reduce(
        (sum, user) => sum + (user.userLearningJourneys?.length || 0),
        0
      );
      this.completedJourneys = reportData.reduce(
        (sum, user) =>
          sum +
          (user.userLearningJourneys?.filter(
            (j: { isCompleted: any }) => j.isCompleted
          ).length || 0),
        0
      );
      this.completionRate =
        this.totalJourneys > 0
          ? Math.round((this.completedJourneys / this.totalJourneys) * 100)
          : 0;

      // Find top skill
      const skillCounts = this.countSkills(
        reportData.flatMap((u) => u.userSkills || [])
      );
      this.topSkill = skillCounts[0]?.name || 'None';
      this.topSkillCount = skillCounts[0]?.count || 0;

      // 1. User Details Chart (Users by Role)
      const roles = [...new Set(reportData.map((u) => u.role))];
      this.userDetailsChartData = {
        labels: roles,
        datasets: [
          {
            label: 'Number of Users',
            data: roles.map(
              (role) => reportData.filter((u) => u.role === role).length
            ),
            backgroundColor: '#4782b9',
          },
        ],
      };

      // 2. User Skills Chart (Top Skills across all users)
      this.userSkillsChartData = {
        labels: skillCounts.slice(0, 10).map((s) => s.name),
        datasets: [
          {
            label: 'Skill Count',
            data: skillCounts.slice(0, 10).map((s) => s.count),
            backgroundColor: this.generateColors(10),
          },
        ],
      };

      // 3. User Assessments Chart (Pass vs Fail)
      const allAssessments = reportData.flatMap((u) => u.userAssessments || []);
      const passCount = allAssessments.filter(
        (a) => a.result === 'Pass'
      ).length;
      const failCount = allAssessments.filter(
        (a) => a.result === 'Fail'
      ).length;

      this.userAssessmentsChartData = {
        labels: ['Passed', 'Failed'],
        datasets: [
          {
            data: [passCount, failCount],
            backgroundColor: ['#4BC0C0', '#FF6384'],
          },
        ],
      };

      // 4. User Learning Journeys Chart (Completed vs Incomplete)
      this.userLearningJourneysChartData = {
        labels: ['Completed', 'In Progress'],
        datasets: [
          {
            data: [
              this.completedJourneys,
              this.totalJourneys - this.completedJourneys,
            ],
            backgroundColor: ['#36A2EB', '#FFCE56'],
          },
        ],
      };
    }
  }

  private countSkills(skills: any[]): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    skills.forEach((skill) => {
      counts[skill.skillName] = (counts[skill.skillName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 skills
  }

  private generateColors(count: number): string[] {
    return Array.from(
      { length: count },
      (_, i) => `hsl(${(i * 360) / count}, 70%, 50%)`
    );
  }

  public getAvgSkills(manager: any): number {
    const totalSkills = manager.managerUsers.reduce(
      (sum: number, user: any) => sum + (user.managerUserSkills?.length || 0),
      0
    );
    return manager.managerUsers.length
      ? Math.round(totalSkills / manager.managerUsers.length)
      : 0;
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  dateDiff(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  groupBy(array: any[], key: string | Function) {
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  getColorForLevel(level: string): string {
    switch (level.toLowerCase()) {
      case 'beginner':
        return '#5F318E';
      case 'intermediate':
        return '#F58E33';
      case 'advanced':
        return '#56C6D3';
      case 'expert':
        return '#4D4760';
      default:
        return '#e0e0e0';
    }
  }

  prepareTimelineData(reportData: any[]) {
    // Filter only completed journeys with valid dates
    const completedJourneys = reportData.filter(
      (j) => j.isCompleted && j.completedDate
    );

    // Group by month and week
    const monthWeekGroups = completedJourneys.reduce((groups, journey) => {
      const date = new Date(journey.completedDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const weekInMonth = this.getWeekInMonth(date);

      const key = `${month} Week ${weekInMonth}`;

      if (!groups[key]) {
        groups[key] = 0;
      }
      groups[key]++;

      return groups;
    }, {} as Record<string, number>);

    // Sort by actual date (not just alphabetically)
    const sortedKeys = Object.keys(monthWeekGroups).sort((a, b) => {
      const [monthA, weekA] = a.split(' Week ');
      const [monthB, weekB] = b.split(' Week ');

      // Compare months first, then weeks
      const monthCompare =
        new Date(`1 ${monthA} 2000`).getMonth() -
        new Date(`1 ${monthB} 2000`).getMonth();

      if (monthCompare !== 0) return monthCompare;
      return parseInt(weekA) - parseInt(weekB);
    });

    // Prepare chart data
    this.timelineData = {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Journeys Completed',
          data: sortedKeys.map((key) => monthWeekGroups[key]),
          backgroundColor: '#4782b9',
          borderColor: '#2c5d95',
          borderWidth: 1,
        },
      ],
    };
  }

  getWeekInMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();

    // Adjust for day of week (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate week number
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  }

  // Helper to group similar skills into categories
  private prepareTopSkillsChart(data: any[]): void {
    // 1. Create type-safe counting object
    const skillCounts: Record<string, number> = data.reduce(
      (acc: Record<string, number>, curr) => {
        const skillName: string = curr.skillName;
        acc[skillName] = (acc[skillName] || 0) + 1;
        return acc;
      },
      {}
    );

    // 2. Convert to sorted array with proper typing
    const sortedSkills: { name: string; count: number }[] = Object.entries(
      skillCounts
    )
      .map(([name, count]): { name: string; count: number } => ({
        name,
        count: Number(count), // Explicit conversion to number
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Prepare chart data with strict typing
    this.skillCategoryData = {
      labels: sortedSkills.map((item) => item.name),
      datasets: [
        {
          label: 'Users',
          data: sortedSkills.map((item) => item.count), // This is now guaranteed to be number[]
          backgroundColor: '#9c27b0',
        },
      ],
    };
  }

  private getLevelColor(level: string): string {
    return (
      {
        Beginner: '#FF6384',
        Intermediate: '#FFCE56',
        Advanced: '#36A2EB',
        Expert: '#4BC0C0',
      }[level] || '#CCCCCC'
    );
  }

  downloadReport() {
    if (this.selectedReport.title === 'Users learning Journey Summary') {
      this.loading = true;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Learning Journey Report');

      const data = this.learningreportFullData;

      // Group by user
      const userGroups = new Map<string, any[]>();
      data.forEach((item: any) => {
        const key = `${item.userName}-${item.userEmail}`;
        if (!userGroups.has(key)) {
          userGroups.set(key, []);
        }
        userGroups.get(key)?.push(item);
      });

      // Dynamically construct header
      const maxJourneys = Math.max(
        ...Array.from(userGroups.values()).map((journeys) => journeys.length)
      );
      const baseHeaders = ['UserName', 'Email'];
      const dynamicHeaders: string[] = [];

      for (let i = 1; i <= maxJourneys; i++) {
        dynamicHeaders.push(
          `LearningJourney ${i}`,
          `IsCompleted ${i}`,
          `CompletedDate ${i}`
        );
      }

      worksheet.addRow([...baseHeaders, ...dynamicHeaders]);

      // Fill data
      userGroups.forEach((journeys, key) => {
        const [userName, email] = key.split('-');
        const rowData = [userName, email];

        journeys.forEach((j) => {
          rowData.push(
            j.learningJourneyName || '',
            j.isCompleted ? 'Yes' : 'No',
            j.completedDate
              ? new Intl.DateTimeFormat('en-GB').format(
                  new Date(j.completedDate)
                )
              : ''
          );
        });

        // Fill empty cells for users with fewer journeys
        const expectedLength = baseHeaders.length + maxJourneys * 3;
        while (rowData.length < expectedLength) {
          rowData.push('');
        }

        worksheet.addRow(rowData);
      });

      // Export to Excel
      workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const fileName = `LearningJourneyReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
        this.loading = false;
      });
    } else if (this.selectedReport.title === 'Users Skill Proficiency Report') {
      this.loading = true;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Skill Proficiency Report');

      const data = this.skillsreportFullData;

      // Group by user
      const userGroups = new Map<string, any[]>();
      data.forEach((item: any) => {
        const key = `${item.userName}-${item.userEmail}`;
        if (!userGroups.has(key)) {
          userGroups.set(key, []);
        }
        userGroups.get(key)?.push(item);
      });

      // Determine max number of skills for any user
      const maxSkills = Math.max(
        ...Array.from(userGroups.values()).map((skills) => skills.length)
      );
      const baseHeaders = ['UserName', 'Email'];
      const dynamicHeaders: string[] = [];

      for (let i = 1; i <= maxSkills; i++) {
        dynamicHeaders.push(`Skill ${i}`, `Level ${i}`, `JobTitle`);
      }

      worksheet.addRow([...baseHeaders, ...dynamicHeaders]);

      // Fill user data rows
      userGroups.forEach((skills, key) => {
        const [userName, email] = key.split('-');
        const rowData = [userName, email];

        skills.forEach((skill) => {
          rowData.push(
            skill.skillName || '',
            skill.levelName || '',
            skill.jobTitle || ''
          );
        });

        // Fill empty cells for users with fewer skills
        const expectedLength = baseHeaders.length + maxSkills * 3;
        while (rowData.length < expectedLength) {
          rowData.push('');
        }

        worksheet.addRow(rowData);
      });

      // Export Excel file
      workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const fileName = `SkillProficiencyReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
        this.loading = false;
      });
    } else if (this.selectedReport.title === 'Users Assessment Summary') {
      this.loading = true;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assessment Summary Report');

      const data = this.assessmentreportFullData;

      // Group by user
      const userGroups = new Map<string, any[]>();
      data.forEach((item: any) => {
        const key = `${item.userName}-${item.userEmail}`;
        if (!userGroups.has(key)) {
          userGroups.set(key, []);
        }
        userGroups.get(key)?.push(item);
      });

      // Find the max number of assessments per user
      const maxAssessments = Math.max(
        ...Array.from(userGroups.values()).map((a) => a.length)
      );
      const baseHeaders = ['UserName', 'Email'];
      const dynamicHeaders: string[] = [];

      for (let i = 1; i <= maxAssessments; i++) {
        dynamicHeaders.push(
          `Assessment Name ${i}`,
          `Assessment Type`,
          `Assigned By`,
          `Assigned On`,
          `Score`,
          `Result`,
          `Taken Date`
        );
      }

      worksheet.addRow([...baseHeaders, ...dynamicHeaders]);

      // Add rows per user
      userGroups.forEach((assessments, key) => {
        const [userName, email] = key.split('-');
        const rowData = [userName, email];

        assessments.forEach((assessment) => {
          rowData.push(
            assessment.assessmentName || '',
            assessment.assessmentType || '',
            assessment.assignedBy || '',
            assessment.assignedOn &&
              assessment.assignedOn !== '0001-01-01T00:00:00+00:00'
              ? new Intl.DateTimeFormat('en-GB').format(
                  new Date(assessment.assignedOn)
                )
              : '',
            assessment.score ?? '',
            assessment.result || '',
            assessment.takenDate
              ? new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(assessment.takenDate))
              : ''
          );
        });

        // Fill in blanks for users with fewer assessments
        const expectedLength = baseHeaders.length + maxAssessments * 7;
        while (rowData.length < expectedLength) {
          rowData.push('');
        }

        worksheet.addRow(rowData);
      });

      // Export Excel file
      workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const fileName = `AssessmentSummaryReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
        this.loading = false;
      });
    } else if (this.selectedReport.title === 'Manager Users Summary') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Manager Users Report');

      const data = this.managerusersreportFullData;

      // Add headers
      const baseHeaders = [
        'Manager Name',
        'Manager Email',
        'Manager Organization',
      ];
      const userHeaders = [
        'User Name',
        'User Email',
        'Job Titles',
        'Skills',
        'Skill Levels',
        'Assessments',
        'Assessment Results',
        'Learning Journeys',
      ];

      // We'll dynamically determine how many user columns we need
      const maxUsers = Math.max(
        ...data.map((manager) => manager.managerUsers.length)
      );

      // Create header row
      const headerRow = [...baseHeaders];
      for (let i = 1; i <= maxUsers; i++) {
        userHeaders.forEach((h) => headerRow.push(`${h} ${i}`));
      }
      worksheet.addRow(headerRow);

      // Add data rows
      data.forEach((manager) => {
        const rowData = [
          manager.managerName,
          manager.managerEmail,
          manager.managerOrganization,
        ];

        // Process each user under this manager
        manager.managerUsers.forEach(
          (user: {
            managerUserSkills: any[];
            username: any;
            email: any;
            managerUserAssessments: any[];
            managerUserLearningJourneys: any[];
          }) => {
            // Get unique job titles
            const jobTitles = [
              ...new Set(user.managerUserSkills.map((s) => s.jobTitle)),
            ].join(', ');

            // User basic info
            rowData.push(user.username, user.email, jobTitles || 'N/A');

            // Skills and levels
            const skills = user.managerUserSkills
              .map((s) => s.skillName)
              .join(', ');
            const skillLevels = user.managerUserSkills
              .map((s) => s.levelName)
              .join(', ');
            rowData.push(skills, skillLevels);

            // Assessments and results
            const assessments = user.managerUserAssessments
              .map((a) => `${a.assessmentName} (${a.assessmentType})`)
              .join(', ');
            const assessmentResults = user.managerUserAssessments
              .map((a) => `${a.result} (${a.score})`)
              .join(', ');
            rowData.push(assessments, assessmentResults);

            // Learning journeys
            const journeys = user.managerUserLearningJourneys
              .map(
                (j) =>
                  `${j.learningJourneyName} (${
                    j.isCompleted ? 'Completed' : 'In Progress'
                  })`
              )
              .join(', ');
            rowData.push(journeys);
          }
        );

        // Fill empty cells if this manager has fewer users than max
        const usersToAdd = maxUsers - manager.managerUsers.length;
        for (let i = 0; i < usersToAdd; i++) {
          rowData.push('', '', '', '', '', '', '', '');
        }

        worksheet.addRow(rowData);
      });

      // Auto-fit columns - safer implementation
      worksheet.columns = headerRow.map((header, idx) => {
        return {
          header,
          key: header,
          width:
            header.includes('Skills') ||
            header.includes('Assessments') ||
            header.includes('Learning Journeys')
              ? 30
              : 20,
        };
      });

      // Export to Excel
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const fileName = `ManagerUsersReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
      });
    } else if (this.selectedReport.title === 'All Users Summary') {
      this.loading = true;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('All Users Report');

      const data = this.allusersummaryreportFullData;

      // Calculate maximum counts for dynamic columns
      const maxSkills = Math.max(...data.map((user) => user.userSkills.length));
      const maxAssessments = Math.max(
        ...data.map((user) => user.userAssessments.length)
      );
      const maxJourneys = Math.max(
        ...data.map((user) => user.userLearningJourneys.length)
      );

      // Create headers
      const baseHeaders = [
        'User Name',
        'Email',
        'Organization',
        'Role',
        'Manager Name',
        'Status',
      ];

      // Skill headers
      const skillHeaders = [];
      for (let i = 1; i <= maxSkills; i++) {
        skillHeaders.push(`Skill ${i}`, `Level ${i}`, `Job Title ${i}`);
      }

      // Assessment headers
      const assessmentHeaders = [];
      for (let i = 1; i <= maxAssessments; i++) {
        assessmentHeaders.push(`Assessment ${i}`, `Result ${i}`, `Score ${i}`);
      }

      // Learning journey headers
      const journeyHeaders = [];
      for (let i = 1; i <= maxJourneys; i++) {
        journeyHeaders.push(`Learning Journey ${i}`, `Status ${i}`);
      }

      // Combine all headers
      const allHeaders = [
        ...baseHeaders,
        ...skillHeaders,
        ...assessmentHeaders,
        ...journeyHeaders,
      ];

      worksheet.addRow(allHeaders);

      // Add data rows
      data.forEach((user) => {
        const rowData = [
          user.userName,
          user.userEmail,
          user.organaization,
          user.role,
          user.managerName || 'N/A',
          user.isActive ? 'Active' : 'Inactive',
        ];

        // Add skills data
        user.userSkills.forEach(
          (skill: { skillName: any; levelName: any; jobTitle: any }) => {
            rowData.push(skill.skillName, skill.levelName, skill.jobTitle);
          }
        );
        // Fill empty skill columns
        for (let i = user.userSkills.length; i < maxSkills; i++) {
          rowData.push('', '', '');
        }

        // Add assessments data
        user.userAssessments.forEach(
          (assessment: {
            assessmentName: any;
            assessmentType: any;
            result: any;
            score: any;
          }) => {
            rowData.push(
              `${assessment.assessmentName} (${assessment.assessmentType})`,
              assessment.result,
              assessment.score
            );
          }
        );
        // Fill empty assessment columns
        for (let i = user.userAssessments.length; i < maxAssessments; i++) {
          rowData.push('', '', '');
        }

        // Add learning journeys data
        user.userLearningJourneys.forEach(
          (journey: { learningJourneyName: any; isCompleted: any }) => {
            rowData.push(
              journey.learningJourneyName,
              journey.isCompleted ? 'Completed' : 'In Progress'
            );
          }
        );
        // Fill empty journey columns
        for (let i = user.userLearningJourneys.length; i < maxJourneys; i++) {
          rowData.push('', '');
        }

        worksheet.addRow(rowData);
      });

      // Style headers
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Auto-fit columns
      if (worksheet.columns) {
        worksheet.columns.forEach((column) => {
          if (column) {
            let maxLength = 0;
            column.eachCell?.({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value
                ? cell.value.toString().length
                : 0;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            if (column.width === undefined) {
              // Only set width if not already set
              column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            }
          }
        });
      }

      // Export to Excel
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const fileName = `AllUsersReport_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);
        this.loading = false;
      });
    }
  }
  getInitials(firstName?: string): string {
    const initials = `${firstName ? firstName.charAt(0) : ''}`;
    return initials.toUpperCase();
  }

  getManagerName(managerId: string): string {
    const manager = this.managerList.find(
      (user) => user.applicationUserId === managerId
    );
    return manager
      ? `${manager.firstName} ${
          manager.middleName ? manager.middleName + ' ' : ''
        }${manager.lastName}`
      : '';
  }

  getManagerList() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers('', 'managerlist', this.loggedInUser.organizationId)
      .subscribe({
        next: (res) => {
          res.forEach((user: { roleName: string }) => {
            if (user.roleName == 'Manager') this.managerList.push(user);
          });
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
        },
      });
  }

  backToReports(): void {
    this.selectedReport = null;
    this.showGraph = false;
    this.selectedOrganization = null;
  }
}
