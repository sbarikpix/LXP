import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { ApplicationUser } from '../../models/commonmodel';
import { Router, NavigationEnd } from '@angular/router';
import { MatAccordion } from '@angular/material/expansion';
import { OrganizationService } from '../../services/organization.service';
import { AppConstants } from '../../App-Constants';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
import { filter, Subscription } from 'rxjs';
import { ExamServicesService } from '@app/shared/services/assessment-services.service';
import { UserContentService } from '@app/shared/services/usercontent.service';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { AuthService } from '@app/shared/services/auth.service';
import { LoginService } from '@app/shared/services/login.service';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent implements OnInit {
  loggedInUser!: ApplicationUser;
  panelOpenState = false;
  isVarifiedEmail = false;
  orgnisationName: string = '';
  @ViewChild(MatAccordion)
  accordion: MatAccordion = new MatAccordion();
  isEmulating: boolean = false;
  organizationId: string = '';
  @Output() toggleSideNav = new EventEmitter<boolean>();
  isCollapsed: boolean = false;
  isHovering = false;
  count: number = 0;
  isMobile: boolean = false;
  panelOpen: boolean = false;
  isLoading: boolean = false;
  private subscriptions: Subscription = new Subscription();
  constructor(
    private authservice: AuthService,
    private orgservice: OrganizationService,
    private router: Router,
    private assessmentservice: ExamServicesService,
    private contentservice: UserContentService,
    private journeyservice: LearningjourneyService,
    private loginService: LoginService,
    private emulationService: EmulateUserService,
    private platform: Platform,
    private changeDetectorRef: ChangeDetectorRef,
    private eref: ElementRef
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.changeDetectorRef.detectChanges();
      });

    // Check if the user is emulating another user
    this.isEmulating = !!localStorage.getItem('emulatedUser');
    if (this.isEmulating) {
      const data = JSON.parse(localStorage.getItem('emulatedUser')!);
      this.loggedInUser = data;
    } else {
      const userData = localStorage.getItem('loggedInUser');
      if (userData) {
        this.loggedInUser = JSON.parse(userData);
      }
    }
  }

  ngOnInit(): void {
    const emulationData = this.emulationService.emulatedUser$.subscribe({
      next: (res) => {
        this.isEmulating = !!localStorage.getItem('emulatedUser');
        if (this.isEmulating) {
          const data = JSON.parse(localStorage.getItem('emulatedUser')!);
          this.loggedInUser = res || data;
          this.isEmulating = true;
        } else {
          const userData = localStorage.getItem('loggedInUser');
          if (userData) {
            this.loggedInUser = JSON.parse(userData);
          }
          this.isEmulating = false;
        }
      },
    });
    if (
      this.loggedInUser.roleName !== AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.organizationId = this.loggedInUser.organizationId;
    }
    this.getuserorganisation(this.loggedInUser);
    this.getNotificationCount(this.loggedInUser.applicationUserId);

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
    this.subscriptions.add(
      this.emulationService.emulationChanged$.subscribe(() => {
        this.getNotificationCount(this.loggedInUser.applicationUserId);
      })
    );
  }

  logout() {
    this.isLoading = true;
    this.authservice.logout();
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/login']);
    }, 1000);
  }

  toggleSideNavs() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSideNav.emit(this.isCollapsed);
  }
  getuserorganisation(user: ApplicationUser) {
    if (user) {
      this.orgservice.getOrganization('', user.applicationUserId).subscribe({
        next: (res) => {
          if (res) {
            if (user.roleName === AppConstants.ChasmanovoRoles.Global_admin) {
              res.forEach((org) => {
                if (org.organizationId === user.organizationId) {
                  this.orgnisationName = org.name;
                }
              });
            } else {
              this.orgnisationName = res[0].name;
            }
          }
        },
        error: (err) => {},
      });
    }
  }

  closeAccordion() {
    this.accordion.closeAll();
  }
  stopEmulation() {
    this.isEmulating = false;
    this.emulationService.stopEmulation();
  }
  navigateToHome() {
    if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager ||
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin
    ) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'users',
      ]);
    } else if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'tenant',
      ]);
    } else {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'users',
        this.loggedInUser.organizationId,
        this.loggedInUser.applicationUserId,
        'overview',
      ]);
    }
  }

  getNotificationCount(userId: string) {
    this.count = 0;
    // Scheduled assessments
    this.assessmentservice.getscheduledAssessments(userId).subscribe({
      next: (res) => {
        this.count += (res || []).filter((r: any) => !r.isCompleted).length;
      },
    });
    // Assigned content
    this.contentservice.getuserassignedContent(userId).subscribe({
      next: (res) => {
        this.count += (res || []).filter((x: any) => !x.isRead).length;
      },
    });
    // Learning journeys
    this.journeyservice.getalllearningjourneys('', userId).subscribe({
      next: (res) => {
        this.count += (res || []).filter((x: any) => !x.isRead).length;
      },
    });
  }

  goToOverview() {
    this.router.navigate([
      this.loggedInUser.organizationName,
      this.loggedInUser.roleName,
      'tenant',
      this.loggedInUser.organizationId,
    ]);
  }

  isAdminOrManager(): boolean {
    return ['Admin', 'Manager', 'GlobalAdmin'].includes(
      this.loggedInUser.roleName ?? ''
    );
  }

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.panelOpen = !this.panelOpen;
  }
  @HostListener('document:click', ['$event'])
  onClickAnywhere(event: MouseEvent) {
    this.panelOpen = false;
  }
}
