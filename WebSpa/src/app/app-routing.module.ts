import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './shared/components/home/home.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { authGuard } from './shared/Guards/auth.guard';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { environment } from '../environments/environment';
import { ResumeTemplateComponent } from './admin/homepage/skills-viewpage/resume-template/resume-template.component';
import { LoginComponent } from './shared/components/login/login.component';
import { SignupComponent } from './shared/components/signup/signup.component';
import { ForgotpasswordComponent } from './shared/components/forgotpassword/forgotpassword.component';
import { AuthGuard } from './shared/Guards/auth-guards';
import { AuthPageGuard } from './shared/Guards/authpage-guards';
import { ViewBadgeComponent } from './shared/components/view-badge/view-badge.component';
import { ResetpasswordComponent } from './shared/components/resetpassword/resetpassword.component';
import { adminGuard } from './shared/Guards/admin.guard';
import { CommonModule } from '@angular/common';
import { AppConstants } from './shared/App-Constants';
import { HelpsComponent } from './admin/helps/helps.component';

const baseurl = environment.production;

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'full',
    // canActivate: [AuthPageGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthPageGuard],
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [AuthPageGuard],
  },
  {
    path: 'forgotpassword',
    component: ForgotpasswordComponent,
    canActivate: [AuthPageGuard],
  },
  {
    path: 'resetpassword/:userId',
    component: ResetpasswordComponent,
    canActivate: [AuthPageGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':organisationUniqueName/:role',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: ':organisationUniqueName/:role/home',
    loadChildren: () =>
      import('./admin/homepage/homepage.module').then((m) => m.HomepageModule),
    canActivate: [AuthGuard],
  },
  {
    path: ':organisationUniqueName/:role/tenant',
    loadChildren: () =>
      import('./admin/components/tenant.module').then((m) => m.TenantModule),
    canActivate: [AuthGuard],
    data: { allowedRoles: ['GlobalAdmin', 'Admin', 'Manager'] },
  },
  {
    path: ':organisationUniqueName/:role/users',
    loadChildren: () =>
      import('./admin/components/users.module').then((m) => m.UsersModule),
    canActivate: [AuthGuard],
  },
  {
    path: ':organisationUniqueName/:role/questionnaire',
    loadChildren: () =>
      import('./admin/questionnaire/questionnaire.module').then(
        (m) => m.QuestionnaireModule
      ),
    canActivate: [AuthGuard, adminGuard],
  },
  {
    path: ':organisationUniqueName/:role/skillbase',
    loadChildren: () =>
      import('./admin/skillLibrary/skill.library.module').then(
        (m) => m.SkillLibraryModule
      ),
    data: { allowedRoles: ['GlobalAdmin', 'Admin', 'Manager'] },
    canActivate: [AuthGuard],
  },
  {
    path: ':organisationUniqueName/:role/usercontent',
    loadChildren: () =>
      import('./admin/usercontent/usercontent.module').then(
        (m) => m.UsercontentModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },
  {
    path: 'resume/:organizationId/:id/:username',
    component: ResumeTemplateComponent,
  },
  {
    path: 'view-badge/:organizationId/:userId',
    component: ViewBadgeComponent,
  },
  {
    path: ':organisationUniqueName/:role/help',
    component: HelpsComponent,
  },
  // {
  //   path:'**',
  //   redirectTo:'/unauthorized',
  //   pathMatch:'full'
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
