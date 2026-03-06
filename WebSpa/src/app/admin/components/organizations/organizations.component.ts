import {
  AfterViewChecked,
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { OrganizationService } from '../../../shared/services/organization.service';
import {
  GetallOrgsquery,
  Organization,
} from '../../../shared/models/commonmodel';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import Swal from 'sweetalert2';
import { LazyLoadEvent } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Route, Routes } from '@angular/router';
import { get } from 'http';
import { Title } from '@angular/platform-browser';
import { Platform } from '@angular/cdk/platform';
import { AppConstants } from '@app/shared/App-Constants';
import { EmulateUserService } from '@app/shared/services/emulate-user.service';
@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrl: './organizations.component.scss',
})
export class OrganizationsComponent implements OnInit, AfterViewInit {
  orgList: Organization[] = [];
  dataSource: Organization[] = [];
  selectedTab: string = 'total';
  activeOrgs: number = 0;
  inActiveOrgs: number = 0;
  isLoading: boolean = false;
  loading: boolean = false;
  activerecords: number = 0;
  Inactiveorgs: number = 0;
  totalRecords: number = 0;
  totalOrgs: number = 0;
  loggedInUser!: ApplicationUser;
  organizationId: string = '';
  orgId: string = '';
  isMobile: boolean = false;
  filteredOrgs: Organization[] = [];
  constructor(
    private orgService: OrganizationService,
    private title: Title,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private platfrom: Platform,
    private emulationService: EmulateUserService
  ) {
    this.title.setTitle('Organizations');
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');

    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (userData) {
      this.loggedInUser = JSON.parse(userData);
    }
    this.organizationId = this.route.snapshot.paramMap.get('organizationId')!;
    this.isMobile = this.platfrom.ANDROID || this.platfrom.IOS;
  }

  ngAfterViewInit() {
    this.loading = false;
    this.activeTab(this.selectedTab);
  }

  activeTab(text: string) {
    this.selectedTab = text;
    this.loadOrganizations(undefined, this.selectedTab);
    const tabs = document.querySelectorAll('.status');

    tabs.forEach((tab) => {
      (tab as HTMLElement).style.backgroundColor = 'white';
      (tab as HTMLElement).style.color = '#000';
    });

    const selectedTab = document.querySelector(`.${text}`);

    if (selectedTab) {
      (selectedTab as HTMLElement).style.backgroundColor = '#474C60';
      (selectedTab as HTMLElement).style.color = '#fff';
    }
  }

  changeOrgActiveStatus(orgData: Organization) {
    if (this.loggedInUser.organizationId === orgData.organizationId) {
      this.toastr.error('Logged In Organization cannot be In-Activated !');
    } else {
      const alertMsg: string =
        'The Organization Will be ' +
        (orgData.isActive ? 'Inactive' : 'Active');
      Swal.fire({
        title: 'Are you sure?',
        text: alertMsg,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!',
        width: '400px',
        padding: '1rem',
      }).then((result) => {
        if (result.isConfirmed) {
          orgData.isActive = !orgData.isActive;
          orgData.updatedby = this.loggedInUser.applicationUserId;
          this.isLoading = true;
          this.orgService.updateOrganization(orgData).subscribe({
            next: (res) => {
              // this.getallorgs(this.selectedTab);
              this.loadOrganizations(undefined, this.selectedTab);
              this.isLoading = false;
              const status = orgData.isActive ? 'activated' : 'inactivated';
              this.toastr.success(`Organization ${status} successfully.`);
            },
            error: (err: HttpErrorResponse) => {
              this.isLoading = false;
              this.toastr.error('An unexpected error occurred.');
            },
          });
        }
      });
    }
  }

  loadOrganizations(event?: TableLazyLoadEvent, tab?: string) {
    setTimeout(() => {
      this.loading = true;
    });
    const page = event ? event.first! / event.rows! : 0;
    const size = event ? event.rows! : 10;
    const filters = event ? event.filters || {} : {};
    const sortField = event ? event.sortField : null;
    const sortOrder = event ? (event.sortOrder === 1 ? 'asc' : 'desc') : 'asc';

    let query: GetallOrgsquery = {
      page: page ? page : 0,
      pagesize: size,
      filters: filters,
      sortField: sortField,
      sortOrder: sortOrder,
      loggedInUserId: this.loggedInUser.applicationUserId,
    };
    if (this.organizationId) {
      query.organizationId = this.organizationId;
    }

    if (tab) {
      query.tab = tab;
    } else {
      query.tab = this.selectedTab;
    }
    this.orgService.getAllOrganizations(query).subscribe({
      next: (res) => {
        this.dataSource = res.organizations;
        this.filteredOrgs = this.dataSource;
        this.dataSource.forEach((x) => {
          if (x.imagePath) {
            x.imagePath += '?t=' + new Date().getTime(); // Cache busting
          }
        });
        this.totalOrgs = res.total;
        this.activerecords = res.totalActive;
        this.Inactiveorgs = res.totalInactive;
        this.loading = false;
        if (this.dataSource.length < size && page === 0) {
          this.totalRecords = this.dataSource.length;
        } else {
          this.totalRecords = res.total;
        }
      },
    });

    const tabs = document.querySelectorAll('.status');
    tabs.forEach((tab) => {
      (tab as HTMLElement).style.backgroundColor = 'white';
      (tab as HTMLElement).style.color = '#000';
    });

    const selectedTab = document.querySelector(`.${query.tab}`);

    if (selectedTab) {
      (selectedTab as HTMLElement).style.backgroundColor = '#474C60';
      (selectedTab as HTMLElement).style.color = '#fff';
    }
  }
  orgsFilter(event: any) {
    const value = event.target.value.toLowerCase();
    if (value) {
      this.filteredOrgs = this.dataSource.filter((org) =>
        org.name.toLowerCase().includes(value)
      );
      this.totalOrgs = this.filteredOrgs.length;
      this.activerecords = this.filteredOrgs.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveorgs = this.filteredOrgs.filter(
        (user) => !user.isActive
      ).length;
    } else {
      this.filteredOrgs = this.dataSource;
      this.totalOrgs = this.filteredOrgs.length;
      this.activerecords = this.filteredOrgs.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveorgs = this.filteredOrgs.filter(
        (user) => !user.isActive
      ).length;
    }
  }
  emulateOrganization(org: Organization) {
    // Check if user is global admin (adjust this check as per your model)
    if (this.loggedInUser.roleName === 'GlobalAdmin') {
      this.emulationService.emulateOrganization(org);
      this.toastr.success(
        `You are now emulating the organization: ${org.name}`
      );
    } else {
      this.toastr.error('Only Global Admin can emulate organizations.');
      return;
    }
  }
}
