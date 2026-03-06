import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Route, Router } from '@angular/router';
import {
  AddIntegration,
  ApplicationUser,
} from '@app/shared/models/commonmodel';
import { IntegrationService } from '@app/shared/services/integration.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-integration',
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.scss',
})
export class IntegrationComponent implements OnInit {
  isEnabled: boolean = false;
  loggedInUser!: ApplicationUser;
  integrations: any[] = [];
  loading: boolean = false;
  selectedImage: string | null = null;
  apiFromGroup = this._formBuilder.group({
    baseUrl: [
      '',
      Validators.pattern(
        /^(https?:\/\/)?([\w\d\-]+\.)+[\w\-]+(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?$/
      ),
    ],
    clientId: [''],
    clientSecret: [''],
    scopes: [''],
    grantType: [''],
    description: [''],
    integrationName: [''],
  });
  isEdit: boolean = false;
  integrationId: any;

  constructor(
    private _formBuilder: FormBuilder,
    private integrationservice: IntegrationService,
    private toastr: ToastrService,
    private title: Title,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.title.setTitle('Integrations');
  }
  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId !== this.loggedInUser.applicationUserId) {
      this.router.navigate(['/unauthorized']);
    }
    this.getallIntegrations();
  }

  getallIntegrations() {
    this.loading = true;
    this.integrationservice
      .getallintegrations(this.loggedInUser.organizationId)
      .subscribe({
        next: (res) => {
          if (res) {
            this.integrations = res.sort((a: any, b: any) =>
              a.integrationName.localeCompare(b.integrationName)
            );
            this.loading = false;
          }
        },
        error: (err) => {
          this.loading = false;
          let errmsg = err.error['error'];
          this.toastr.error(errmsg);
        },
      });
  }

  getIntegration(integrationId: string) {
    this.loading = true;
    this.integrationservice
      .getintegrationById(integrationId, this.loggedInUser.organizationId)
      .subscribe({
        next: (res) => {
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
        },
      });
  }

  addintegration() {
    this.isEnabled = true;
    this.isEdit = false;
  }

  editintegration(integration: any) {
    if (integration) {
      this.isEnabled = true;
      this.isEdit = true;
      this.apiFromGroup.patchValue({
        baseUrl: integration.url || '',
        clientId: integration.clientId || '',
        clientSecret: integration.clientSecret || '',
        grantType: integration.grantType || '',
        scopes: integration.scopes || '',
        description: integration.description || '',
        integrationName: integration.integrationName || '',
      });
      this.integrationId = integration.integrationId;
    }
  }

  updateIntegration() {
    this.loading = true;
    if (this.apiFromGroup.valid) {
      const command: AddIntegration = {
        integrationId: this.integrationId,
        integrationName: this.apiFromGroup.value.integrationName!,
        orgId: this.loggedInUser.organizationId,
        baseUrl: this.apiFromGroup.value.baseUrl!,
        clientId: this.apiFromGroup.value.clientId!,
        clientSecret: this.apiFromGroup.value.clientSecret!,
        grantType: this.apiFromGroup.value.grantType!,
        scopes: this.apiFromGroup.value.scopes!,
        description: this.apiFromGroup.value.description!,
        iconPath: this.selectedImage || '',
      };
      setTimeout(() => {
        this.integrationservice.updateintegration(command).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.getallIntegrations();
              this.isEnabled = false;
              this.isEdit = false;
              this.loading = false;
              this.toastr.success(res.message);
            }
          },
          error: (err) => {
            let errmsg = err.error['Integration'];
            this.toastr.error(errmsg);
            this.loading = false;
          },
        });
      });
    } else {
      this.loading = false;
    }
  }

  refresh(integration: any) {
    if (integration) {
      this.loading = true;
      this.apiFromGroup.patchValue({
        baseUrl: integration.url || '',
        clientId: integration.clientId || '',
        clientSecret: integration.clientSecret || '',
        grantType: integration.grantType || '',
        scopes: integration.scopes || '',
        description: integration.description || '',
        integrationName: integration.integrationName || '',
      });
      this.integrationId = integration.integrationId;

      if (this.apiFromGroup.valid) {
        setTimeout(() => {
          this.updateIntegration();
          this.apiFromGroup.reset();
        });
      }
    } else {
      this.loading = false;
    }
  }

  closeDialog() {
    this.apiFromGroup.reset();
    this.isEnabled = !this.isEnabled;
  }
  saveApi() {
    if (!this.apiFromGroup.valid) {
      this.apiFromGroup.markAllAsTouched();
      return;
    }
    this.loading = true;
    if (this.apiFromGroup.valid) {
      const command: AddIntegration = {
        integrationName: this.apiFromGroup.value.integrationName!,
        orgId: this.loggedInUser.organizationId,
        baseUrl: this.apiFromGroup.value.baseUrl!,
        clientId: this.apiFromGroup.value.clientId!,
        clientSecret: this.apiFromGroup.value.clientSecret!,
        grantType: this.apiFromGroup.value.grantType!,
        scopes: this.apiFromGroup.value.scopes!,
        description: this.apiFromGroup.value.description!,
        iconPath: this.selectedImage || '',
      };
      this.integrationservice.addintegration(command).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.getallIntegrations();
            this.toastr.success('Integration Added Sucessfully');
            this.isEnabled = false;
            this.loading = false;
          }
        },
        error: (err) => {
          let errmsg =
            err.error['Integration'] != null
              ? err.error['Integration']
              : err.error['error'];
          this.toastr.error(errmsg);
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      const thumbnailError = `Thumbnail must be less than ${maxSizeMB} MB.`;
      this.toastr.error(thumbnailError);
      this.selectedImage = null;
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      this.selectedImage = reader.result as string;
    };

    reader.onerror = (error) => {
      console.error('Error converting image to Base64:', error);
    };
  }
}
