import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { AssessmentComponent } from '../assessment/assessment/assessment.component';
import { ExamPageComponent } from '../assessment/exam-page/exam-page/exam-page.component';
import { SkillsViewComponent } from './skills-viewpage/skills-view/skills-view.component';
import { GamificationComponent } from './gamification/gamification.component';
import { LearningjourneyComponent } from './learningjourney/learningjourney.component';
import { CreatelearningjourneyComponent } from './learningjourney/createlearningjourney/createlearningjourney.component';
import { ShowlearningjourneyComponent } from './learningjourney/showlearningjourney/showlearningjourney.component';
import { LearningpathComponent } from './learningpath/learningpath/learningpath.component';
import { SharedModule } from '@app/shared/shared.module';
import { AdminModule } from '../admin.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { adminGuard } from '@app/shared/Guards/admin.guard';


@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    AdminModule,
    CommonModule,
    MatAutocompleteModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomepageComponent,
        // canActivate: [globalAdminGuard]
      },
      //home page section Routes
      {
        path: 'assessment',
        component: AssessmentComponent,
      },
      {
        path: 'assessment/startexam',
        component: ExamPageComponent,
      },
      {
        path: 'assessment/preview/:id',
        component: ExamPageComponent,
      },
      {
        path: 'assessment/startexam/:assignedId',
        component: ExamPageComponent,
      },
      {
        path: 'skills',
        component: SkillsViewComponent,
      },
      {
        path: 'gamification',
        component: GamificationComponent,
      },
      {
        path: 'learningjourney',
        component: LearningjourneyComponent,
      },
      {
        path: 'learningjourney/createjourney',
        component: CreatelearningjourneyComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'learningjourney/createjourney/:journeyId',
        component: CreatelearningjourneyComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'learningjourney/showjourney/:journeyId',
        component: ShowlearningjourneyComponent,
      },
      {
        path: 'learningpath/:skillId/:levelId/:userId',
        component: LearningpathComponent,
      },
    ])
  ]
})
export class HomepageModule { }
