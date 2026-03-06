import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        let url: string = state.url;
        return this.checkLogin(url,next);
    }

    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.canActivate(route, state);
    }

    // private checkLogin(url: string): Promise<boolean> {
    //     return new Promise<boolean>((resolve) => {
    //         let loginUser = this.authService.isLoggedIn();
    //         if (loginUser) {
    //             resolve(true);
    //         } else {
    //             this.authService.login();
    //             resolve(false);
    //         }
    //     });
    // }

     private checkLogin(url: string,route:ActivatedRouteSnapshot): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            let loginUser = this.authService.isLoggedIn();
            const user = this.authService.getCurrentUser?.();
      if (!loginUser || !user) {
        this.authService.login(); 
        resolve(false);
        return;
      }
      const orgFromUrl = route?.paramMap.get('organisationUniqueName');
      const roleFromUrl = route?.paramMap.get('role');
      const allowedRoles:string[]= route.data['allowedRoles'] || [];

      if(allowedRoles.length>0 )
        {
        const userrole=user?.roleName?.toLowerCase() || '';
        const checkrole=allowedRoles.map(r=>r.toLowerCase());
        if(!checkrole.includes(userrole)){
          this.router.navigate(['/unauthorized']);
          resolve(false);
          return;
        }
      }
      if (
        orgFromUrl &&
        user.organizationName &&
        orgFromUrl.toLowerCase() !== user.organizationName.toLowerCase()
      ) {
        this.router.navigate(['/unauthorized']);
        resolve(false);
        return;
      }
      if (
        roleFromUrl &&
        user.roleName &&
        roleFromUrl.toLowerCase() !== user.roleName.toLowerCase()
      ) {
        this.router.navigate(['/unauthorized']);
        resolve(false);
        return;
      }
      resolve(true);
    });
  }

}
