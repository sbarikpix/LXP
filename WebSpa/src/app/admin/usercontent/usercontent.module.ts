import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserContentviewComponent } from './user-contentview/user-contentview.component';
import { SharedModule } from '@app/shared/shared.module';
import { AdminModule } from '../admin.module';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ToastrModule } from 'ngx-toastr';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { UploadUsercontentComponent } from './upload-usercontent/upload-usercontent.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { AuthGuard } from '@app/shared/Guards/auth-guards';

@NgModule({
  declarations: [UserContentviewComponent, UploadUsercontentComponent],
  imports: [
    CommonModule,
    SharedModule,
    AdminModule,
    FormsModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatInputModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatLabel,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    ToastrModule.forRoot(),
    RouterModule.forChild([
      {
        path: '',
        component: UserContentviewComponent,
        canActivate: [AuthGuard],
        data: { allowedRoles: ['GlobalAdmin', 'Admin', 'Manager'] },
      },
    ]),
    InfiniteScrollDirective,
  ],
})
export class UsercontentModule {}
