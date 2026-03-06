import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../../shared/services/team.service';
import { Team } from '../../../shared/models/commonmodel';
import { AbstractControl, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { ToastrService } from 'ngx-toastr';
import { OrganizationTeamImportComponent } from '../organization-team-import/organization-team-import.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Location } from '@angular/common';

@Component({
  selector: 'app-organization-teams',
  templateUrl: './organization-teams.component.html',
  styleUrl: './organization-teams.component.scss'
})
export class OrganizationTeamsComponent implements OnInit {

  isEdit: boolean = false;
  isAdd: boolean = false;
  organisationTeamId: string = '';
  teamList: Team[] = [];
  teamToEdit!: Team;
  loggedInUser!: ApplicationUser;
  isLoading: boolean = false;
  organizationId: string = '';
  tenant: string = '';
  searchText: string = '';
  exportSource: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private teamService: TeamService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private dialog: MatDialog,
    private location: Location) {
  }

  teamForm = this.formBuilder.group({
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
    this.tenant = this.route.snapshot.paramMap.get('tenant')!;
    this.organisationTeamId = this.route.snapshot.paramMap.get('id')!;
    this.organizationId = this.route.snapshot.paramMap.get('organizationId') || (this.loggedInUser.organizationId);
    if (this.organisationTeamId) {
      this.getOrganizationTeamToEdit(this.organisationTeamId);
    }
    this.getOrganizationTeams();
  }

  getOrganizationTeams() {
    this.isLoading = true;
    this.teamService.getOrganizationTeams(this.organizationId, '').subscribe({
      next: (res) => {
        this.teamList = res;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastr.error('An unexpected error occurred.');
      }
    });

  }

  getOrganizationTeamToEdit(organisationTeamId: string) {
    this.isLoading = true;
    this.teamService.getOrganizationTeams(this.organizationId, organisationTeamId).subscribe({
      next: (res) => {
        this.teamToEdit = res[0];
        this.populateTeamForm();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastr.error('An unexpected error occurred.');
      }
    });
  }

  populateTeamForm() {
    if (this.teamToEdit) {
      this.teamForm.patchValue({
        name: this.teamToEdit.name,
        description: this.teamToEdit.description
      });
    }
  }

  addOrEditTeam() {
    if (this.teamForm.valid) {
      this.teamToEdit = {
        organizationTeamId: this.organisationTeamId,
        description: this.teamForm.get('description')!.value!,
        name: this.teamForm.get('name')!.value!,
        organizationId: this.organizationId,
        updatedBy: this.loggedInUser.applicationUserId,
        usersCount: 0

      };

      if (this.isAdd) {
        this.isLoading = true;
        this.teamService.addOrganizationTeam(this.teamToEdit).subscribe({
          next: (res) => {
            this.isAdd = false;
            this.isLoading = false;
            this.teamForm.reset();
            this.getOrganizationTeams();
            this.toastr.success('team added successfully');
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.toastr.error('An unexpected error occurred.');
          }
        });
      }
      else if (this.isEdit) {
        this.isLoading = true;
        this.teamService.updateOrganizationTeam(this.teamToEdit).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.isEdit = false
              this.isLoading = false;
              this.teamForm.reset();
              this.getOrganizationTeams();
              this.toastr.success('team updated successfully');
              this.location.back();
            }
            else {
              this.toastr.error(res.message);
              this.isLoading = false;
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationTeam']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        })
      }
    }
    else {
      this.teamForm.markAllAsTouched();
    }
  }

  deleteTeam(organisationTeamId: string) {

    Swal.fire({
      title: "Are you sure?",
      text: "the team will be deleted",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes Delete!",
      width: '400px',
      padding: '1rem'

    }).then((result) => {

      if (result.isConfirmed) {
        this.isLoading = true;
        this.teamService.deleteOrganizationTeam(this.organizationId, organisationTeamId, this.loggedInUser.applicationUserId).subscribe({
          next: (res) => {
            if (res.isSuccess) {
              this.toastr.success('team deleted successfully');
              const index = this.teamList.findIndex(team => team.organizationTeamId === organisationTeamId);
              if (index !== -1) {
                this.teamList.splice(index, 1);
              }
              this.isLoading = false;
            }
            else {
              this.isLoading = false;
              this.toastr.error(res.message);
            }
          },
          error: (err: HttpErrorResponse) => {
            let errormsg = err.error['OrganizationTeam']
            this.toastr.error(errormsg);
            this.isLoading = false;
          }
        })
      }
    });
  }

  openAddTeamForm() {
    this.isAdd = true;
  }


  back() {
    this.teamForm.reset();
    this.isAdd = false;
    this.isEdit = false;
    this.location.back();
  }
  openImportDialog(): void {
    const dialogRef = this.dialog.open(OrganizationTeamImportComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getOrganizationTeams();
    });
  }
  clearSearch() {
    this.searchText = '';
  }
  exportToExcel(): void {
    const exportData: any[] = [];
    this.teamList.forEach(item => {
      const transformedItem = {
        OrganizationName: item.organizationId,
        Teamname: item.name,
        Teamdescription: item.description,
        CreatedOn: item.createdOn.split('T')[0] // Format date as YYYY-MM-DD
      };
      exportData.push(transformedItem);
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'teams_data');
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

