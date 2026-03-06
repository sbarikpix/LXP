import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { AdminModule } from '../admin.module';
import { OrganizationsComponent } from './organizations/organizations.component';
import { OrganizationEditComponent } from './organization-edit/organization-edit.component';
import { OrganizationViewComponent } from './organization-view/organization-view.component';
import { OrganizationsOverviewComponent } from './organizations-overview/organizations-overview.component';
import { UserViewItemComponent } from './user-view-item/user-view-item.component';
import { UserEditItemComponent } from './user-edit-item/user-edit-item.component';
import { AuthGuard } from '@app/shared/Guards/auth-guards';
import { userOwnershipGuard } from '@app/shared/Guards/user-ownership.guard';



@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    AdminModule,
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OrganizationsComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin'] },
        // canActivate: [globalAdminGuard],
      },
      {
        path: 'tenant',
        component: OrganizationsComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin'] },
        // canActivate: [globalAdminGuard],
      },
      {
        path: 'add',
        component: OrganizationEditComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin'] },
        // canActivate: [globalAdminGuard],
      },
      {
        // Org Overview
        path: ':id',
        component: OrganizationViewComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },

        // canActivate: [adminGuard],
      },
      // Organization Overview Tab Routes
      {
        // Route for tabs --> overview, users, data
        path: ':organizationId/:tab',
        component: OrganizationsOverviewComponent,
        // canActivate: [adminGuard],
      },
      // {
      //   // Route for tabs under data --> skills/interests/teams/jobs
      //   path: 'tenant/:organizationId/:tab/properties/:subtab/:activatedTab',
      //   component: OrganizationsOverviewComponent,
      //   // canActivate: [adminGuard],
      // },
      // {
      //   // Route for sub-tab actions(add-edit) under data --> skills/interests/teams/jobs
      //   path: 'tenant/:organizationId/:tab/properties/:subtab/:activatedTab/:id/:subtab-action',
      //   component: OrganizationsOverviewComponent,
      //   // canActivate: [adminGuard],
      // },
      {
        // Route for edit org under organization overview tab
        path: ':organizationId/overview/organization/Edit',
        component: OrganizationEditComponent,
        // canActivate:[AuthGuard],
        // data: { allowedRoles: ['GlobalAdmin'] },
      },

      // Routes for Org-Overview Users Tab(View/Add/Edit)
      {
        path: ':organizationId/:tab/:id/overview',
        component: UserViewItemComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },
      },
      {
        path: ':organizationId/:tab/add',
        component: UserEditItemComponent,
        canActivate:[AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },
        // canActivate: [adminGuard],
      },
      {
        path: ':organizationId/:tab/:id/overview/edit',
        component: UserEditItemComponent,
        canActivate:[AuthGuard,userOwnershipGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin','Manager'] },
        // canActivate: [adminGuard],
      },

      {
        path: ':organizationId/organization/Edit',
        component: OrganizationEditComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin','Admin'] },
      },
    ])
  ]
})
export class TenantModule { }
