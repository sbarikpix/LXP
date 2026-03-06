import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-organization-job',
  templateUrl: './organization-job.component.html',
  styleUrls: ['./organization-job.component.scss']
})
export class OrganizationJobComponent implements OnInit {

  tabName: string = '';
  tabAction: string = '';
  mainName: string = '';
  activatedTab: number = 0;
  loggedInUser!: ApplicationUser;
  organizationId: string = '';

  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;


  constructor(
    private router: Router,
    private title: Title,
    private route: ActivatedRoute
  ) { this.title.setTitle('Data'); }

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
    this.tabAction = this.route.snapshot.paramMap.get('tab-action')!;
    this.organizationId = this.route.snapshot.paramMap.get('organizationId')!;
    this.setActiveTab();
  }

  setActiveTab(): void {
    switch (this.tabName || this.tabAction) {
      case 'interests':
        this.activatedTab = 0;
        break;
      case 'skills':
        this.activatedTab = 1;
        break;
      case 'job-titles':
        this.activatedTab = 2;
        break;
      case 'teams':
        this.activatedTab = 3;
        break;
      default:
        this.activatedTab = 0;
        break;
    }
  }

  onTabChange(event: any): void {
    this.activatedTab = event.index;
    const tabAction = event.tab.textLabel.toLowerCase();
    if (this.organizationId != null) {
      this.router.navigate([`${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${this.organizationId}/${this.tabName}/properties/${tabAction}`])
    }
    else {
      this.router.navigate([this.loggedInUser.organizationName, this.loggedInUser.roleName, 'properties', tabAction]);
    }
    // this.router.navigate([`${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant/${this.organizationId}/${this.mainName}/properties/${tabAction}`]);
    // this.router.navigate([`properties/${tabAction}`], { relativeTo: this.route.parent })
  }
}
