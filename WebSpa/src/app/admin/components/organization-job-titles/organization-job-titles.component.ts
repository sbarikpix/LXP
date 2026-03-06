import { Component, OnInit } from '@angular/core';
import { JobTitleService } from '../../../shared/services/job-title.service';
import { JobTitle } from '../../../shared/models/commonmodel';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationJobImportComponent } from '../organization-job-import/organization-job-import.component';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-organization-job-titles',
  templateUrl: './organization-job-titles.component.html',
  styleUrl: './organization-job-titles.component.scss'
})
export class OrganizationJobTitlesComponent implements OnInit {

  jobTitleList: JobTitle[] = [];
  loggedInUser!: ApplicationUser;
  isEdit: boolean = false;
  isAdd: boolean = false;
  organizationJobId: string = '';
  orgJobToEdit!: JobTitle;
  isLoading: boolean = false;
  organizationId: string = '';
  tenant: any;
  searchText: any;
  exportSource: any[] = [];
  chasmaNOVOJobSetId: any;


  constructor(
    private jobService: JobTitleService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private location: Location,
  ) { }

  jobForm = this.formBuilder.group({
    name: ['', Validators.required],
    description: ['', [Validators.required, this.nameValidator()]]
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
    this.organizationJobId = this.route.snapshot.paramMap.get('id')!;
    this.organizationId = this.route.snapshot.paramMap.get('organizationId') || (this.loggedInUser.organizationId);
    if (this.organizationJobId) {
      this.getOrgJobToEdit(this.organizationJobId);
    }
    this.getOrgJobTitles();
  }

  getOrgJobTitles() {
    this.isLoading = true;
    this.jobService.getAllOrganizationJobTitle(this.organizationId, '').subscribe({
      next: (res) => {
        this.jobTitleList = res;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastr.error('An unexpected error occurred.');
      }
    })
  }

  getOrgJobToEdit(jobId: string) {
    this.isLoading = true;
    this.jobService.getAllOrganizationJobTitle(this.organizationId, jobId).subscribe({
      next: (res) => {
        this.orgJobToEdit = res[0];
        this.populateJobForm();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastr.error('An unexpected error occurred.');
      }
    })
  }

  populateJobForm() {
    if (this.orgJobToEdit) {
      this.jobForm.patchValue({
        name: this.orgJobToEdit.name,
        description: this.orgJobToEdit.description
      });
    }
  }

  addOrEditJob() {
    if (this.jobForm.valid) {
      this.orgJobToEdit = {
        chasmaNOVOJobTitleId: this.organizationJobId,
        description: this.jobForm.get('description')!.value!,
        name: this.jobForm.get('name')!.value!,
        organizationId: this.organizationId,
        usersCount: 0,
        organizationTypeId: '65FEA888-8AB8-4BE4-AAC1-7808F469CD3A'
      };

      if (this.isAdd) {
        this.isLoading = true;
        this.jobService.addOrganizationJob(this.orgJobToEdit).subscribe({
          next: (res) => {
            this.isAdd = false;
            this.jobForm.reset();
            this.getOrgJobTitles();
            this.isLoading = false;
            this.toastr.success('job added successfully');

          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          }
        });
      }
      else if (this.isEdit) {
        this.isLoading = true;
        this.jobService.updateOrganizationJobTitle(this.orgJobToEdit).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.isEdit = false;
              this.jobForm.reset();
              this.isLoading = false;
              this.getOrgJobTitles();
              this.toastr.success('job updated successfully');
              this.location.back();
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationJobs']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        });
      }

    }
    else {
      this.jobForm.markAllAsTouched();
    }
  }

  openAddJobForm() {
    this.isAdd = true;
  }

  deleteJobTitle(jobId: string) {

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
        this.jobService.deleteOrganizationJob(this.organizationId, jobId, this.loggedInUser.applicationUserId).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              const index = this.jobTitleList.findIndex((job) => {
                return job.chasmaNOVOJobTitleId == jobId
              });
              this.jobTitleList.splice(index, 1);
              this.isLoading = false;
              this.toastr.success('job deleted successfully');
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationJobs']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        })
      }
    });
  }
  back() {
    this.isAdd = false;
    this.isEdit = false;
    this.jobForm.reset();
    this.location.back();
  }
  openImportDialog(): void {
    const dialogRef = this.dialog.open(OrganizationJobImportComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle any post-dialog actions if needed
      this.getOrgJobTitles();
    });
  }
  clearSearch() {
    this.searchText = '';
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
  exportToExcel(): void {
    const exportData: any[] = [];
    this.jobTitleList.forEach(item => {
      const transformedItem = {
        OrganizationName: item.organizationId,
        Jobname: item.name,
        Jobdescription: item.description// Format date as YYYY-MM-DD
      };
      exportData.push(transformedItem);
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'jobs_data');
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

}
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
