import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';

// Component

// Material Inputs
import { MatTableModule } from '@angular/material/table';
import { OrganizationsComponent } from './components/organizations/organizations.component';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AvatarModule } from 'ngx-avatars';
import { AvatarModule as primeAvatar } from 'primeng/avatar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { OrganizationViewComponent } from './components/organization-view/organization-view.component';
import { MatCardModule } from '@angular/material/card';
import { OrganizationEditComponent } from './components/organization-edit/organization-edit.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersComponent } from './components/users/users.component';
import { UserEditItemComponent } from './components/user-edit-item/user-edit-item.component';
import { UserViewItemComponent } from './components/user-view-item/user-view-item.component';
import { OrganizationInterestsComponent } from './components/organization-interests/organization-interests.component';
import { MatTabsModule } from '@angular/material/tabs';
import { OrganizationJobComponent } from './components/organization-job/organization-job.component';
import { OrganizationSkillsComponent } from './components/organization-skills/organization-skills.component';
import { OrganizationJobTitlesComponent } from './components/organization-job-titles/organization-job-titles.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { OrganizationTeamsComponent } from './components/organization-teams/organization-teams.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatOptionModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImageUploadDialogComponent } from './components/image-upload-dialog/image-upload-dialog.component';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { OrganizationJobImportComponent } from './components/organization-job-import/organization-job-import.component';
import { OrganizationTeamImportComponent } from './components/organization-team-import/organization-team-import.component';
import { OrganizationsOverviewComponent } from './components/organizations-overview/organizations-overview.component';
import { SearchPipe } from '@app/shared/services/search.pipe';
import { AllquestionsComponent } from './questionnaire/allquestions/allquestions.component';
import { AddquestionComponent } from './questionnaire/addquestion/addquestion/addquestion.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { AssessmentComponent } from './assessment/assessment/assessment.component';
import { CalenderPopupComponent } from './assessment/calender-popup/calender-popup/calender-popup.component';
import { ExamPageComponent } from './assessment/exam-page/exam-page/exam-page.component';
import { BaseChartDirective } from 'ng2-charts';
import { MatRadioModule } from '@angular/material/radio';
import { CalendarModule } from 'primeng/calendar';
import { AddSkillDialogComponent } from './components/user-view-item/add-skill-dialog/add-skill-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { TreeModule } from 'primeng/tree';
import { SkeletonModule } from 'primeng/skeleton';
import { HomepageComponent } from './homepage/homepage/homepage.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkillsViewComponent } from './homepage/skills-viewpage/skills-view/skills-view.component';
import { LearningpathComponent } from './homepage/learningpath/learningpath/learningpath.component';
import { IntegrationComponent } from './integration/integration.component';
import { NotificationComponent } from './notifications/notification/notification.component';
import { QuestionnaireimportComponent } from './questionnaire/questionnaireimport/questionnaireimport.component';
import { CourseviewpageComponent } from './homepage/courseviewpage/courseviewpage.component';
import { QRCodeModule } from 'angularx-qrcode';
import { SharedModule } from '@app/shared/shared.module';
// import { UserContentviewComponent } from './usercontent/user-contentview/user-contentview.component';
import { GamificationComponent } from './homepage/gamification/gamification.component';
import { AddBadgeDialogComponent } from './homepage/gamification/add-badge-dialog/add-badge-dialog.component';
import { CarouselModule } from 'primeng/carousel';
import { ReportsComponent } from './reports/reports.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { LearningjourneyComponent } from './homepage/learningjourney/learningjourney.component';
import { CreatelearningjourneyComponent } from './homepage/learningjourney/createlearningjourney/createlearningjourney.component';
import { ShowlearningjourneyComponent } from './homepage/learningjourney/showlearningjourney/showlearningjourney.component';
import { ManagerosterPopupComponent } from './homepage/learningjourney/manageroster-popup/manageroster-popup.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { GroupsComponent } from './homepage/groups/groups.component';
import { AddGroupDialogComponent } from './homepage/groups/add-group-dialog/add-group-dialog.component';
import { ViewGroupDialogComponent } from './homepage/groups/view-group-dialog/view-group-dialog/view-group-dialog.component';
import { NgxEditorModule } from 'ngx-editor';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { HelpsComponent } from './helps/helps.component';
import { TalentMapComponent } from './talent-map/talent-map.component';
import { MapHeaderComponent } from './talent-map/map-header/map-header.component';
import { MapSidebarComponent } from './talent-map/map-sidebar/map-sidebar.component';
import { MapAnalyticsectionComponent } from './talent-map/map-analyticsection/map-analyticsection.component';
import { MapBottompanelComponent } from './talent-map/map-bottompanel/map-bottompanel.component';
import { MapAiChatbotComponent } from './talent-map/map-ai-chatbot/map-ai-chatbot.component';
import { MapSectionComponent } from './talent-map/map-section/map-section.component';
import { MapSidebarRightComponent } from './talent-map/map-sidebar-right/map-sidebar-right.component';

@NgModule({
  declarations: [
    OrganizationsComponent,
    OrganizationViewComponent,
    OrganizationEditComponent,
    UsersComponent,
    UserEditItemComponent,
    UserViewItemComponent,
    OrganizationInterestsComponent,
    OrganizationJobComponent,
    OrganizationSkillsComponent,
    OrganizationJobTitlesComponent,
    OrganizationTeamsComponent,
    ImageUploadDialogComponent,
    OrganizationJobImportComponent,
    OrganizationTeamImportComponent,
    OrganizationsOverviewComponent,
    SearchPipe,
    AllquestionsComponent,
    AddquestionComponent,
    AssessmentComponent,
    CalenderPopupComponent,
    ExamPageComponent,
    AddSkillDialogComponent,
    SkillsViewComponent,
    HomepageComponent,
    LearningpathComponent,
    IntegrationComponent,
    NotificationComponent,
    QuestionnaireimportComponent,
    CourseviewpageComponent,
    GamificationComponent,
    AddBadgeDialogComponent,
    ReportsComponent,
    LearningjourneyComponent,
    CreatelearningjourneyComponent,
    ShowlearningjourneyComponent,
    ManagerosterPopupComponent,
    GroupsComponent,
    AddGroupDialogComponent,
    ViewGroupDialogComponent,
    HelpsComponent,
    TalentMapComponent,
    MapHeaderComponent,
    MapSidebarComponent,
    MapAnalyticsectionComponent,
    MapBottompanelComponent,
    MapAiChatbotComponent,
    MapSectionComponent,
    MapSidebarRightComponent,
  ],
  imports: [
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
    SharedModule,
    CarouselModule,
    ScrollingModule,
    MatProgressSpinnerModule,
    TagModule,
    ToggleButtonModule,
    // AngularMultiSelectModule,
    primeAvatar,
    NgxEditorModule,
    // DialogModule,
    // ListboxModule,
    // CheckboxModule,
    // ButtonModule,
    InfiniteScrollDirective,
  ],
  providers: [provideNativeDateAdapter(), DatePipe],
})
export class AdminModule {}
