import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { AdminModule } from '../admin.module';
import { UsersComponent } from './users/users.component';
import { UserEditItemComponent } from './user-edit-item/user-edit-item.component';
import { UserViewItemComponent } from './user-view-item/user-view-item.component';
import { AllquestionsComponent } from '../questionnaire/allquestions/allquestions.component';
import { ReportsComponent } from '../reports/reports.component';
import { NotificationComponent } from '../notifications/notification/notification.component';
import { IntegrationComponent } from '../integration/integration.component';
import { AuthGuard } from '@app/shared/Guards/auth-guards';
import { userOwnershipGuard } from '@app/shared/Guards/user-ownership.guard';
import { authGuard } from '@app/shared/Guards/auth.guard';

@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    AdminModule,
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: UsersComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },      
      },
      {
        path: ':organizationId/add',
        component: UserEditItemComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin'] },
      },
      {
        path: ':organizationId/:id/overview',
        component: UserViewItemComponent,      
      },
      {
        path: ':id/report',
        component: ReportsComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },        
      },
      {
        path: ':id/notifications',
        component: NotificationComponent,
      },
      {
        path: ':organizationId/:id/overview/edit',
        component: UserEditItemComponent,
        canActivate: [AuthGuard],
      },
      {
        path: ':id/integration',
        component: IntegrationComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin'] },  
      },
      {
        path: ':id/groups', 
        loadChildren: () =>
          import('../homepage/groups/groups.module').then(m => m.GroupsModule),
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },
      }
    ]),
  ],
})
export class UsersModule {}
