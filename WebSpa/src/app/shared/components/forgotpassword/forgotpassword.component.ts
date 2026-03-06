import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ForgotPasswordCommand,
  LoginService,
} from '@app/shared/services/login.service';
import { UserService } from '@app/shared/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.scss',
})
export class ForgotpasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isEmailsent: boolean = false;

  constructor(
    private fb: FormBuilder,
    private loginservice: LoginService,
    private toastr: ToastrService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  getEmailErrorMessage(): string {
    if (this.email?.hasError('required')) {
      return 'Email is required.';
    }
    if (this.email?.hasError('email')) {
      return 'Invalid email format.';
    }
    return '';
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      const command: ForgotPasswordCommand = {
        email: this.forgotPasswordForm.value.email,
      };
      this.loginservice.forgotPassword(command).subscribe({
        next: (res: any) => {
          if (res.isSuccess) {
            this.isEmailsent = true;
          } else {
            this.toastr.error(res.message);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error sending password reset email:', error);
        },
      });
    }

    this.isLoading = true;
  }
}
