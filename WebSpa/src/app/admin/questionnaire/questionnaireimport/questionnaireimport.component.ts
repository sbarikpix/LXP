import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApplicationUser } from '@app/shared/models/commonmodel';
import { UserService } from '@app/shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { questionService } from '@app/shared/services/question.service';

@Component({
  selector: 'app-questionnaireimport',
  templateUrl: './questionnaireimport.component.html',
  styleUrl: './questionnaireimport.component.scss',
})
export class QuestionnaireimportComponent implements OnInit {
  selectedFile: File | null = null;
  errMessage: string = '';
  fileUploadedSuccessfully = false;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  isLoading: boolean = false;
  loggedInUser!: ApplicationUser;
  exportSource: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<QuestionnaireimportComponent>,
    public toaster: ToastrService,
    private bulkQuestionService: questionService,
    private userService: UserService
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

  onClose() {
    setTimeout(() => {
      this.dialogRef.close();
    });
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

  sampleExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    worksheet.addRow([
      'QuestionType',
      'SkillLevel',
      'SkillName',
      'Question',
      'Option1',
      'Option2',
      'Option3',
      'Option4',
      'CorrectAnswer',
      'Marks',
      'NegativeMarks',
    ]);

    worksheet.getColumn(1).eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['leanType,Multiple Choice'],
          errorTitle: 'Invalid Choice',
          error: 'Please select a valid value from the dropdown.',
          showErrorMessage: true,
          showInputMessage: true,
        };
      }
    });

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      saveAs(blob, 'Questionnaire_Sample.xlsx');
    });
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
      console.error('No file selected.');
      return;
    }
    this.isLoading = true;
    this.bulkQuestionService
      .uploadFile(
        this.selectedFile,
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.isSuccess == true) {
            this.onClose();
            this.toaster.success(response.message);
          }
          this.fileUploadedSuccessfully = true;
        },
        error: (err: HttpErrorResponse) => {
          this.onClose();
          let errormsg =
            err.error['QuestionBulk'] != null
              ? err.error['QuestionBulk']
              : err.error['QuestionaireQuestions'];
          this.toaster.error(errormsg);
          this.isLoading = false;
        },
      });
  }
}
