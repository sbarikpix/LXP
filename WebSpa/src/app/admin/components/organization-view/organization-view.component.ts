import { Component, OnInit } from '@angular/core';
import { OrganizationService } from '../../../shared/services/organization.service';
import {
  ApplicationUser,
  Organization,
} from '../../../shared/models/commonmodel';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-organization-view',
  templateUrl: './organization-view.component.html',
  styleUrl: './organization-view.component.scss',
})
export class OrganizationViewComponent implements OnInit {
  organization?: Organization;
  isLoading: boolean = false;
  loggedInUser!: ApplicationUser;
  orgId: string = '';
  isMobile: boolean = false;

  constructor(
    private orgService: OrganizationService,
    private route: ActivatedRoute,
    private title: Title,
    private router: Router,
    private location: Location,
    private toastr: ToastrService,
    private platform: Platform
  ) {
    this.title.setTitle('Overview');
  }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (storedUser) {
      this.loggedInUser = JSON.parse(storedUser);
    }
    this.orgId = this.route.snapshot.paramMap.get('id')!;
    if (this.orgId === undefined || this.orgId === null) {
      this.orgId = this.route.snapshot.paramMap.get('organizationId')!;
    }
    if (this.orgId) {
      this.isLoading = true;
      this.orgService
        .getOrganization(this.orgId, this.loggedInUser.applicationUserId)
        .subscribe({
          next: (res) => {
            this.organization = res[0];
            if (this.organization.imagePath) {
              this.organization.imagePath += '?t=' + new Date().getTime(); // Cache busting
            }
            this.isLoading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          },
        });
    }
    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  back() {
    this.router.navigate([
      `${this.loggedInUser.organizationName}/${this.loggedInUser.roleName}/tenant`,
    ]);
  }
}
