import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  of,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { LoginService } from './login.service';
import { DataStorageService } from './data-storage.service';
import { ConfigurationService } from './configurations.service';
import { AppConstants } from '../App-Constants';
import { UserManagerSettings } from 'oidc-client';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';
import { ContentObserver } from '@angular/cdk/observers';
import { json } from 'stream/consumers';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userEmail: any;
  firstName: any;
  lastName: any;

  private authStateChangesSubject = new Subject();
  public authStateChanges = this.authStateChangesSubject.asObservable();

  // Check every 1 minute (for better precision)
  private tokenCheckInterval = 1 * 60 * 1000;
  // Refresh if token expires in ≤5 minutes
  private tokenExpiryBuffer = 5 * 60;

  private logoutSubject = new Subject<void>();
  public logout$ = this.logoutSubject.asObservable();

  private tokenCheckSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private loginService: LoginService,
    private configurationService: ConfigurationService,
    private router: Router,
    private dataStorageService: DataStorageService
  ) {
    const settings: UserManagerSettings = {
      ...configurationService.configuration.oidcSettings,
    };

    if (isPlatformBrowser(this.platformId)) {
      this.startTokenAutoRefresh();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTokenAutoRefresh();
  }

  // private startTokenCheckInterval() {
  //   this.checkAndRenewToken();
  //   timer(this.tokenCheckInterval, this.tokenCheckInterval).subscribe(() => {
  //     this.checkAndRenewToken();
  //   });
  // }

  private startTokenAutoRefresh() {
    this.stopTokenAutoRefresh(); // Clear previous timer

    // Initial check
    this.checkAndRenewToken().pipe(takeUntil(this.destroy$)).subscribe();

    // Periodic checks
    this.tokenCheckSubscription = timer(
      this.tokenCheckInterval,
      this.tokenCheckInterval
    )
      .pipe(
        switchMap(() => this.checkAndRenewToken()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private stopTokenAutoRefresh() {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
      this.tokenCheckSubscription = null;
    }
  }

  private checkAndRenewToken() {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    try {
      const decodedToken = jwtDecode(token) as { exp: number };
      const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000);

      if (expiresIn <= this.tokenExpiryBuffer) {
        return this.refreshToken().pipe(
          catchError((err) => {
            console.error('[Auth] Refresh failed:', err);
            this.logout(); // Force logout if refresh fails
            return of(false);
          })
        );
      } else {
        return of(true);
      }
    } catch (error) {
      console.error('[Auth] Invalid token:', error);
      this.logout();
      return of(false);
    }
  }

  private refreshToken() {
    return this.loginService.refreshToken().pipe(
      switchMap((token) => {
        const newToken = token['apiKey'];
        this.dataStorageService.set(
          AppConstants.LocalStorage.APIToken,
          newToken
        );
        // this.authStateChangesSubject.next(); // Notify subscribers
        return of(true);
      }),
      catchError((err) => {
        console.error('[Auth] Token refresh failed:', err);
        this.logout();
        return of(false);
      })
    );
  }

  // refreshToken() {
  //   this.loginService.refreshToken().subscribe({
  //     next: (token: { [x: string]: any; }) => {
  //       const newToken = token['apiKey'];
  //       this.dataStorageService.set(AppConstants.LocalStorage.APIToken, newToken);
  //     },
  //     error: (err) => {
  //       console.error('Error refreshing token:', err);
  //     }
  //   });
  // }

  sendToken(token: string) {
    this.dataStorageService.set(AppConstants.LocalStorage.APIToken, token);
  }

  getToken(): any {
    return this.dataStorageService.get(AppConstants.LocalStorage.APIToken);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.dataStorageService.remove(AppConstants.LocalStorage.APIToken);
    this.dataStorageService.remove(AppConstants.LocalStorage.UserId);
    this.dataStorageService.remove(AppConstants.LocalStorage.UserName);
    this.dataStorageService.remove(AppConstants.LocalStorage.IsLoggedIn);
    this.dataStorageService.remove(AppConstants.LocalStorage.Email);
    this.dataStorageService.remove(
      AppConstants.LocalStorage.HorseSubscriptionIsCancelled
    );
    this.dataStorageService.remove(
      AppConstants.LocalStorage.NotificationDismissed
    );
    this.dataStorageService.remove(AppConstants.LocalStorage.ProfileImage);
    this.dataStorageService.remove(AppConstants.LocalStorage.roleName);

    // Clear localStorage items
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('emulatedUser');
    }

    // Notify components about logout
    this.logoutSubject.next();

    this.router.navigate(['/']).then(() => {
      if (isPlatformBrowser(this.platformId)) {
        window.location.reload();
      }
    });
  }

  getCurrentUser() {
    if(localStorage.getItem('emulatedUser') !== null)
    return JSON.parse(localStorage.getItem('emulatedUser')!)
  else if(localStorage.getItem('loggedInUser') !== null)
    return JSON.parse(localStorage.getItem('loggedInUser')!); 
  }

  login() {
    this.router.navigate(['/login']);
  }
}
