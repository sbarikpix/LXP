import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../shared/services/user.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ApplicationUser } from '@app/shared/models/commonmodel';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-user-import-document',
  templateUrl: './user-import-document.component.html',
  styleUrl: './user-import-document.component.scss',
})
export class UserImportDocumentComponent implements OnInit {
  selectedFile: File | null = null;
  errMessage: string = '';
  fileUploadedSuccessfully = false;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  isLoading: boolean = false;
  loggedInUser!: ApplicationUser;
  exportSource: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<UserImportDocumentComponent>,
    public toaster: ToastrService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) {}
  ngOnInit() {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (userData) {
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
      'application/vnd.ms-excel', // .xls
    ];
    return allowedTypes.includes(file.type);
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.toaster.error('No file selected.');
      return;
    }

    this.isLoading = true; // Set loading state

    this.userService
      .uploadFile(this.selectedFile, this.loggedInUser.applicationUserId)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.isSuccess == true) {
            this.toaster.success(response.message);
            this.onClose();
          }
          this.fileUploadedSuccessfully = true;
        },
        error: (err: HttpErrorResponse) => {
          let errormsg =
            err.error['UsersOrganizations'] != null
              ? err.error['UsersOrganizations']
              : err.error['error'];
          this.toaster.error(errormsg);
          this.isLoading = false;
          this.onClose();
        },
      });
  }
  onClose() {
    setTimeout(() => {
      this.dialogRef.close();
    }, 1000);
  }
  onDrop(event: any) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.size <= 4194304) {
        this.selectedFile = file;
        this.errMessage = '';
      } else {
        this.errMessage = 'Please upload an of maximum size 4 MB';
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
  sampleExcel(): void {
    this.isLoading = true;
    const queryParams = {
      loggedInUserId: this.loggedInUser.applicationUserId,
      organizationId: this.loggedInUser.organizationId,
    };

    this.userService.exportToExcelApi(queryParams).subscribe({
      next: (res) => {
        if (res) {
          this.exportSource = res;
          // Create a dummy row with the same columns as the data
          const columns = Object.keys(this.exportSource[0]);
          const dummyRow: { [key: string]: string } = {};
          columns.forEach((col) => {
            const formattedHeading =
              col.charAt(0).toUpperCase() + col.slice(1).toLowerCase();
            if (formattedHeading.includes('IsActive')) {
              dummyRow[formattedHeading] = 'TRUE'; // Display TRUE for columns containing 'isActive'
            } else {
              dummyRow[formattedHeading] = `${formattedHeading}`.toLowerCase(); // Display `${col}1` for other columns
            }
          });

          // Add the dummy row to the data
          const sampleData = [dummyRow];

          // Create the worksheet with the sample data
          const worksheet: XLSX.WorkSheet =
            XLSX.utils.json_to_sheet(sampleData);
          const workbook: XLSX.WorkBook = {
            Sheets: { data: worksheet },
            SheetNames: ['data'],
          };
          const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          });

          this.saveAsSampleExcel(excelBuffer, 'User_Sample');
          this.toaster.success('File Downloaded Succesfully');
          this.isLoading = false;
          this.dialogRef.close();
        } else {
          this.toaster.error('File Downloaded error,Please try again');
        }
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  private saveAsSampleExcel(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, `${fileName}_Import.xlsx`);
  }
}
