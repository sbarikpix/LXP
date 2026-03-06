import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GroupsComponent } from './groups.component';
import { ViewGroupDialogComponent } from './view-group-dialog/view-group-dialog/view-group-dialog.component';
import { SharedModule } from 'primeng/api';



@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: GroupsComponent
      },
      {
        path: 'view/:groupId',
        component: ViewGroupDialogComponent,
      },      
    ])
  ]
})
export class GroupsModule { }
