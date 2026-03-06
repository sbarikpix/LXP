import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SkillService } from '../../../shared/services/skill.service';
import { Skill } from '../../../shared/models/commonmodel';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { ToastrService } from 'ngx-toastr';
import { OrganizationSkillImportComponent } from '../organization-skill-import/organization-skill-import.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-organization-skills',
  templateUrl: './organization-skills.component.html',
  styleUrls: ['./organization-skills.component.scss']
})
export class OrganizationSkillsComponent implements OnInit {

  orgSkills: Skill[] = [];
  skillToEdit!: Skill;
  searchText = '';
  isEdit: boolean = false;
  organisationSkillId: string = '';
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  organizationId: string = '';
  exportSource: any[] = [];

  constructor(
    private skillService: SkillService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private toaster: ToastrService,
    private router: Router,
    private location: Location,
    private dialog: MatDialog) { }

  skillForm = this.formBuilder.group({
    name: ['', [Validators.required, this.nameValidator()]]
  });


  nameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const trimmedValue = control.value ? control.value.trim() : '';
      if (trimmedValue.length === 0) {
        return { 'required': true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    const emulateuserData = localStorage.getItem('emulatedUser');
    const userData = localStorage.getItem('loggedInUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData)
    }
    else if (userData) {
      this.loggedInUser = JSON.parse(userData);
    }

    this.isEdit = !!(this.route.snapshot.paramMap.get('tab-action') || this.route.snapshot.paramMap.get('subtab-action'));
    this.organizationId = this.route.snapshot.paramMap.get('organizationId') || (this.loggedInUser.organizationId);
    this.organisationSkillId = this.route.snapshot.paramMap.get('id') || '';

    if (this.isEdit && this.organisationSkillId) {
      this.getOrganizationSkills(this.organisationSkillId);
    } else {
      this.getOrganizationSkills();
    }
  }

  getOrganizationSkills(organisationSkillId?: string): void {
    this.isLoading = true;

    if (!organisationSkillId) {
      this.skillService.getAllOrganizationSkill(this.organizationId, '').subscribe({
        next: (res) => {
          this.orgSkills = res;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toaster.error('An unexpected error occurred.');
        }
      });
    } else {
      this.skillService.getAllOrganizationSkill(this.organizationId, organisationSkillId).subscribe({
        next: (res) => {
          this.skillToEdit = res[0];
          this.populateSkillForm();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toaster.error('An unexpected error occurred.');
        }
      });

      this.skillService.getAllOrganizationSkill(this.organizationId, '').subscribe({
        next: (res) => {
          this.orgSkills = res;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) {
            this.toaster.error('Unauthorized Request');
            this.isLoading = false;
          } else {
            this.toaster.error('An unexpected error occurred.');
            this.isLoading = false;
          }
        }
      });
    }
  }

  populateSkillForm(): void {
    if (this.skillToEdit) {
      this.skillForm.patchValue({
        name: this.skillToEdit.name
      });
    }
  }

  addOrEditSkill(): void {
    if (this.skillForm.valid) {
      this.skillToEdit = {
        chasmaNOVOSkillId: (this.skillToEdit?.chasmaNOVOSkillId !== undefined) ? this.skillToEdit?.chasmaNOVOSkillId : '',
        name: this.skillForm.get('name')!.value!,
        description: this.skillForm.get('description')!.value!,
        chasmaNOVOJobSetId: ''
      };

      if (!this.isEdit) {
        this.isLoading = true;
        this.skillService.addOrganizationSkill(this.skillToEdit).subscribe({
          next: (res) => {
            this.orgSkills.push(this.skillToEdit);
            this.toaster.success('skill added successfully');
            this.skillForm.reset();
            this.getOrganizationSkills();
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            if (err.status === 401) {
              this.toaster.error('Unauthorized Request');
            } else {
              this.toaster.error('An unexpected error occurred.');
            }
          }
        });
      } else {
        this.isLoading = true;
        this.skillService.updateOrganizationSkill(this.skillToEdit).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.isLoading = false;
              this.toaster.success('skill updated successfully');
              this.location.back();
            } else {
              this.isLoading = false;
              this.toaster.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationSkills']
            this.toaster.error(errormsg);
            this.isLoading = false;
          }
        });
      }
    } else {
      this.skillForm.markAllAsTouched();
    }
  }

  deleteSkill(organizationSkillId: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'The skill will be deleted',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Delete!',
      width: '400px',
      padding: '1rem'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.skillService.deleteOrganizationSkill(this.organizationId, organizationSkillId, this.loggedInUser.applicationUserId).subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.isSuccess) {
              const index = this.orgSkills.findIndex(skill => skill.chasmaNOVOSkillId === organizationSkillId);
              if (index !== -1) {
                this.orgSkills.splice(index, 1);
              }
              this.toaster.success('skill deleted successfully');
            } else {
              this.toaster.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationSkills']
            this.toaster.error(errormsg);
            this.isLoading = false;
          }
        });
      }
    });
  }

  back(): void {
    this.skillForm.reset();
    this.location.back();
  }
  openImportDialog(): void {
    const dialogRef = this.dialog.open(OrganizationSkillImportComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle any post-dialog actions if needed
      this.getOrganizationSkills();
    });
  }
  clearSearch() {
    this.searchText = '';
  }
  exportToExcel(): void {
    const exportData: any[] = [];
    this.orgSkills.forEach(item => {
      const transformedItem = {
        Skillname: item.name,// Format date as YYYY-MM-DD
      };
      exportData.push(transformedItem);
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'skills_data');
    this.isLoading = false

  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url: string = window.URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = fileName + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

