import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  APP_INITIALIZER,
} from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';

// Oauth Library
import { OAuthModule, provideOAuthClient } from 'angular-oauth2-oidc';

// Component Imports
import { AppComponent } from './app.component';

// Module Imports
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AdminModule } from './admin/admin.module';
import { HomepageModule } from './admin/homepage/homepage.module';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';

import { HomeComponent } from './shared/components/home/home.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { SideNavComponent } from './shared/components/side-nav/side-nav.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
// import { authInterceptor } from './shared/interceptor/auth.interceptor';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { UserImportDocumentComponent } from './admin/components/user-import-document/user-import-document.component';
import { ToastrModule } from 'ngx-toastr';
import { MatToolbarModule } from '@angular/material/toolbar';
import { OrganizationInterestImportComponent } from './admin/components/organization-interest-import/organization-interest-import.component';
import { OrganizationSkillImportComponent } from './admin/components/organization-skill-import/organization-skill-import.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatError } from '@angular/material/form-field';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { TreeModule } from 'primeng/tree';
import { SkeletonModule } from 'primeng/skeleton';
import { SharedModule } from './shared/shared.module';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { HttpNetworkStateInterceptor } from './shared/app-network/http-network-state.interceptor';
import { AuthService } from './shared/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { ConfigurationService } from './shared/services/configurations.service';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './shared/components/login/login.component';
import { SignupComponent } from './shared/components/signup/signup.component';
import { ForgotpasswordComponent } from './shared/components/forgotpassword/forgotpassword.component';
import { ResumeTemplateComponent } from './admin/homepage/skills-viewpage/resume-template/resume-template.component';
import { ViewBadgeComponent } from './shared/components/view-badge/view-badge.component';
import { ResetpasswordComponent } from './shared/components/resetpassword/resetpassword.component';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { AvatarModule } from 'ngx-avatars';

export function AppConfigLoader(configurationService: ConfigurationService) {
  return () => {
    if (!environment.mobile && typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin === 'https://chasma-novo-dev.azurewebsites.net') {
        environment.configuration.chasmaNOVOAPI =
          'https://chasma-novo-api-dev.azurewebsites.net';
        environment.configuration.oidcSettings.authority =
          'https://chasma-novo-api-dev.azurewebsites.net';
        environment.configuration.oidcSettings.redirect_uri =
          'https://chasma-novo-dev.azurewebsites.net/signin-callback';
        environment.configuration.oidcSettings.post_logout_redirect_uri =
          'https://chasma-novo-dev.azurewebsites.net/signin-callback';
        environment.configuration.oidcSettings.silent_redirect_uri =
          'https://chasma-novo-dev.azurewebsites.net/assets/oidc/silent-renew.html';
      } else if (origin === 'https://chasma-novo-prod.azurewebsites.net') {
        environment.configuration.chasmaNOVOAPI =
          'https://chasma-novo-api-prod.azurewebsites.net';
        environment.configuration.oidcSettings.authority =
          'https://chasma-novo-api-prod.azurewebsites.net';
        environment.configuration.oidcSettings.redirect_uri =
          'https://chasma-novo-prod.azurewebsites.net/signin-callback';
        environment.configuration.oidcSettings.post_logout_redirect_uri =
          'https://chasma-novo-prod.azurewebsites.net/signin-callback';
        environment.configuration.oidcSettings.silent_redirect_uri =
          'https://chasma-novo-prod.azurewebsites.net/assets/oidc/silent-renew.html';
      }
    }
  };
}

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    LoaderComponent,
    SideNavComponent,
    UserImportDocumentComponent,
    OrganizationInterestImportComponent,
    OrganizationSkillImportComponent,
    UnauthorizedComponent,
    SignupComponent,
    ForgotpasswordComponent,
    ResetpasswordComponent,
    ResumeTemplateComponent,
    ViewBadgeComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OAuthModule.forRoot(),
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatExpansionModule,
    MatCardModule,
    // AdminModule,
    ToastrModule.forRoot({
      // Toastr configuration
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    ReactiveFormsModule,
    MatStepperModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatError,
    BaseChartDirective,
    MatRadioModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    TreeModule,
    SkeletonModule,
    MatToolbarModule,
    // SharedModule,
    CarouselModule,
    TagModule,
    PaginatorModule,
    InputTextModule,
    // DropdownModule,
    HomepageModule,
    InfiniteScrollDirective,
    AvatarModule,
  ],
  providers: [
    provideClientHydration(),
    // provideOAuthClient(),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    // provideHttpClient(withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    // {
    //     provide: RouteReuseStrategy,
    //     useClass: IonicRouteStrategy,
    // },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [],
      useFactory: AppConfigLoader,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpNetworkStateInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
