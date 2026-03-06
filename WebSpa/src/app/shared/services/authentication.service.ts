import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
// import { OAuthConfig } from './OAuth.Config';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  // userId: string = '';

  // constructor(private oauthService: OAuthService) {
  //   this.configureSingleSignOn();
  // }

  // configureSingleSignOn() {
  //   this.oauthService.configure(OAuthConfig);
  //   this.oauthService.setupAutomaticSilentRefresh();
  //   this.oauthService.tokenValidationHandler = new JwksValidationHandler();
  //   this.oauthService.loadDiscoveryDocumentAndTryLogin();
  // }

  // login() {
  //   this.oauthService.initCodeFlow();
  // }

  // logout() {
  //   localStorage.clear();
  //   this.oauthService.logOut();
  // }

  // isLoggedIn(): boolean {
  //   return this.oauthService.hasValidAccessToken();
  // }

  // get token() {
  //   let claims: any = this.oauthService.getIdentityClaims();
  //   this.userId = claims['sub'];
  //   return claims ? claims : null;
  // }
  // getLoggedInUserId(): string {
  //   let claims: any = this.oauthService.getIdentityClaims();
  //   return claims ? claims.sub : ''; // Return sub (userId) if available, otherwise empty string
  // }

}
