import { Component } from '@angular/core';
import { Interest } from '../../../shared/models/commonmodel';
import { InterestService } from '../../../shared/services/interest.service';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Route } from '@angular/router';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationInterestImportComponent } from '../organization-interest-import/organization-interest-import.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-organization-interests',
  templateUrl: './organization-interests.component.html',
  styleUrl: './organization-interests.component.scss'
})
export class OrganizationInterestsComponent {

  orgInterests: Interest[] = [];
  interestToEdit!: Interest;
  isEdit: boolean = false;
  organizationInterestId: string = '';
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  organizationId: string = '';
  searchText: any;
  exportSource: any[] = [];

  constructor(
    private interestService: InterestService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private toastr: ToastrService,
    private dialog: MatDialog, private location: Location) { }

  interestForm = this.formBuilder.group({
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
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData)
      }
      else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    this.isEdit = !!(this.route.snapshot.paramMap.get('tab-action') || this.route.snapshot.paramMap.get('subtab-action'));
    this.organizationInterestId = this.route.snapshot.paramMap.get('id')!;
    this.organizationId = this.route.snapshot.paramMap.get('organizationId') || (this.loggedInUser.organizationId);
    if (this.isEdit && this.organizationInterestId) {
      this.getOrganizationInterests(this.organizationInterestId);
    }
    else {
      this.getOrganizationInterests();
    }
  }

  getOrganizationInterests(id?: string) {
    this.isLoading = true;
    if (id) {
      this.interestService.getAllOrganizationInterest(this.organizationId, id, this.loggedInUser.applicationUserId).subscribe({
        next: (res) => {
          this.interestToEdit = res[0];
          this.populateInterestForm();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.toastr.error('An unexpected error occurred.');
          this.isLoading = false;
        }
      });
    }
    this.interestService.getAllOrganizationInterest(this.organizationId, '', this.loggedInUser.applicationUserId).subscribe({
      next: (res) => {
        this.orgInterests = res;
        this.isLoading = false;
      }
    });

  }

  populateInterestForm() {
    if (this.interestToEdit) {
      this.interestForm.patchValue({
        name: this.interestToEdit.name
      });
    }
  }

  addOrEditInterest() {

    if (this.interestForm.valid) {
      this.interestToEdit = {
        chasmaNOVOInterestId: (this.interestToEdit?.chasmaNOVOInterestId !== undefined) ? this.interestToEdit?.chasmaNOVOInterestId : '',
        name: this.interestForm.get('name')!.value!,
        description: this.interestForm.get('description')!.value!
      }
      if (!this.isEdit) {
        this.isLoading = true;
        this.interestService.addOrganizationInterest(this.interestToEdit).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.orgInterests.push(this.interestToEdit);
              this.toastr.success('Interest added successfully');
              this.interestForm.reset();
              this.getOrganizationInterests();
              this.isLoading = false;
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }

          },
          error: (err: HttpErrorResponse) => {
            this.toastr.error('An unexpected error occurred.');
            this.isLoading = false;
          }

        });
      }
      else {
        this.isLoading = true;
        this.interestService.updateOrganizationInterest(this.interestToEdit).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.isLoading = false;
              this.toastr.success('Interest updated successfully');
              this.location.back();
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationInterests']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        });
      }
    }
    else {
      this.interestForm.markAllAsTouched();
    }
  }

  deleteInterest(organisationInterestId: string) {

    Swal.fire({
      title: "Are you sure?",
      text: "the interest will be deleted",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes Delete!",
      width: '400px',
      padding: '1rem'

    }).then((result) => {

      if (result.isConfirmed) {
        this.isLoading = true;
        this.interestService.deleteOrganizationInterest(this.organizationId, organisationInterestId, this.loggedInUser.applicationUserId).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              const index = this.orgInterests.findIndex(interest => interest.chasmaNOVOInterestId === organisationInterestId);
              if (index !== -1) {
                this.orgInterests.splice(index, 1);
              }
              this.isLoading = false;
              this.toastr.success('skill deleted successfully');
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationInterests']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        })
      }
    });
  }

  back() {
    this.interestForm.reset();
    this.location.back();
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(OrganizationInterestImportComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle any post-dialog actions if needed
      this.getOrganizationInterests();
    });
  }
  clearSearch() {
    this.searchText = '';
  }
  exportToExcel(): void {
    const exportData: any[] = [];
    this.orgInterests.forEach(item => {
      const transformedItem = {
        // OrganizationName: item.organizationId,
        // Interestname: item.name,
        // CreatedOn: item.createdOn.split('T')[0] // Format date as YYYY-MM-DD
      };
      exportData.push(transformedItem);
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'Interest_data');
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

