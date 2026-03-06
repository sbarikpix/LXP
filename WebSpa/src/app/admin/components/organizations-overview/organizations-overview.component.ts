import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationUser } from '@app/shared/models/commonmodel';

@Component({
  selector: 'app-organizations-overview',
  templateUrl: './organizations-overview.component.html',
  styleUrl: './organizations-overview.component.scss'
})
export class OrganizationsOverviewComponent implements OnInit {

  isLoading: boolean = false;
  loggedInUser!: ApplicationUser;
  tabName: string = '';
  activatedTab: any = 0;
  organizationId: string = '';
  subtabName: string = 'interests';
  activatedSubTab: number = 0;

  constructor(private route: ActivatedRoute, private title: Title, private router: Router,) {
    this.title.setTitle('Data');
  }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData)
    }
    else if (storedUser) {
      this.loggedInUser = JSON.parse(storedUser);
    }
    this.tabName = this.route.snapshot.paramMap.get('tab') || '';
    this.organizationId = this.route.snapshot.paramMap.get('organizationId') || '';
    this.activatedTab = this.route.snapshot.paramMap.get('activatedTab');
    this.subtabName = this.route.snapshot.paramMap.get('subtab')!;
    (this.subtabName === 'interests') ? this.activatedSubTab = 0 :
      (this.subtabName === 'skills') ? this.activatedSubTab = 1 :
        (this.subtabName === 'job-titles') ? this.activatedSubTab = 2 : this.activatedSubTab = 3;
    this.setActiveTab();
  }

  setActiveTab(): void {
    switch (this.tabName) {
      case 'overview':
        this.activatedTab = 0;
        break;
      case 'users':
        this.activatedTab = 1;
        break;
      case 'data':
        this.activatedTab = 2;
        break;
      default:
        this.activatedTab = 0;
        break;
    }
  }

  onTabChange(event: any): void {
    this.activatedTab = event.index;
    this.tabName = event.tab.textLabel.toLowerCase();
    if (this.activatedTab === 2) {
      this.subtabName = 'interests';
      this.router.navigate([`${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${this.organizationId}/${this.tabName}/properties/${this.subtabName}/${this.activatedTab}`])
    }
    else {
      this.router.navigate([`${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${this.organizationId}/${this.tabName}`]);
    }
  }

  onsubTabChange(event: any): void {
    this.subtabName = event.tab.textLabel.toLowerCase();
    this.activatedSubTab = event.index;
    this.router.navigate([`${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${this.organizationId}/${this.tabName}/properties/${this.subtabName}/${this.activatedTab}`])
  }
}
