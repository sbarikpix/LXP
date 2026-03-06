import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { ApplicationUser } from '../models/commonmodel';

export const adminGuard: CanActivateFn = (route, state) => {

  let oAuthService = inject(OAuthService);
  let router = inject(Router);
  if (typeof localStorage !== 'undefined' ) {
    if (localStorage.getItem('emulatedUser') !== null) {
      var loggedInUser: ApplicationUser = JSON.parse(localStorage.getItem('emulatedUser')!);
      if (loggedInUser.roleName == "GlobalAdmin" || loggedInUser.roleName == "Admin" || loggedInUser.roleName == "Manager")
        return true;
    }
    else if(localStorage.getItem('loggedInUser') !== null) {
      var loggedInUser: ApplicationUser = JSON.parse(localStorage.getItem('loggedInUser')!);
      if (loggedInUser.roleName == "GlobalAdmin" || loggedInUser.roleName == "Admin" || loggedInUser.roleName == "Manager")
        return true;
    }
  }
  router.navigate(['unauthorized'])

  return false;
};
