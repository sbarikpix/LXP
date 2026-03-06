import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-upload-dialog.component.html',
  styleUrl: './image-upload-dialog.component.scss'
})
export class ImageUploadDialogComponent {

  selectedFile: File | undefined;
  errMessage: string = '';
  @ViewChild('fileInput') fileInput: ElementRef | undefined;

  constructor(
    private dialog: MatDialogRef<ImageUploadDialogComponent>,
  ) { }

  closeUploader() {
    this.dialog.close('');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size <= 4194304) {
        this.errMessage = ''; 
        this.selectedFile = file;
      } else {
        this.errMessage = 'please upload image of maximum size 4 MB';
        this.cancelFileSelection();
      }
    }
  }
  
  cancelFileSelection() {
    this.selectedFile = undefined;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  uploadImage() {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.dialog.close(base64String);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  onDrop(event: any) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.size <= 4194304) { 
        this.selectedFile = file;
        this.errMessage = '';
      } else {
        this.errMessage = 'Please upload an image of maximum size 4 MB';
      }
    }
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
}
