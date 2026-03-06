import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApplicationUser,
  ExamQuestionsModel,
  GetQuestionPaperResponse,
  SelectedSkills,
  SubmittedQuestions,
} from '@app/shared/models/commonmodel';
import {
  ExamServicesService,
  GetQuestionPaperQuery,
  questionDetails,
  skillDetails,
} from '@app/shared/services/assessment-services.service';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { ToastrService } from 'ngx-toastr';
// Removed incorrect import of 'json'
import Swal from 'sweetalert2';

@Component({
  selector: 'app-exam-page',
  templateUrl: './exam-page.component.html',
  styleUrl: './exam-page.component.scss',
})
export class ExamPageComponent implements OnInit {
  userId: any;
  userattemptId: any;
  pager: any = {};
  headerPager: any = {};
  QuestionsList: GetQuestionPaperResponse[] = [];
  matchQuetion: any = {
    leftSide: '',
    rightSide: ''
  }
  questionCounter = 0;
  attemptQuestion!: GetQuestionPaperResponse;
  UseranswerList: ExamQuestionsModel[] = [];
  Examfinished: boolean = false;
  UserDetails!: ApplicationUser;
  resize: boolean = false;
  ipAddress: any;
  obtainedMarks: any;
  totalMarks: any;
  skillId: any;
  loggedInUser!: ApplicationUser;
  skillLevelId: any;
  loading: boolean = false;
  assignedBy: any;
  selectedskills!: SelectedSkills;
  assessmentName: any;
  answers: { [questionId: string]: string | string[] } = {};
  preview: boolean = false;
  isSubmitDisabled: boolean = true;
  userAssignedAssessmentId: any;

  constructor(
    private examservices: ExamServicesService,
    private title: Title,
    private toaster: ToastrService,
    private emulateservice: EmulateUserService,
    public router: Router,
    private route: ActivatedRoute
  ) {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
        this.UserDetails = this.loggedInUser;
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }

    window.onresize = (e) => {
      this.resizefunction();
    };
    this.userattemptId = this.route.snapshot.params['id'];
    this.userAssignedAssessmentId = this.route.snapshot.params['assignedId'];
    if (this.userattemptId) {
      this.title.setTitle('Preview');
      this.preview = true;
      this.getuserAttemptdetails(this.userattemptId);
    } else {
      this.title.setTitle('Exam');
      this.selectedskills = this.emulateservice.getSkills();
      this.assessmentName =
        this.selectedskills.assessmentName != null || ''
          ? this.selectedskills.assessmentName
          : null;
      this.GetExamQuestions();
      this.preview = false;
    }
  }

  ngOnInit(): void {
    this.resizefunction();
    if (this.resize == false) {
      this.getIPAddress();
    }
  }

  resizefunction() {
    if (window.innerWidth <= 922) {
      this.resize = true;
    } else {
      this.resize = false;
    }
  }

  async getIPAddress() {
    this.examservices.getIpaddress().subscribe({
      next: (res) => {
        this.ipAddress = res;
      },
      error: (err) => { },
    });
  }

  // GetExamQuestions() {
  //   this.loading = true;
  //   const query: skillDetails[] = [];
  //   this.selectedskills.selectedskills.forEach((x) => {
  //     const data: skillDetails = {
  //       skillId: x.skillId,
  //       skillLevelId: x.skillLevelId,
  //     };
  //     query.push(data);
  //   });
  //   const question: questionDetails[] = [];
  //   this.selectedskills.questionIds?.forEach((x) => {
  //     const item: questionDetails = {
  //       questionId: x.questionId,
  //     };
  //     question.push(item);
  //   });
  //   const command: GetQuestionPaperQuery = {
  //     userId: this.loggedInUser.applicationUserId,
  //     organizationId: this.loggedInUser.organizationId,
  //     skillsDetails: query,
  //     questionIds: question,
  //   };
  //   this.examservices.getexamquestions(command).subscribe({
  //     next: (res) => {
  //       res.forEach((skillGroup: any) => {
  //         skillGroup.skills.forEach((skills: any) => {
  //           skills.examQuestions.forEach((question: any) => {
  //             if (question.questionType === "Match Type") {
  //               question.question = this.renderMatchType(question.question);
  //             } else {
  //               question.question = question.question; // normal questions
  //             }
  //             console.log("exam quetions", skills.examQuestions);
  //             this.QuestionsList = res;
  //             this.loading = false;
  //             this.validateAnswers();
  //           });
  //         })
  //       });
  //       // if (res) {          
  //       //   this.QuestionsList = res;
  //       //   this.loading = false;
  //       //   this.validateAnswers();
  //       // }
  //     },
  //     error: (err) => {
  //       this.loading = false;
  //     },
  //   });
  //   this.loading = false;
  // }
  GetExamQuestions() {
    this.loading = true;
  
    const query: skillDetails[] = this.selectedskills.selectedskills.map(x => ({
      skillId: x.skillId,
      skillLevelId: x.skillLevelId
    }));
  
    const question: questionDetails[] = this.selectedskills.questionIds?.map(x => ({
      questionId: x.questionId
    })) || [];
  
    const command: GetQuestionPaperQuery = {
      userId: this.loggedInUser.applicationUserId,
      organizationId: this.loggedInUser.organizationId,
      skillsDetails: query,
      questionIds: question,
    };
  
    this.examservices.getexamquestions(command).subscribe({
      next: (res) => {
        res.forEach((skillGroup: any) => {
          skillGroup.skills.forEach((skills: any) => {
            skills.examQuestions = skills.examQuestions || [];
            skills.examQuestions.forEach((question: any) => {
              if (question.questionType === "Match Type") {
                question.question = this.renderMatchType(question.question);
              }
            });
          });
        });
        this.QuestionsList = res;  
        this.loading = false;
        this.validateAnswers();  
      },
      error: (err) => {
        console.error("Error fetching exam questions:", err);
        this.loading = false;
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
        html += `<tr>  <td>${this.stripParagraphTags(pair.left)}</td>
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


  onCheckboxChange(event: any, questionId: string, option: string) {
    if (!Array.isArray(this.answers[questionId])) {
      this.answers[questionId] = [];
    }

    if (event.target.checked) {
      if (!this.answers[questionId].includes(option)) {
        (this.answers[questionId] as string[]).push(option);
      }
    } else {
      this.answers[questionId] = (this.answers[questionId] as string[]).filter((o: string) => o !== option);
    }

    this.validateAnswers();
  }

  validateAnswers() {
    for (const skillGroup of this.QuestionsList) {
      for (const skill of skillGroup.skills) {
        if (!skill.examQuestions?.length) {
          this.isSubmitDisabled = true;
          return;
        }
        const allAnswered = skill.examQuestions.every((q: any) => {
          const ans = this.answers[q.questionId];

          if (q.questionType === 'Multiselect Type') {
            return Array.isArray(ans) && ans.length > 0;
          } else {
            return typeof ans === 'string' && ans.trim() !== '';
          }
        });
        if (!allAnswered) {
          this.isSubmitDisabled = true; // At least one question is unanswered
          return;
        }
      }
    }
    this.isSubmitDisabled = false;
  }

  getuserAttemptdetails(userattemptId: any) {
    this.loading = true;
    this.examservices
      .getuserattemptdetails(this.loggedInUser.applicationUserId, userattemptId)
      .subscribe({
        next: (res) => {
          res.skills.forEach((skillGroup: any) => {
            skillGroup.examQuestions.forEach((question: any) => {
              if (question.questionType === "Match Type") {
                question.question = this.renderMatchType(question.question);
              } else {
                question.question = question.question;
              }

            });

          });
          this.attemptQuestion = res;
          this.loading = false;
        },
        error: (err) => { },
      });
    this.loading = false;
  }


  stripHtml(html: string): string {
    return html ? html.replace(/<[^>]*>/g, '').trim() : '';
  }

  onSubmit() {
    this.loading = true;
    let assessmentType;
    if (this.userAssignedAssessmentId) {
      assessmentType = 'Assigned-Assessments';
    } else {
      assessmentType = 'self-assessment';
    }
    const submissionData: GetQuestionPaperResponse = {
      organizationId: this.loggedInUser.organizationId,
      assessmentType: assessmentType,
      assessmentName: this.assessmentName,
      userAssignedAssessmentId:
        this.userAssignedAssessmentId != null
          ? this.userAssignedAssessmentId
          : '',
      userId: this.QuestionsList[0]?.userId || '', // Ensure userId is included
      skills: this.QuestionsList.flatMap((skillGroup) => {
        return skillGroup.skills.map((skill) => ({
          skillId: skill.skillId,
          skillName: skill.skillName,
          skillLevelId: skill.skillLevelId,
          skillLevelName: skill.skillLevelName, // Use the correct property name
          examQuestions: skill.examQuestions?.map((question) => ({
            ...question,
            question: this.stripHtml(question.question),
            option1: this.stripHtml(question.option1),
            option2: this.stripHtml(question.option2),
            option3: this.stripHtml(question.option3),
            option4: this.stripHtml(question.option4),
            correctAnswer: this.stripHtml(question.correctAnswer),
            // For multiselect, ensure answer is an array; for single select, a string
            userAnswer: (() => {
              const ans = this.answers[question.questionId];
              if (!ans) return [];
              if (Array.isArray(ans)) {
                return ans.map((a: string) => this.stripHtml(a));
              }
              return [this.stripHtml(ans)];
            })(), // Include user's answer
          })),
        }));
      }),
    };
    this.examservices.submitExam(submissionData).subscribe({
      next: (res) => {
        if (res) {
          this.obtainedMarks = res.obtainedMarks;
          this.totalMarks = res.totalMarks;
          this.Examfinished = true;
          this.loading = false;
          this.toaster.success('Your assessment was submitted successfully.');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
    // this.loading = false;
  }

  onCancel() {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home`,
    ]);
  }

  confirmsubmitexam() {
    Swal.fire({
      // title: 'Submit Exam',
      text: 'Are you sure submit the Exam?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      allowOutsideClick: false,
      backdrop: true,
    }).then((result) => {
      if (result.value) {
        this.onSubmit();
      }
    });
  }

  getGlobalIndex(skillIndex: number, questionIndex: number): number {
    let total = 0;
    for (let i = 0; i < skillIndex; i++) {
      total += this.attemptQuestion?.skills?.[i]?.examQuestions?.length || 0;
    }
    return total + questionIndex;
  }
  gohome() {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home`,
    ]);
  }
}
