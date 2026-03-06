import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationsComponent } from './components/organizations/organizations.component';
import { OrganizationViewComponent } from './components/organization-view/organization-view.component';
import { OrganizationEditComponent } from './components/organization-edit/organization-edit.component';
import { UsersComponent } from './components/users/users.component';
import { UserEditItemComponent } from './components/user-edit-item/user-edit-item.component';
import { UserViewItemComponent } from './components/user-view-item/user-view-item.component';
import { OrganizationJobComponent } from './components/organization-job/organization-job.component';
import { adminGuard } from '../shared/Guards/admin.guard';
import { OrganizationsOverviewComponent } from './components/organizations-overview/organizations-overview.component';
import { globalAdminGuard } from '@app/shared/Guards/global-admin.guard';
import { AllquestionsComponent } from './questionnaire/allquestions/allquestions.component';
import { AddquestionComponent } from './questionnaire/addquestion/addquestion/addquestion.component';
import { AssessmentComponent } from './assessment/assessment/assessment.component';
import { ExamPageComponent } from './assessment/exam-page/exam-page/exam-page.component';
import { HomepageComponent } from './homepage/homepage/homepage.component';
import { SkillsViewComponent } from './homepage/skills-viewpage/skills-view/skills-view.component';
import { LearningpathComponent } from './homepage/learningpath/learningpath/learningpath.component';
import { IntegrationComponent } from './integration/integration.component';
import { NotificationComponent } from './notifications/notification/notification.component';
import { CourseviewpageComponent } from './homepage/courseviewpage/courseviewpage.component';
import { authGuard } from '@app/shared/Guards/auth.guard';
import { GamificationComponent } from './homepage/gamification/gamification.component';
import { ReportsComponent } from './reports/reports.component';
import { LearningjourneyComponent } from './homepage/learningjourney/learningjourney.component';
import { CreatelearningjourneyComponent } from './homepage/learningjourney/createlearningjourney/createlearningjourney.component';
import { ShowlearningjourneyComponent } from './homepage/learningjourney/showlearningjourney/showlearningjourney.component';
import { ResumeTemplateComponent } from './homepage/skills-viewpage/resume-template/resume-template.component';
import { GroupsComponent } from './homepage/groups/groups.component';
import { TalentMapComponent } from './talent-map/talent-map.component';

const routes: Routes = [
  {
    path: 'courseview',
    component: CourseviewpageComponent,
  },
  {
    path: 'skillscape-atlas',
    component: TalentMapComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
