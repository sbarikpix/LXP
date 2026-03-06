import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '../../../shared/services/organization.service';
import {
  ApplicationUser,
  Organization,
  OrganizationType,
} from '../../../shared/models/commonmodel';
import { Location } from '@angular/common';
import { Toast, ToastrService } from 'ngx-toastr';
import { map, Observable, startWith, timeout } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ImageUploadDialogComponent } from '../image-upload-dialog/image-upload-dialog.component';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { AppConstants } from '@app/shared/App-Constants';
import { OrgTypeService } from '@app/shared/services/org-type.service';

@Component({
  selector: 'app-organization-edit',
  templateUrl: './organization-edit.component.html',
  styleUrl: './organization-edit.component.scss',
})
export class OrganizationEditComponent implements OnInit {
  isEditMode: boolean = false;
  isLoading: boolean = false;
  showIcons: boolean = false;
  organizationId: string = '';
  selectedImage: string = '';
  hoverAvatar: boolean = false;
  loggedInUser!: ApplicationUser;

  organization: Organization = {
    organizationId: '',
    name: '',
    url: '',
    email: '',
    imagePath: '',
    address1: '',
    address2: '',
    city: '',
    district: '',
    state: '',
    zip: '',
    country: '',
    phoneNumber: '',
    fax: '',
    isActive: false,
    updatedby: '',
    organizationTypeId: '',
  };

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private orgService: OrganizationService,
    private location: Location,
    private router: Router,
    private title: Title,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private orgTypeService: OrgTypeService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (typeof localStorage !== 'undefined') {
        const storedUser = localStorage.getItem('loggedInUser');
        const emulateuserData = localStorage.getItem('emulatedUser');
        if (emulateuserData) {
          this.loggedInUser = JSON.parse(emulateuserData);
        } else if (storedUser) {
          this.loggedInUser = JSON.parse(storedUser);
        }
      }
      this.getOrganizationTypes();

      if (params['organizationId']) {
        this.isEditMode = true;
        this.title.setTitle('Organization | Edit');
        this.organizationId = params['organizationId'];
      } else {
        this.isEditMode = false;
        this.title.setTitle('Organization | Add');
        this.organizationId = '';
      }
    });
  }

  organizationForm = this.formBuilder.group({
    name: ['', [Validators.required, this.customNameValidator()]],
    tenantUrl: [
      '',
      [
        Validators.required,
        Validators.pattern(
          '^(http|https)://[a-zA-Z0-9-.]+.[a-zA-Z]{2,3}(/s*)?$'
        ),
      ],
    ],
    email: [
      '',
      [Validators.required, Validators.email, this.customEmailValidator()],
    ],
    phoneNumber: ['', [Validators.pattern(/^[+]?[0-9\s-()]{10,15}$/)]],
    fax: [''],
    address1: [''],
    address2: [''],
    postalCode: [''],
    city: [''],
    district: [''],
    state: [''],
    country: [''],
    orgTypeId: ['', [Validators.required]],
  });

  orgtypelist: OrganizationType[] = [];
  OrganizationTypeName: string = '';
  filteredorgtypes: Observable<OrganizationType[]> = new Observable<
    OrganizationType[]
  >();
  orgtypefilterctrl = new FormControl();
  selectedOrganizationType?: OrganizationType;

  getOrganizationTypes() {
    this.isLoading = true;
    this.orgTypeService.getAllOrgTypes().subscribe({
      next: (orgtypes) => {
        this.orgtypelist = orgtypes;
        this.filteredorgtypes = this.orgtypefilterctrl.valueChanges.pipe(
          startWith(''),
          map((orgtype) =>
            orgtype ? this._filterOrgTypes(orgtype) : this.orgtypelist.slice()
          )
        );
        if (this.organizationId != undefined) {
          this.populateFormGroups();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  private _filterOrgTypes(value: string): OrganizationType[] {
    const filterValue = value.toLowerCase();
    return this.orgtypelist.filter((orgtype) =>
      orgtype.organizationTypeName.toLowerCase().includes(filterValue)
    );
  }

  selectOrganizationType(orgType: OrganizationType) {
    this.selectedOrganizationType = orgType;
    this.organizationForm.patchValue({
      orgTypeId: orgType.organizationTypeId,
    });
  }

  customEmailValidator() {
    return (control: { value: string }) => {
      const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
      if (control.value && !pattern.test(control.value.toLowerCase())) {
        return { patternInvalid: true };
      }
      return null;
    };
  }

  customNameValidator() {
    return (control: { value: string }) => {
      const trimmedValue = control.value.trim();
      const pattern = /^[a-zA-Z\s]+$/;

      if (trimmedValue === '') {
        return { required: true };
      } else if (!pattern.test(trimmedValue)) {
        return { patternInvalid: true };
      }
      return null;
    };
  }

  populateFormGroups() {
    this.isLoading = true;
    if (this.isEditMode) {
      this.orgService
        .getOrganization(
          this.organizationId,
          this.loggedInUser.applicationUserId
        )
        .subscribe({
          next: (organization: Organization[]) => {
            this.organization = organization[0];

            this.selectedOrganizationType = this.orgtypelist.find(
              (x) =>
                x.organizationTypeId === this.organization.organizationTypeId
            );
            this.OrganizationTypeName =
              this.selectedOrganizationType?.organizationTypeName || '';
            this.organizationForm.patchValue({
              name: organization[0].name,
              tenantUrl: organization[0].url,
              email: organization[0].email,
              phoneNumber: organization[0].phoneNumber,
              fax: organization[0].fax,
              address1: organization[0].address1,
              address2: organization[0].address2,
              postalCode: organization[0].zip,
              city: organization[0].city,
              district: organization[0].district,
              state: organization[0].state,
              country: organization[0].country,
              orgTypeId: organization[0].organizationTypeId,
            });

            if (organization[0].imagePath) {
              this.selectedImage = organization[0].imagePath +=
                '?t=' + new Date().getTime(); // Cache busting
            } else {
              this.selectedImage = organization[0].imagePath;
            }
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
          },
        });
    }
  }

  addContactForm() {
    const form = document.getElementById('repetable-contact-form');
    if (form) {
      const clonedForm = form.cloneNode(true);

      const parentDiv = document.getElementById('Contacts');
      if (parentDiv) parentDiv.appendChild(clonedForm);
    }
  }
  removeContactForm(event: Event) {
    const parentDiv = document.getElementById('Contacts');
    const target = event.target as HTMLElement;
    if (target) {
      parentDiv?.removeChild(target);
    }
  }

  addOrganization() {
    if (this.organizationForm.valid) {
      const orgData: Organization = {
        organizationId: this.organizationId,
        name: this.organizationForm.get('name')!.value!,
        url: this.organizationForm.get('tenantUrl')!.value!,
        email: this.organizationForm.get('email')!.value!,
        imagePath: this.selectedImage,
        address1: this.organizationForm.get('address1')!.value!,
        address2: this.organizationForm.get('address2')!.value!,
        city: this.organizationForm.get('city')!.value!,
        district: this.organizationForm.get('district')!.value!,
        state: this.organizationForm.get('state')!.value!,
        zip: this.organizationForm.get('postalCode')!.value!,
        country: this.organizationForm.get('country')!.value!,
        phoneNumber: this.organizationForm.get('phoneNumber')!.value!,
        fax: this.organizationForm.get('fax')!.value!,
        isActive: this.organization ? this.organization.isActive : true,
        updatedby: this.loggedInUser.applicationUserId,
        organizationTypeId:
          this.selectedOrganizationType?.organizationTypeId ||
          this.organizationForm.get('orgTypeId')!.value!,
      };

      if (!this.isEditMode) {
        const addOrgCommand = {
          name: orgData.name,
          url: orgData.url,
          email: orgData.email,
          imagePath: orgData.imagePath,
          address1: orgData.address1,
          address2: orgData.address2,
          city: orgData.city,
          district: orgData.district,
          state: orgData.state,
          zip: orgData.zip,
          country: orgData.country,
          phoneNumber: orgData.phoneNumber,
          fax: orgData.fax,
          createdby: this.loggedInUser.applicationUserId,
          organizationTypeId: orgData.organizationTypeId,
        };
        this.isLoading = true;
        this.orgService.addOrganization(addOrgCommand).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.isLoading = false;
              this.toastr.success('Organization Added Successfully', '', {
                timeOut: 3000,
                closeButton: true,
              });
              this.router.navigate([
                this.loggedInUser.organizationName,
                this.loggedInUser.roleName,
                'tenant',
              ]);
            } else {
              this.toastr.error(res.message);
              this.isLoading = false;
            }
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          },
        });
      } else {
        this.isLoading = true;
        this.orgService.updateOrganization(orgData).subscribe({
          next: (res) => {
            this.toastr.success('Organization Updated Successfully', '', {
              timeOut: 3000,
              closeButton: true,
            });
            this.location.back();
            this.isLoading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          },
        });
      }
    } else {
      this.organizationForm.markAllAsTouched();
    }
  }

  openUploadImageDialog() {
    const dialog = this.dialog.open(ImageUploadDialogComponent, {
      disableClose: true,
    });

    dialog.afterClosed().subscribe((imgString) => {
      if (imgString !== '' && imgString !== undefined) {
        this.selectedImage = imgString;
      }
    });
  }
  removeUploadedImage() {
    this.selectedImage = '';
  }

  back() {
    if (
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'tenant',
      ]);
    } else if (
      this.loggedInUser.roleName == AppConstants.ChasmanovoRoles.admin
    ) {
      this.router.navigate([
        this.loggedInUser.organizationName,
        this.loggedInUser.roleName,
        'users',
      ]);
    }
  }

  checkAvatarPresence() {
    return (
      (this.selectedImage !== undefined && this.selectedImage !== '') ||
      this.organizationForm.get('name')!.value! !== ''
    );
  }

  isNameValid(): boolean {
    const firstName = this.organizationForm.get('name')?.value?.trim() || '';
    const namePattern = /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/;
    return namePattern.test(firstName);
  }

  getFullName(): string {
    let firstName = this.organizationForm.get('name')?.value || '';

    if (!isNaN(Number(firstName))) firstName = '';
    return `${firstName}`;
  }
}
