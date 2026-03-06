import { SelectionModel } from '@angular/cdk/collections';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  ApplicationUser,
  GetQuestionPaperResponse,
  Interest,
  SkillLevel,
  UserModel,
  UserSkillsModel,
} from '@app/shared/models/commonmodel';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { map, startWith } from 'rxjs';
import { CalenderPopupComponent } from '../calender-popup/calender-popup/calender-popup.component';
import { ExamServicesService } from '@app/shared/services/assessment-services.service';
import { SkillLevelService } from '@app/shared/services/skill-level.service';
import { AppConstants } from '@app/shared/App-Constants';
import { ChartConfiguration } from 'chart.js';
import { Location } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent implements OnInit {
  @ViewChild('previews', { static: false }) previewRef!: ElementRef;
  isPreviewVisible = false;
  selectedAssessmentName: string = '';
  selectedAssessmentDate: string = '';
  selectedAssessmentscore: string = '';
  selectedAssessmentdate: Date = new Date();
  selectedAssesmentScore: string = '';
  selectedAttemptId: number | null = null;
  attemptQuestion!: GetQuestionPaperResponse;
  UserAssessmentMetrices: any[] = [];
  ScheduledUsersList: UserModel[] = [];
  loading: boolean = false;
  InterestList: Interest[] = [];
  SelectedSkillname = new FormControl();
  searchName: any;
  loggedInUser!: ApplicationUser;
  userskillsfilter = new FormControl();
  filteruserskills: any;
  selectedSkill!: UserSkillsModel;
  assignedBy: string = 'self-user';
  assessmentType: any = 'Self-Assessment';
  skillLevelList: SkillLevel[] = [];
  activeColor = '#FC5722';
  inactiveColor = '#FBE3D7';
  isEmulate = false;
  isPre_assesment: boolean = true;

  data: any;

  options: any;
  selection = new SelectionModel<any>(true, []); // Multiple selection
  isMobile: boolean = false;

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Assessment Metrics',
      },
    },
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Pass',
        data: [],
        backgroundColor: '#56c6d3',
        borderColor: '#56c6d3',
        borderWidth: 1,
      },
      {
        label: 'Fail',
        data: [],
        backgroundColor: '#f58e33',
        borderColor: '#f58e33',
        borderWidth: 1,
      },
    ],
  };

  constructor(
    private userservice: UserService,
    private title: Title,
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private toaster: ToastrService,
    private skillservice: SkillService,
    private skillLevelService: SkillLevelService,
    private examservice: ExamServicesService,
    private cdr: ChangeDetectorRef,
    private platform: Platform
  ) {
    this.title.setTitle('Assessment');
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
    this.getAllLevels();

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  tabChange(event: any) {
    if (event.tab.textLabel == 'Assign-Assessment' || 'Assigned-Assessments') {
      this.assignedBy = 'Reporting-manager';
      this.assessmentType = 'Assign-Assessment';
      if (this.loggedInUser.roleName != AppConstants.ChasmanovoRoles.learner) {
        this.getScheduledUsersList();
      } else {
        this.getUserMetrices(event.tab.textLabel);
      }
    } else if (event.tab.textLabel == 'Self-Assessment') {
      this.assignedBy = 'self-user';
      this.assessmentType = 'Self-Assessment';
      this.getUserMetrices(event.tab.textLabel);
    }
  }

  getUserMetrices(event: any) {
    this.loading = true;
    this.examservice
      .getAssessmentMetrices(
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId,
        event
      )
      .subscribe({
        next: (res) => {
          this.UserAssessmentMetrices = res;
          if (this.UserAssessmentMetrices.length) {
            this.isPre_assesment = false;
          }
          setTimeout(() => {
            this.setUserMetricsData(this.UserAssessmentMetrices);
          });
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
        },
      });
    this.loading = false;
  }

  setUserMetricsData(data: any[]) {
    const labels: string[] = [];
    const passData: number[] = [];
    const failData: number[] = [];

    data.forEach((item) => {
      labels.push(item.assessmentName);
      if (item.result === 'Pass') {
        passData.push(item.optainedMarks);
        failData.push(0);
      } else {
        failData.push(item.optainedMarks);
        passData.push(0);
      }
    });

    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Pass',
          data: passData,
          backgroundColor: '#56c6d3',
          borderColor: '#56c6d3',
          borderWidth: 1,
        },
        {
          label: 'Fail',
          data: failData,
          backgroundColor: '#f58e33',
          borderColor: '#f58e33',
          borderWidth: 1,
        },
      ],
    };
  }

  getScheduledUsersList() {
    this.loading = true;
    this.examservice
      .getscheduledUsers(
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.ScheduledUsersList = res.filter(
              (x) => x.userId != this.loggedInUser.applicationUserId
            );
          }
        },
        error: (err) => {
          this.loading = false;
        },
      });
    this.loading = false;
  }

  getAllLevels() {
    this.loading = true;
    this.skillLevelService.getAllSkillLevel().subscribe({
      next: (res) => {
        if (res) {
          this.skillLevelList = res;
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
      },
    });
    this.loading = false;
    this.getUserMetrices(this.assessmentType);
  }

  toggleSelection(row: any) {
    this.selection.toggle(row);
  }

  onassign(user: UserModel) {
    if (!user.isTakenPreassessment) {
      this.toaster.error(
        'User is not eligible for this assessment until the pre-assessment is completed.'
      );
    } else {
      var dialogRef = this.dialog.open(CalenderPopupComponent, {});
      dialogRef.disableClose = true;
      dialogRef.componentInstance.usermodel = user;
    }
  }

  startassessment() {
    var self = this;
    var dialogRef = this.dialog.open(CalenderPopupComponent, {});
    dialogRef.disableClose = true;
    dialogRef.componentInstance.userId = this.loggedInUser.applicationUserId;
    dialogRef.componentInstance.levelsList = this.skillLevelList;
    dialogRef.afterClosed().subscribe(() => {
      self.getScheduledUsersList();
    });
  }

  preview(attemptId: any) {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/assessment/preview/${attemptId}`,
    ]);
  }

  exportToPDF(attemptId: any) {
    if (!attemptId) {
      this.toaster.error('No attempt selected for export.');
      return;
    }

    this.loading = true;
    this.selectedAttemptId = attemptId;
    this.isPreviewVisible = true;

    this.getUserAttemptDetails(attemptId, () => {
      setTimeout(() => {
        const matchedAssessment = this.UserAssessmentMetrices.find(
          (assessment) => assessment.userAttemptId === this.selectedAttemptId
        );
        if (matchedAssessment) {
          this.selectedAssessmentName = matchedAssessment.assessmentName;
          this.selectedAssessmentDate = matchedAssessment.attemptEndDate;
          this.selectedAssessmentscore = matchedAssessment.optainedMarks;

          this.cdr.detectChanges();
          this.generatePDF(matchedAssessment.assessmentName);
          this.isPreviewVisible = false;
          this.loading = false;
          this.getUserMetrices(
            (matchedAssessment.assessmentName = 'Self-Assessment')
          );
        } else {
          this.toaster.error('PDF Export failed.');
        }
      }, 1000);
    });
  }

  getUserAttemptDetails(attemptId: any, callback: Function) {
    this.examservice
      .getuserattemptdetails(this.loggedInUser.applicationUserId, attemptId)
      .subscribe({
        next: (res) => {
          res.skills.forEach((skillGroup: any) => {
            skillGroup.examQuestions.forEach((question: any) => {
              if (question.questionType === 'Match Type') {
                question.question = this.renderMatchType(question.question);
              } else {
                question.question = question.question;
              }
              this.attemptQuestion = res;
            });
          });

          this.isPreviewVisible = true;
          callback();
        },
        error: () => {
          this.loading = false;
          this.toaster.error('Failed to load attempt data.');
        },
      });
  }

  renderMatchType(questionJson: string): string {
    try {
      const qObj = JSON.parse(questionJson);
      if (!qObj.pairs || !Array.isArray(qObj.pairs)) {
        return qObj.question || '';
      }

      let html = `
        <table class="table table-bordered">
          <thead><tr><th>Column A</th><th>Column B</th></tr></thead>
          <tbody>`;
      qObj.pairs.forEach((pair: { left: string; right: string }) => {
        html += `<tr><td>${this.stripParagraphTags(pair.left)}</td>
  <td>${this.stripParagraphTags(pair.right)}</td></tr>`;
      });
      html += `</tbody></table>`;
      return (qObj.question || '') + html;
    } catch {
      return questionJson; // fallback if not JSON
    }
  }

  stripParagraphTags(html: string): string {
    return html.replace(/<p>(.*?)<\/p>/g, '$1').trim();
  }

  generatePDF(assessmentName: string) {
    const DATA = this.previewRef.nativeElement;
    const marginLeft = 20; // Left margin
    const marginTop = 20; // Top margin
    const marginRight = 20; // Right margin
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    html2canvas(DATA, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - marginLeft - marginRight; // Reduce width for left/right margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Scale height proportionally

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = marginTop; // Start with top margin
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - marginTop; // Adjust height after placing first image

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginTop;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - marginTop;
      }

      pdf.save(`${assessmentName || 'Assessment'}.pdf`);
    });
  }

  getGlobalIndex(skillIndex: number, questionIndex: number): number {
    let total = 0;
    for (let i = 0; i < skillIndex; i++) {
      total += this.attemptQuestion?.skills?.[i]?.examQuestions?.length || 0;
    }
    return total + questionIndex;
  }

  stripHtml(html: string): string {
    return html ? html.replace(/<[^>]*>/g, '').trim() : '';
  }

  back() {
    this.location.back();
  }
}
