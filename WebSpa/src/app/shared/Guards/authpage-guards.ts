import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { ApplicationUser } from "../models/commonmodel";

@Injectable({
    providedIn: 'root'
})
export class AuthPageGuard implements CanActivate {
    loggedInUser!: ApplicationUser;
    constructor(private authService: AuthService, private router: Router) {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('loggedInUser') !== null) {
            const userData = localStorage.getItem('loggedInUser');
            const emulateuserData = localStorage.getItem('emulatedUser');
            if (emulateuserData) {
                this.loggedInUser = JSON.parse(emulateuserData);
            } else if (userData) {
                this.loggedInUser = JSON.parse(userData);
            }
        }
    }

    canActivate(): boolean {
        if (this.authService.isLoggedIn()) {
            this.router.navigate([
                this.loggedInUser.organizationName,
                this.loggedInUser.roleName,
                'home',
            ]);
            return false;
        }
        return true;
    }
}