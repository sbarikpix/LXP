import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillLibraryComponent } from './skill-library/skill-library.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TreeModule } from 'primeng/tree';
import { SkeletonModule } from 'primeng/skeleton';
import { AdminModule } from '../admin.module';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ListboxModule } from 'primeng/listbox';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AssignSkillDialogComponent } from './assign-skill-dialog/assign-skill-dialog.component';
import { ToastrModule } from 'ngx-toastr';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';



@NgModule({
  declarations: [
    SkillLibraryComponent,
    AssignSkillDialogComponent
  ],
  imports: [
    SharedModule,
    AdminModule,
    CommonModule,
    FormsModule,
    TreeModule,
    SkeletonModule,
    DialogModule,
    ListboxModule,
    CheckboxModule,
    ButtonModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatInputModule,
    ToastrModule.forRoot(),

    RouterModule.forChild([
      {
        path: '',
        component: SkillLibraryComponent
      }
    ])
  ]
})
export class SkillLibraryModule { }
