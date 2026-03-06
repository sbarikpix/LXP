import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AllquestionsComponent } from './allquestions/allquestions.component';
import { SharedModule } from '@app/shared/shared.module';
import { AdminModule } from '../admin.module';
import { AddquestionComponent } from './addquestion/addquestion/addquestion.component';
import { authGuard } from '@app/shared/Guards/auth.guard';
import { globalAdminGuard } from '@app/shared/Guards/global-admin.guard';
import { adminGuard } from '@app/shared/Guards/admin.guard';
import { userOwnershipGuard } from '@app/shared/Guards/user-ownership.guard';
import { QuestionBankComponent } from './question-bank/question-bank.component';



@NgModule({
  declarations: [
    QuestionBankComponent,
    // AllquestionsComponent
  ],
  imports: [
    SharedModule,
    AdminModule,
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: AllquestionsComponent,       
      },
      {
        path: 'addquestion',
        component: AddquestionComponent,
      },
      {
        path:'questionbank',
        component:QuestionBankComponent,       
      },     
      {
        path: ':organizationId/editquestion/:id',
        component: AddquestionComponent,         
      },
      {
        path:'questionbank/:organizationId/viewquestion/:skillId/:levelId',
        component:AllquestionsComponent,       
      },
      {
        path:'questionbank/:organizationId/viewquestion/:skillId/:levelId/addquestion',
        component:AddquestionComponent
      },
      {
        path: 'questionbank/:organizationId/viewquestion/:skillId/:levelId/editquestion/:id',
        component:AddquestionComponent
      }
    ])
  ]
})
export class QuestionnaireModule { }
