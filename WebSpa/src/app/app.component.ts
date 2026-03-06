import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ApplicationUser } from './shared/models/commonmodel';
import { UserService } from './shared/services/user.service';
import { AppConstants } from './shared/App-Constants';
import { DataStorageService } from './shared/services/data-storage.service';
import { AuthService } from './shared/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { LoginService } from './shared/services/login.service';
import { Subscription } from 'rxjs';
import { Platform } from '@angular/cdk/platform';
import { App, App as CapacitorApp } from '@capacitor/app';
import { Location } from '@angular/common';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { EmulateUserService } from './shared/services/emulate-user.service';
import { ExamServicesService } from './shared/services/assessment-services.service';
import { UserContentService } from './shared/services/usercontent.service';
import { LearningjourneyService } from './shared/services/learningjourney.service';
import { SafeArea } from 'capacitor-plugin-safe-area';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  pageTitle: string = '';
  title = 'NOVO';
  isLoggedIn: boolean = false;
  isSideNavCollapsed: boolean = true;
  isHomeRoute: boolean = false;
  getMainmenu: boolean = false;
  getpublicprofile: boolean = false;
  isEmailVerified: boolean = false;
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  image: any;
  @ViewChild('sideNav') sideNav!: ElementRef;
  userData: any;
  userId: any;
  isloginpage: boolean = false;

  isAuthPage: boolean = false;
  currentAuthPage: string = '';
  private routerSubscription: Subscription = new Subscription();
  private subscriptions: Subscription = new Subscription();
  isMobile: boolean = false;
  isEmulating: boolean = false;
  idleTime: number = 0;
  organizationName: string = '';
  emulatedUser: ApplicationUser | null = null;
  sourceUser: ApplicationUser | null = null;
  count: number = 0;
  keyBoardActive: boolean = false;

  constructor(
    private router: Router,
    private elRef: ElementRef,
    private userService: UserService,
    private authservice: AuthService,
    private dataStorageService: DataStorageService,
    private loginService: LoginService,
    private location: Location,
    private platform: Platform,
    private emulateUserService: EmulateUserService,
    private assessmentservice: ExamServicesService,
    private contentservice: UserContentService,
    private journeyservice: LearningjourneyService,

    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Subscribe to login state changes
    this.subscriptions.add(
      this.loginService.loginChanged$.subscribe(() => {
        this.handleLoginStateChange();
      })
    );

    // Subscribe to logout events
    this.subscriptions.add(
      this.authservice.logout$.subscribe(() => {
        this.handleLogout();
      })
    );
  }
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.checkScreenSize(window.innerWidth);

    try {
      this.initializeApp();
      if (isPlatformBrowser(this.platformId)) {
        document.addEventListener(
          'click',
          this.handleClickOutside.bind(this),
          true
        );
      }
    } catch (error) {
      this.handleInitializationError();
    }

    this.subscriptions.add(
      this.emulateUserService.emulationChanged$.subscribe(() => {
        this.initializeApp();
      })
    );

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateAuthPageState(event.urlAfterRedirects || event.url);
      }
    });

    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }

    if (!this.isMobile) {
      // Desktop idle logout logic
      setInterval(() => {
        this.idleTime = this.idleTime + 1;
        if (this.idleTime > 30) {
          this.authservice.logout();
        }
      }, 60000);

      onmousemove = (event: MouseEvent) => {
        this.idleTime = 0;
      };

      window.addEventListener('storage', function (event) {
        if (event.key == 'logout-event') {
          this.localStorage.clear();
          this.sessionStorage.clear();
          window.location.reload();
        }
      });
    }

    if (this.isMobile) {
      this.initializeBackButtonCustomHandler();
      this.setupMobileSafeArea();
      // this.setupKeyboardHandlers();
    }
    Keyboard.addListener('keyboardWillShow', () => {
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        `0px`
      );
    });
    Keyboard.addListener('keyboardWillHide', () => {
      this.setupMobileSafeArea();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener(
        'click',
        this.handleClickOutside.bind(this),
        true
      );
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateAuthPageState(url: string): void {
    // Handle empty route or root path
    if (url === '/' || url === '') {
      this.isAuthPage = true;
      this.currentAuthPage = 'login';
      // this.isloginpage = true; // maintain backward compatibility
      return;
    }

    // Handle other auth pages
    this.isAuthPage = [
      '/login',
      '/signup',
      '/forgotpassword',
      '/resetpassword',
      '/resume',
      '/view-badge',
    ].some((path) => url.includes(path));
    this.isloginpage = url.includes('/login');
    if (url.includes('/login')) {
      this.currentAuthPage = 'login';
    } else if (url.includes('/signup')) {
      this.currentAuthPage = 'signup';
    } else if (url.includes('/forgotpassword')) {
      this.currentAuthPage = 'forgotpassword';
    } else if (url.includes('/resetpassword')) {
      this.currentAuthPage = 'resetpassword';
    } else if (url.includes('/resume')) {
      this.currentAuthPage = 'resume';
    } else if (url.includes('/view-badge')) {
      this.currentAuthPage = 'view-badge';
    } else {
      this.currentAuthPage = '';
    }
  }

  handleLogout(): void {
    // Reset all component state to show login page
    this.isLoggedIn = false;
    this.isloginpage = true;
    this.isLoading = true;
    this.getMainmenu = false;
    this.loggedInUser = null as any;
    this.userId = null;
  }

  initializeApp(): void {
    this.userId = this.dataStorageService.get(AppConstants.LocalStorage.UserId);

    const emulatedUser = this.getFromLocalStorage('emulatedUser');
    const storedUser = this.getFromLocalStorage('loggedInUser');
    if (storedUser) {
      this.sourceUser = JSON.parse(storedUser);
    }
    if (emulatedUser) {
      this.loggedInUser = JSON.parse(emulatedUser);
      this.emulatedUser = this.loggedInUser;
      this.setLoggedInState();
      this.isEmulating = true;
      this.organizationName = this.loggedInUser.organizationName;
    } else if (storedUser && storedUser !== 'undefined') {
      this.loggedInUser = JSON.parse(storedUser);
      this.setLoggedInState();
      this.checkEmailVerification();
      this.isEmulating = false;
      this.organizationName = this.loggedInUser.organizationName;
    } else if (this.userId && this.authservice.isLoggedIn()) {
      // User has token but no stored user data, fetch it
      this.getLoggedInUser(this.userId);
    } else {
      // No user data, show login page
      this.showLoginPage();
    }
    this.getNotificationCount(this.loggedInUser.applicationUserId);
  }

  handleLoginStateChange(): void {
    // This will be called after successful login
    const userId = this.dataStorageService.get(
      AppConstants.LocalStorage.UserId
    );
    if (userId) {
      this.getLoggedInUser(userId);
    } else {
    }
  }

  setLoggedInState(): void {
    setTimeout(() => {
      this.isLoggedIn = true;
      this.isLoading = true;
      this.isloginpage = false;
    });
  }

  checkEmailVerification(): void {
    if (this.loggedInUser && !this.loggedInUser.isEmailVerified) {
      this.getMainmenu = true;
    } else {
      this.getMainmenu = false;
    }
  }

  showLoginPage(): void {
    setTimeout(() => {
      this.isloginpage = true;
      this.isLoggedIn = false;
      this.isLoading = true;
      this.getMainmenu = false;
    });
  }

  handleInitializationError(): void {
    this.showLoginPage();
  }

  getFromLocalStorage(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  checkScreenSize(screenWidth: number): void {
    this.isSideNavCollapsed = screenWidth >= 1000;
  }

  navigateToHome() {
    if (this.loggedInUser?.roleName || this.loggedInUser?.organizationName) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'home',
      ]);
    }
  }

  get userFullName() {
    if (!this.loggedInUser) return '';

    return `${
      this.loggedInUser.firstName ? this.loggedInUser.firstName.charAt(0) : ''
    }${this.loggedInUser.lastName ? this.loggedInUser.lastName.charAt(0) : ''}`;
  }

  toggleSideNav(): void {
    this.isSideNavCollapsed = !this.isSideNavCollapsed;
  }

  getLoggedInUser(userId: string) {
    this.isLoading = false; // Show loader while fetching

    this.userService.getOrganizationUsers(userId, userId).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.loggedInUser = res[0];

          // Store user data in localStorage
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(
              'loggedInUser',
              JSON.stringify(this.loggedInUser)
            );
            this.organizationName = this.loggedInUser.organizationName;
          }

          // Set logged in state
          this.setLoggedInState();

          // Check email verification and set appropriate view
          this.checkEmailVerification();
        } else {
          console.error('No user data received');
          this.handleUserLoadError();
        }
      },
      error: (err) => {
        console.error('Failed to load user', err);
        this.handleUserLoadError();
      },
    });
  }

  handleUserLoadError(): void {
    // Clear potentially corrupted data and show login
    this.clearAuthData();
    this.showLoginPage();
  }

  clearAuthData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('emulatedUser');
    }
    this.dataStorageService.remove(AppConstants.LocalStorage.APIToken);
    this.dataStorageService.remove(AppConstants.LocalStorage.UserId);
    this.dataStorageService.remove(AppConstants.LocalStorage.IsLoggedIn);
  }

  getMainMenuData(event: any) {
    this.getMainmenu = event;
    if (this.loggedInUser) {
      this.loggedInUser.isEmailVerified = true;

      // Clear and update localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('loggedInUser');
        localStorage.setItem('loggedInUser', JSON.stringify(this.loggedInUser));
      }

      // Update the view state
      this.checkEmailVerification();
    }
  }

  handleClickOutside(event: MouseEvent) {
    if (!isPlatformBrowser(this.platformId)) return;

    var navBtn = this.elRef.nativeElement.querySelector('.nav-btn');
    if (window.innerWidth < 1000 && this.sideNav) {
      const clickedInside = this.sideNav.nativeElement.contains(event.target);
      const clickedOnNavBtn = navBtn?.contains(event.target as Node);

      if (!clickedInside && !clickedOnNavBtn) {
        this.isSideNavCollapsed = false;
      }
    }
  }

  initializeBackButtonCustomHandler() {
    if (this.isMobile) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const currentUrl = this.router.url;
        const homeUrl = `/${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/home`;

        if (currentUrl === homeUrl || !canGoBack || !this.isLoggedIn) {
          CapacitorApp.exitApp();
        } else {
          this.location.back();
        }
      });
    }
  }

  get emulationMessage(): string {
    if (this.isEmulating) {
      if (
        this.emulatedUser?.organizationName !==
          this.sourceUser?.organizationName &&
        this.emulatedUser?.applicationUserId ===
          this.sourceUser?.applicationUserId
      ) {
        return `You are emulating the "${this.emulatedUser?.organizationName}" organization`;
      } else if (
        this.emulatedUser?.organizationName ===
          this.sourceUser?.organizationName &&
        this.emulatedUser?.applicationUserId !==
          this.sourceUser?.applicationUserId
      ) {
        return `You are emulating the user "${this.emulatedUser?.firstName} ${this.emulatedUser?.lastName}"`;
      } else if (
        this.emulatedUser?.organizationName !==
          this.sourceUser?.organizationName &&
        this.emulatedUser?.applicationUserId !==
          this.sourceUser?.applicationUserId
      ) {
        return `You are emulating the "${this.emulatedUser?.organizationName}" organization's user "${this.emulatedUser?.firstName} ${this.emulatedUser?.lastName}"`;
      }
      return 'You are in Emulation Mode';
    }
    return '';
  }

  getNotificationCount(userId: string) {
    this.count = 0;
    // Scheduled assessments
    this.assessmentservice.getscheduledAssessments(userId).subscribe({
      next: (res: any) => {
        this.count += (res || []).filter((r: any) => !r.isCompleted).length;
      },
    });
    // Assigned content
    this.contentservice.getuserassignedContent(userId).subscribe({
      next: (res: any) => {
        this.count += (res || []).filter((x: any) => !x.isRead).length;
      },
    });
    // Learning journeys
    this.journeyservice.getalllearningjourneys('', userId).subscribe({
      next: (res: any) => {
        this.count += (res || []).filter((x: any) => !x.isRead).length;
      },
    });
  }

  stopEmulation() {
    this.emulateUserService.stopEmulation();
  }

  logout() {
    this.authservice.logout();
  }
  // keyboard: string = '';
  // private setupKeyboardHandlers() {
  //   Keyboard.addListener('keyboardWillShow', async (info: KeyboardInfo) => {
  //     this.keyBoardActive = true;
  //     document.body.classList.add('keyboard-open');
  //     this.keyboard = info.keyboardHeight.toString() || 'Keyboard opened';
  //   });

  //   Keyboard.addListener('keyboardWillHide', () => {
  //     this.keyBoardActive = false;
  //     document.body.classList.remove('keyboard-open');
  //     this.keyboard = 'keyboard closed';
  //   });
  // }

  private async setupMobileSafeArea() {
    // Configure StatusBar for proper safe area handling
    await StatusBar.setOverlaysWebView({ overlay: true });

    await StatusBar.setBackgroundColor({ color: '#000000ff' });
    await StatusBar.setStyle({ style: Style.Dark });

    SafeArea.getSafeAreaInsets().then((insets) => {
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        `${insets.insets.top}px`
      );
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        `${insets.insets.bottom}px`
      );
    });
    await StatusBar.show();
  }
}
