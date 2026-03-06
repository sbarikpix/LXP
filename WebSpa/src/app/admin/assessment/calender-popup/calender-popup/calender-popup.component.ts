import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ApplicationUser,
  GetallOrgsquery,
  GetScheduledAssessmentsResponseModel,
  learningJourneyByIdResponse,
  QuestionBankModel,
  QuestionsList,
  ScheduleData,
  SelectedSkillbank,
  SelectedSkills,
  SkillLevel,
  UserModel,
  UserSkillsModel,
} from '@app/shared/models/commonmodel';
import { ExamServicesService } from '@app/shared/services/assessment-services.service';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { questionService } from '@app/shared/services/question.service';
import { SkillService } from '@app/shared/services/skill.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-calender-popup',
  templateUrl: './calender-popup.component.html',
  styleUrl: './calender-popup.component.scss',
})
export class CalenderPopupComponent implements OnInit {
  numberOptions: number[] = [];
  selectedNumber: number = 10;

  userId!: string;
  levelsList: SkillLevel[] = [];
  SkillsList: UserSkillsModel[] = [];
  scheduledskillsList: UserSkillsModel[] = [];
  usermodel!: UserModel;
  assessmentName: any;
  // selectedSkills!: SelectedSkills;
  selectedSkills: SelectedSkills = {
    assessmentName: '',
    selectedskills: [],
    questionIds: [],
  };
   
  selectedSkillbank:SelectedSkillbank={
    assessmentName: '',
    selectedskills: [],
    questionBankId: [],
  };

  isLoading: boolean = false;
  selectAll: boolean = false;
  ScheduledData!: ScheduleData;
  ExamscheduleDate: Date = new Date();
  skillId: any;
  skillLevel: any;
  minDateValue = new Date();
  isdateSelected: boolean = false;
  loggedInUser!: ApplicationUser;
  scheduleduserskills: boolean = false;

  isSkillSelectionStep = true;
  questionList: QuestionsList[] = [];
  // questionBankList:QuestionBankModel[]=[];
  questionBankList: any[] = [];
  selectAllQuestions: boolean = false;
  selectedAllQuestionBank:boolean=false;
  selectedQuestions: any[] = [];
  selectedQuestionBanks:any[]=[];
  userlearninglist: learningJourneyByIdResponse[] = [];
  userscheduledassessmentData: GetScheduledAssessmentsResponseModel[] = [];

  constructor(
    private toaster: ToastrService,
    public dialogRef: MatDialogRef<CalenderPopupComponent>,
    private router: Router,
    private emulateservice: EmulateUserService,
    private scheduleservice: ExamServicesService,
    private learningservice: LearningjourneyService,
    private skillservice: SkillService,
    private questionservice: questionService
  ) {}
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
    if (this.userId) {
      this.scheduleduserskills = false;
      this.getuserSkills();
    } else if (this.usermodel) {
      this.scheduleduserskills = true;
      this.usermodel.skillsData.forEach((x) => {
        const skillList: UserSkillsModel = {
          skillId: x.skillId,
          skillName: x.skillName,
          skillLevelId: x.skillLevelId,
          proficiencyValue: x.skillLevelName,
          gradient: false,
          userId: '',
        };
        this.scheduledskillsList.push(skillList);
      });
    }
    this.numberOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
  }

  onNumberChange() { 
    return this.selectedNumber;
  }
  

  getuserSkills() {
    this.isLoading = true;
    this.skillservice.getuserSkills(this.userId, '').subscribe({
      next: (res) => {
        this.SkillsList = res;
        this.SkillsList.forEach((x) => {
          x.proficiencyValue = this.levelsList.find(
            (y) => y.levelId == x.skillLevelId
          );
          x.gradient = false;
        });
        this.getuserlearningjourneydetails();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
    this.isLoading = false;
  }




  getuserlearningjourneydetails() {
    this.isLoading = true;
    this.learningservice
      .getuserlearningJourneydetails('', this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.userlearninglist = res;
          this.getscheduledAssessments(this.loggedInUser.applicationUserId);
        },
      });
  }

  getscheduledAssessments(userId: string) {
    this.isLoading = true;
    this.scheduleservice.getscheduledAssessments(userId).subscribe({
      next: (res) => {
        this.userscheduledassessmentData = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  toggleAllSkills() {
    if (!this.usermodel) {
      this.SkillsList.forEach((skill) => {
        skill.gradient = this.selectAll;
      });
    } else {
      this.scheduledskillsList.forEach((skill) => {
        skill.gradient = this.selectAll;
      });
    }
    this.updateSelectedSkills();
  }

  onSkillToggle(skill: any) {
    if (!this.usermodel) {
      this.selectAll = this.SkillsList.every((skill) => skill.gradient);
    } else {
      this.selectAll = this.scheduledskillsList.every(
        (skill) => skill.gradient
      );
    }
    this.updateSelectedSkills();
  }

  // toggleAllQuestions() {
  //   this.selectedQuestions = []; // Clear existing selections

  //   if (this.selectAllQuestions) {
  //     this.questionList.forEach((question) => {
  //       question.selected = true;
  //       this.selectedQuestions.push(question.questionId);
  //     });
  //   } else {
  //     this.questionList.forEach((question) => (question.selected = false));
  //   }

  //   this.updateSelectedQuestions();
  // }
  toggleAllQuestionBanks() {
    this.selectedQuestionBanks = []; // reuse same array for consistency
  
    if (this.selectedAllQuestionBank) {
      this.questionBankList.forEach((bank) => {
        bank.selected = true;
        this.selectedQuestionBanks.push(bank.questionBankId);
      });
    } else {
      this.questionBankList.forEach((bank) => (bank.selected = false));
    }
  
    this.updateSelectedQuestionBanks();
  }

  // onQuestionToggle(question: any) {
  //   if (question.selected) {
  //     this.selectedQuestions.push(question.questionId);
  //   } else {
  //     this.selectedQuestions = this.selectedQuestions.filter(
  //       (id) => id !== question.questionId
  //     );
  //   }

  //   this.selectAllQuestions = this.questionList.every((q) => q.selected);
  //   this.updateSelectedQuestions();
  // }

  // Update selected questions in selectedSkills
  // updateSelectedQuestions() {
  //   if (!this.selectedSkills) {
  //     this.selectedSkills = {
  //       assessmentName: '',
  //       selectedskills: [],
  //       questionIds: [],
  //     };
  //   }
  //   this.selectedSkills.questionIds = this.selectedQuestions;
  // }

  onQuestionBankToggle(bank: any) {  
  if (bank.selected) {
    this.selectedQuestionBanks.push(bank.questionBankId);
  } else {
    this.selectedQuestionBanks = this.selectedQuestionBanks.filter(
      (id) => id !== bank.questionBankId
    );
  }

  this.selectedAllQuestionBank = this.questionBankList.every((b) => b.selected);
  this.updateSelectedQuestionBanks();
}

updateSelectedQuestionBanks() {
  if (!this.selectedSkills) {
    this.selectedSkillbank = {
      assessmentName: '',
      selectedskills: [],
      questionBankId: [],
    };
  }
  this.selectedSkillbank.questionBankId = this.selectedQuestionBanks;
}


  updateSelectedSkills() {
    if (!this.selectedSkills) {
      this.selectedSkills = {
        assessmentName: '',
        selectedskills: [],
        questionIds: [],
      };
    }

    this.selectedSkills.assessmentName = this.assessmentName
      ? this.assessmentName
      : '';
    if (!this.usermodel) {
      this.selectedSkills.selectedskills = this.SkillsList.filter(
        (skill) => skill.gradient
      );
    } else {
      this.selectedSkills.selectedskills = this.scheduledskillsList.filter(
        (skill) => skill.gradient
      );
    }
  }

  onAssessmentNameChange() {
    this.selectedSkills.assessmentName = this.assessmentName;
  }

  usedefault() {
    this.selectedSkills.questionIds = [];
    this.assignAssessment();
  }

  onstartexam() {
    if (this.selectedSkills && this.selectedSkills.selectedskills?.length > 0) {
      const incompleteSkillLabels: string[] = [];
      const incompleteAssessmentSkillLabels: string[] = [];

      this.selectedSkills.selectedskills.forEach((selectedSkill) => {
        const matchingLearning = this.userlearninglist.find(
          (userLearning) => userLearning.skillId === selectedSkill.skillId
        );

        const matchingAssessment = this.userscheduledassessmentData.find(
          (scheduledassessment) =>
            scheduledassessment.learnerId ===
              this.loggedInUser.applicationUserId &&
            !scheduledassessment.isCompleted
        );

        if (matchingAssessment) {
          const matchingSkill = matchingAssessment.skillsData.find(
            (skill) =>
              skill.skillId === selectedSkill.skillId &&
              skill.levelId === selectedSkill.proficiencyValue.levelId
          );
          if (matchingSkill) {
            incompleteAssessmentSkillLabels.push(
              `${selectedSkill.skillName} (${selectedSkill.proficiencyValue.levelValue})`
            );
          }
        } else if (matchingLearning) {
          const matchingSubModule =
            matchingLearning.getLearningJourneySubModuleResponses.find(
              (subModule) =>
                subModule.levelId === selectedSkill.proficiencyValue.levelId
            );

          if (!matchingSubModule) {
            incompleteSkillLabels.push(
              `${selectedSkill.skillName} (${selectedSkill.proficiencyValue.levelValue})`
            );
          } else if (!matchingSubModule.isCompleted) {
            incompleteSkillLabels.push(
              `${selectedSkill.skillName} (${selectedSkill.proficiencyValue.levelValue})`
            );
          }
        } else {
          incompleteSkillLabels.push(
            `${selectedSkill.skillName} (${selectedSkill.proficiencyValue.levelValue})`
          );
        }
      });

      if (incompleteAssessmentSkillLabels.length > 0) {
        const formatted = incompleteAssessmentSkillLabels.join(', ');
        this.toaster.warning(
          `Already assessment assigned on this skill: ${formatted}`
        );
      } else if (incompleteSkillLabels.length > 0) {
        const formatted = incompleteSkillLabels.join(', ');
        this.toaster.warning(
          `Please complete the following from training before taking the assessment: ${formatted}`
        );
      } else {
        this.closedialogue();
        this.emulateservice.setSkills(this.selectedSkills);
        this.router.navigate([
          `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home/assessment/startexam`,
        ]);
      }
    }
  }

  assignAssessment() { 
    this.isLoading = true;
    if (typeof this.ExamscheduleDate === 'string') {
      this.ExamscheduleDate = new Date(this.ExamscheduleDate);
    }
    this.ExamscheduleDate.setHours(23, 59, 59, 999);
    const selectedBanks = this.questionBankList.filter((bank: any) =>
      this.selectedQuestionBanks.includes(bank.questionBankId)
    );
  
    
    const insufficientBanks = selectedBanks.filter(
      (bank: any) => bank.totalQuestions < this.selectedNumber
    );
  
   
    if (insufficientBanks.length > 0) {
      const bankNames = insufficientBanks
        .map((b: any) => b.title || b.skillName)
        .join(', ');
  
      this.toaster.warning(
        `The following question banks don't have enough questions: ${bankNames}. Please add more questions or reduce the number of questions.`
      );
  
      this.isLoading = false;
      return;
    }
    const command: ScheduleData = {
      userId: this.usermodel.userId,
      scheduleduserId: this.loggedInUser.applicationUserId,
      examScheduleDate: this.ExamscheduleDate.toISOString(),
      assessmentName: this.selectedSkills.assessmentName,
     
      // questionDetails:
      //   this.selectedSkills.questionIds?.map((id: any) => ({
      //     questionId: id,
      //   })) || [],
      skillDetails: this.selectedSkills.selectedskills.filter(
        (x) => x.skillId && x.skillLevelId
      ),
      questionBanks: (this.selectedSkillbank.questionBankId).map((id:any) => ({
        questionBankId: id
      })),
      numberOfQuestions:this.selectedNumber,
    };
    console.log(command,"the command for the shedule assessment");
    this.scheduleservice.scheduleAssessment(command).subscribe({
      next: (res) => {
        if (res) {
          this.closedialogue();
          this.isLoading = false;
          this.toaster.success('Assessment Assigned Successfully');
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
    this.isLoading = false;
  }

  oncancel() {
    this.closedialogue();
  }

  closedialogue() {
    this.dialogRef.close();
  }

  goBack() {
    this.isSkillSelectionStep = true;
  }

  goToNextStep() {
    const selected = this.selectedSkills.selectedskills || [];
    this.getQuestions(this.selectedSkills.selectedskills);
    const skills = selected.map(s => ({
      skillId: s.skillId,
      skillLevelId: s.skillLevelId
    }));
  
 
    this.questionservice.getQuestionBanks(this.loggedInUser.organizationId, skills)
    .subscribe({
      next: (res) => {
        this.questionBankList = (res as any[]).map((q: any) => ({
          ...q,
          selected: false
        }));
        this.isLoading = false;
        this.isSkillSelectionStep = false;
      },
      error: (err) => {
        console.error('Failed to load question banks:', err);
        this.isLoading = false;
      }
    });
  }

  renderMatchType(questionJson: string): string {
    try {
      const qObj = JSON.parse(questionJson);
      if (!qObj.pairs || !Array.isArray(qObj.pairs)) {
        return this.stripHtmlTags(qObj.question || '');
      }
  
      let html = `
        <div>${this.stripHtmlTags(qObj.question)}</div>
        <table class="table table-bordered mt-2">
          <thead><tr><th>Column A</th><th>Column B</th></tr></thead>
          <tbody>`;
  
      qObj.pairs.forEach((pair: { left: string; right: string }) => {
        html += `
          <tr>
            <td>${this.stripHtmlTags(pair.left)}</td>
            <td>${this.stripHtmlTags(pair.right)}</td>
          </tr>`;
      });
  
      html += `</tbody></table>`;
      return html;
    } catch {      
      return this.stripHtmlTags(questionJson);
    }
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
  

  getQuestions(selectedskills: UserSkillsModel[]) {
    const command: GetallOrgsquery = {
      page: 0,
      pagesize: 0,
      loggedInUserId: this.loggedInUser.applicationUserId,
      skills: selectedskills,
      organizationId: this.loggedInUser.organizationId,
    };
    this.isLoading = true;
    this.questionservice.getAllquestions(command).subscribe({
      next: (res) => {
        this.questionList = res.questions.map((q) => ({
          ...q,
          selected: false,
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  getQuestionBanks(selectedSkills: UserSkillsModel[]) {
    const skillParams = selectedSkills.map(s => ({
      skillId: s.skillId,
      skillLevelId: s.skillLevelId
    }));
  
    this.questionservice.getQuestionBanks(this.loggedInUser.organizationId, skillParams)
      .subscribe({
        next: res => console.log('Question Banks:', res),
        error: err => console.error(err)
      });
  }
}
