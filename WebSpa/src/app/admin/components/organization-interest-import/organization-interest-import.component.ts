import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { InterestService } from '../../../shared/services/interest.service';
import { ApplicationUser } from '@app/shared/models/commonmodel';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-organization-interest-import',
  templateUrl: './organization-interest-import.component.html',
  styleUrl: './organization-interest-import.component.scss'
})
export class OrganizationInterestImportComponent implements OnInit {
  selectedFile: File | null = null;
  errMessage: string = '';
  fileUploadedSuccessfully = false;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  isLoading: boolean = false;
  loggedInUser!: ApplicationUser;
  exportSource: any[] = [{ "OrganizationName": "OrganizationName", "InterestName": "InterestName" }];

  constructor(public dialogRef: MatDialogRef<OrganizationInterestImportComponent>, public toaster: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, }, private interestService: InterestService) {

  }
  ngOnInit() {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData)
    }
    else if (userData) {
      this.loggedInUser = JSON.parse(userData);
    }
  }
  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isValidExcelFile(file)) {
        this.selectedFile = file;
        this.errMessage = '';
      } else {
        this.errMessage = 'Only Excel files (.xlsx, .xls) are allowed.';
      }
    }
  }
  isValidExcelFile(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    return allowedTypes.includes(file.type);
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      console.error('No file selected.');
      return;
    }

    this.isLoading = true; // Set loading state

    this.interestService.uploadFile(this.selectedFile, this.loggedInUser.applicationUserId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess == true) {
          this.onClose();
          this.toaster.success(response.message)
        }
        this.fileUploadedSuccessfully = true;
      },
      error: (err: HttpErrorResponse) => {
        this.onClose();
        let errormsg = err.error['OrganizationInterests'] != null ? err.error['OrganizationInterests'] : err.error['error']
        this.toaster.error(errormsg);
        this.isLoading = false;
      }
    });
  }
  sampleExcel(): void {
    this.isLoading = true;
    const columns = Object.keys(this.exportSource[0]);
    const dummyRow: { [key: string]: string } = {};
    columns.forEach(col => {
      const formattedHeading = col.charAt(0).toUpperCase() + col.slice(1).toLowerCase();
      dummyRow[formattedHeading] = formattedHeading.toLowerCase();
    });
    const sampleData = [dummyRow];
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveAsSampleExcel(excelBuffer, 'SampleData');
    this.toaster.success("File Downloaded Succesfuly");
    this.isLoading = false;
    this.onClose();
  }

  private saveAsSampleExcel(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `${fileName}_export.xlsx`);
  }

  onClose(): void {
    this.dialogRef.close();
  }
  closeUploader() {
    this.dialogRef.close('');
  }
  onDrop(event: any) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (this.isValidExcelFile(file)) {
        this.selectedFile = file;
        this.errMessage = '';
      } else {
        this.errMessage = 'Only Excel files (.xlsx, .xls) are allowed.';
      }
    }
  }
  onDragOver(event: any) {
    event.preventDefault();
  }
  formatBytes(bytes: number) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  cancelFileSelection() {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
