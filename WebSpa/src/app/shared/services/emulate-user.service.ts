import { Injectable } from '@angular/core';
import {
  ApplicationUser,
  Organization,
  SelectedSkills,
} from '../models/commonmodel';
import { BehaviorSubject, Subject } from 'rxjs';
import { NavigationStart, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class EmulateUserService {
  private skillData!: SelectedSkills;
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private toastr: ToastrService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && !this.isEmulationActive()) {
        this.previousUrl = event.url;
      }
    });

    const emulatedUserData = this.getEmulatedUser();
    if (emulatedUserData) {
      this.emulatedUserSubject.next(emulatedUserData);
      // this.showEmulationNotification();
    }
  }
  private emulatedUserSubject = new BehaviorSubject<ApplicationUser | boolean>(
    false
  );
  emulatedUser$ = this.emulatedUserSubject.asObservable();
  private previousUrl: string = '';
  private snackBarRef: MatSnackBarRef<any> | null = null;
  public emulationChanged$ = new Subject<void>();

  emulateUser(user: ApplicationUser) {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (this.previousUrl) {
        localStorage.setItem('emulatedUser', JSON.stringify(user));
        localStorage.setItem('previousUrl', this.previousUrl);
      }
    }
    this.emulatedUserSubject.next(user);
    this.emulationChanged$.next();
  }
  stopEmulation() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('emulatedUser');
      const previousUrl = localStorage.getItem('previousUrl');
      if (previousUrl) {
        localStorage.removeItem('previousUrl');
        this.router.navigateByUrl(previousUrl);
        this.toastr.info('Exited emulation Mode');
      }
    }
    this.emulatedUserSubject.next(false);
    this.emulationChanged$.next();
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  getEmulatedUser(): ApplicationUser | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const emulatedUserData = localStorage.getItem('emulatedUser');
      // if (emulatedUserData) {
      //   this.showEmulationNotification();
      // }
      return emulatedUserData ? JSON.parse(emulatedUserData) : null;
    }
    return null;
  }

  isEmulationActive(): boolean {
    return !!this.getEmulatedUser();
  }

  //This is to pass the ArrayData from Assessment component to Exam
  setSkills(data: any): void {
    this.skillData = data;
  }

  getSkills(): any {
    return this.skillData;
  }
  // showEmulationNotification() {
  //   if (this.snackBarRef) {
  //     return;
  //   }
  //   this.snackBarRef = this.snackBar.open(
  //     'You are in Emulation Mode',
  //     'Exit Emulation',
  //     {
  //       duration: 0,
  //       horizontalPosition: 'center',
  //       verticalPosition: 'top',
  //       panelClass: ['emulation-snackbar'],
  //     }
  //   );
  //   this.snackBarRef.onAction().subscribe(() => {
  //     this.stopEmulation();
  //   });
  // }

  emulateOrganization(org: Organization) {
    const loggedInUserData = localStorage.getItem('loggedInUser');
    if (loggedInUserData) {
      const emulatedUser: ApplicationUser = {
        ...(loggedInUserData ? JSON.parse(loggedInUserData) : {}),
        organizationId: org.organizationId,
        organizationName: org.name,
        roleName: 'GlobalAdmin', // Assuming emulating as globalAdmin
      };
      if (emulatedUser) {
        this.emulateUser(emulatedUser);
        // this.showEmulationNotification();
        this.router.navigate([
          emulatedUser.organizationName,
          emulatedUser.roleName,
          'home',
        ]);
      }
    } else {
      this.toastr.error('No emulated user found to change organization.');
    }
  }
}
