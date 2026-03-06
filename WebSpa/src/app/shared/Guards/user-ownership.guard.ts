import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { get } from 'lodash';
import { map } from 'rxjs';

export const userOwnershipGuard: CanActivateFn = (route:ActivatedRouteSnapshot, state:RouterStateSnapshot) => {
  const router = inject(Router);
  const authService=inject(AuthService);
  const userIdFromRoute = route.paramMap.get('id');
  const orgId=route.paramMap.get('organizationId');
  const orgUniqueName=route.paramMap.get('organisationUniqueName');
  const roleFromUrl=route.paramMap.get('role');
  const currentUser= authService.getCurrentUser?.();
  const userService = inject(UserService);

  
  return userService
  .getOrganizationUsers(userIdFromRoute || '', currentUser?.applicationUserId || '', orgId || '')
  .pipe(
    map((res: any) => {
      if (res && res.length > 0) {
        const getuser = res[0]; 
        if(currentUser?.roleName==='Admin'  ){
        if(currentUser?.organizationId !== getuser.organizationId || orgUniqueName!==currentUser.organizationName){
          return router.parseUrl('/unauthorized');
        }
      }
        if (currentUser.roleName === 'Manager') {
          if (getuser.managerId !== currentUser.applicationUserId || orgUniqueName!==currentUser.organizationName || currentUser?.organizationId !== getuser.organizationId) {
            return router.parseUrl('/unauthorized');
          }
        }
        if (currentUser.roleName === 'Learner') {
          if (getuser.applicationUserId !== currentUser.applicationUserId) {
            return router.parseUrl('/unauthorized');
          }
        }
      };
      return true;
    })
  );
 
};
