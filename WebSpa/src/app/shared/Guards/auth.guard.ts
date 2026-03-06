import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export const authGuard: CanActivateFn = (route, state) => {

  var oauthService = inject(OAuthService);
  oauthService.events.subscribe({
    next: (event) => {
      if (event.type == "discovery_document_loaded") {
        return true;
      }
      return false;
    }
  })
  return true;
};
