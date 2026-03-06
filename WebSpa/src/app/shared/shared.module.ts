import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from '@app/admin/admin-routing.module';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ToastrModule } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AvatarModule } from 'ngx-avatars';
import { MatStepperModule } from '@angular/material/stepper';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { BaseChartDirective } from 'ng2-charts';
import { CalendarModule } from 'primeng/calendar';
import { TreeModule } from 'primeng/tree';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { QRCodeModule } from 'angularx-qrcode';
// import { LoginComponent } from './components/login/login.component';



@NgModule({
  declarations: [
    // LoginComponent
  ],
  imports: [
    CommonModule,
    MatGridListModule,
    AdminRoutingModule,
    MatTableModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatStepperModule,
    MatDatepickerModule,
    AvatarModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    ToastrModule.forRoot(),
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    TableModule,
    MenuModule,
    ButtonModule,
    TooltipModule,
    MultiSelectModule,
    CheckboxModule,
    DropdownModule,
    NgxMatSelectSearchModule,
    MatLabel,
    AngularEditorModule,
    BaseChartDirective,
    MatRadioModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatInputModule,
    MatRadioModule,
    CalendarModule,
    TreeModule,
    SkeletonModule,
    ProgressBarModule,
    QRCodeModule,
  ],
  exports: [
    CommonModule,
    MatGridListModule,
    CommonModule,
    AdminRoutingModule,
    MatTableModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatStepperModule,
    MatDatepickerModule,
    AvatarModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    TableModule,
    MenuModule,
    ButtonModule,
    TooltipModule,
    MultiSelectModule,
    CheckboxModule,
    DropdownModule,
    NgxMatSelectSearchModule,
    MatLabel,
    AngularEditorModule,
    BaseChartDirective,
    MatRadioModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatInputModule,
    MatRadioModule,
    CalendarModule,
    TreeModule,
    SkeletonModule,
    ProgressBarModule,
    QRCodeModule,
  ]
})
export class SharedModule { }
