import { Component, OnInit } from '@angular/core';
import {
  ApplicationUser,
  GetallOrgsquery,
  QuestionModel,
  QuestionResponseModel,
  QuestionsList,
  UserSkillsModel,
} from '@app/shared/models/commonmodel';
import { questionService } from '@app/shared/services/question.service';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { TableLazyLoadEvent } from 'primeng/table';
import { ActivatedRoute, Route, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireimportComponent } from '../questionnaireimport/questionnaireimport.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-allquestions',
  templateUrl: './allquestions.component.html',
  styleUrl: './allquestions.component.scss',
})
export class AllquestionsComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  QuestionsList: QuestionsList[] = [];
  loading: boolean = false;
  isLoading: boolean = false;
  totalquestions: number = 0;
  totalRecords: any;
  popupImage: string | null = null;
  skillId:string='';
  levelId:string='';
  isQuestionBankView=false;

  constructor(
    private questionservice: questionService,
    private router: Router,
    private title: Title,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private route:ActivatedRoute
  ) {
    this.title.setTitle('Questionnaire');
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
    this.route.params.subscribe(params => {
      this.skillId = params['skillId'];
      this.levelId = params['levelId'];
      this.loadQuestions();
    });

  }

  loadQuestions(event?: TableLazyLoadEvent) {
    setTimeout(() => {
      this.loading = true;
    });
    
    const page = event ? event.first! / event.rows! : 0;
    const size = event ? event.rows! : 10;
    const filters = event ? event.filters || {} : {};
    const sortField = event ? event.sortField : null;
    const sortOrder = event ? (event.sortOrder === 1 ? 'asc' : 'desc') : 'asc';

   
    if(this.skillId!==undefined && this.levelId!==undefined){
      var skill:UserSkillsModel={
        skillId:this.skillId,
        skillLevelId:this.levelId      
      }

      let skillquery: GetallOrgsquery = {
        page: page ? page : 0,
        pagesize: size,
        filters: filters,
        sortField: sortField,
        sortOrder: sortOrder,
        loggedInUserId: this.loggedInUser.applicationUserId,
        organizationId: this.loggedInUser.organizationId,
        skills:[skill]
      };
      this.getallquestions(skillquery);
      this.isQuestionBankView=true
    }
    else{
      let query: GetallOrgsquery = {
        page: page ? page : 0,
        pagesize: size,
        filters: filters,
        sortField: sortField,
        sortOrder: sortOrder,
        loggedInUserId: this.loggedInUser.applicationUserId,
        organizationId: this.loggedInUser.organizationId,
      };

      this.getallquestions(query);
      this.isQuestionBankView=false;
    }
    
   

   
  }
  
  renderHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getallquestions(query: GetallOrgsquery) {
    
    if (query) {
      // this.isLoading = true;
      this.questionservice.getAllquestions(query).subscribe({
        next: (res) => {
          if (res) {
            this.QuestionsList = res.questions;
            this.totalquestions = res.total;
            this.loading = false;
            // this.isLoading = false;
            if (
              this.QuestionsList.length < query.pagesize &&
              query.page === 0
            ) {
              this.totalRecords = this.QuestionsList.length;
            } else {
              this.totalRecords = res.total;
            }
          }
        },
        // error: (err) => {
        //   this.isLoading = false;
        // }
      });
    }
    
  }

  onImageClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'img') {
      this.popupImage = (target as HTMLImageElement).src;
    }
  }

  changequestionStatus(question: QuestionsList) {
    const alertMsg: string =
      'The Question Will be ' + (question.isActive ? 'Inactive' : 'Active');
    Swal.fire({
      title: 'Are you sure?',
      text: alertMsg,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes!',
      width: '400px',
      padding: '1rem',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        const command: QuestionModel = {
          questionId: question.questionId,
          question: question.question,
          option1: question.option1,
          option2: question.option2,
          option3: question.option3,
          option4: question.option4,
          correctAnswer: question.correctAnswer,
          levelId: question.skillLevelId,
          skillId: question.skillId,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          questiontypeId: question.questionTypeId,
          isActive: (question.isActive = !question.isActive),
          orgId: this.loggedInUser.organizationId,
        };
        this.questionservice.updatequestion(command).subscribe({
          next: (res) => {
            this.loadQuestions();
            if (res.isSuccess) {
              this.toastr.success(res.message);
            }
            this.isLoading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          },
        });
      }
    });
  }

  editQuestion(questionId: string) {
    this.router.navigate([`/editquestion/${questionId}`]);
  }
  openImportDialog(): void {
    const dialogRef = this.dialog.open(QuestionnaireimportComponent, {
      width: '500px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.loadQuestions();
    });
  }

  renderMatchType(questionJson: string): string {
    try {
      const qObj = JSON.parse(questionJson);
      if (!qObj.pairs || !Array.isArray(qObj.pairs)) {
        return qObj.question || '';
      }
  
      let html = `<table class="table table-bordered"><thead><tr><th>Column A</th><th>Column B</th></tr></thead><tbody>`;
      qObj.pairs.forEach((pair: { left: string; right: string }) => {
        html += `<tr><td>${pair.left}</td><td>${pair.right}</td></tr>`;
      });
      html += `</tbody></table>`;
      return html;
    } catch (e) {
      return questionJson; // fallback if not JSON
    }
  }

  

  addquetion(){
    if(this.skillId!==undefined && this.levelId!==undefined)
      {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'questionnaire',
        'questionbank',
        this.loggedInUser.organizationId,
        'viewquestion',
        this.skillId,
        this.levelId,
        'addquestion'
      ]);
        
    }
    else{
      this.router.navigate(['addquestion'],{relativeTo:this.route});
    }
  }

  onEditQuestion(question: any) {
    if (this.skillId && this.levelId) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'questionnaire',
        'questionbank',
        question.organizationId,
        'viewquestion',
        this.skillId,
        this.levelId,
        'editquestion',
        question.questionId
      ]);
    } else {
      this.router.navigate([
        question.organizationId,
        'editquestion',
        question.questionId
      ], { relativeTo: this.route });
    }
  }

  back(){
    this.router.navigate([this.loggedInUser.organizationName,this.loggedInUser.roleName,'questionnaire','questionbank']);
  }
  
}
