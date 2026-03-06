import { Component, OnInit } from '@angular/core';
import { ApplicationUser } from '../../models/commonmodel';
import { Router } from '@angular/router';
import { AppConstants } from '@app/shared/App-Constants';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent implements OnInit{

  loggedInUser!: ApplicationUser;

  constructor(
    private router: Router
  ){}

  ngOnInit(): void {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if(emulateuserData){
      this.loggedInUser = JSON.parse(emulateuserData)
    }
    else if (userData) {
      this.loggedInUser = JSON.parse(userData);
    }
  }

  navigateToHome() {
    if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager || this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin) {
      this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'users']);
    }
    else if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin) {
      this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'tenant']);
    }
    else {
      this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'users', this.loggedInUser.organizationId, this.loggedInUser.applicationUserId, 'overview']);
    }
  }

}
