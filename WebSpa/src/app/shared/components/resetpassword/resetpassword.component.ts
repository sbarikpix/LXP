import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LoginService,
  ResetPasswordCommand,
} from '@app/shared/services/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrl: './resetpassword.component.scss',
})
export class ResetpasswordComponent implements OnInit {
  isLoading: boolean = false;
  forgotPasswordForm: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isEmailSent: boolean = false;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private userService: LoginService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          this.strongPasswordValidator,
        ],
      ],
      confirmPassword: [
        '',
        [Validators.required, this.passwordMatchValidator.bind(this)],
      ],
    });
  }
  ngOnInit(): void {

    const segments = this.route.snapshot.url;

    let currentPath = segments.map((segment) => segment.path).join('/');
    if (!currentPath) {
      currentPath = this.router.url.slice(1);
      this.userId = currentPath.split('/')[1];
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return { message: 'Password is required.' };
    }

    if (password.length < 8) {
      return { message: 'Password must be at least 8 characters long.' };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        message: 'Password must contain at least one uppercase letter.',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        message: 'Password must contain at least one lowercase letter.',
      };
    }

    if (!/\d/.test(password)) {
      return { message: 'Password must contain at least one number.' };
    }

    if (!/[\W_]/.test(password)) {
      return {
        message: 'Password must contain at least one special character.',
      };
    }

    return null;
  }

  passwordMatchValidator(control: AbstractControl) {
    const formGroup = control.parent;
    if (!formGroup) return null;

    const psw = formGroup.get('password')?.value;
    const cnfPassword = control.value;

    if (!cnfPassword) {
      return {
        message: 'Confirm Password is required.',
      };
    }
    if (psw !== cnfPassword) {
      return {
        message: 'Confirm Password do not match.',
      };
    }
    return null;
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.toastr.error('Please fill password fields correctly.');
      return;
    }
    this.isLoading = true;
    const password = this.forgotPasswordForm.value.confirmPassword;
    const command: ResetPasswordCommand = {
      userId: this.userId,
      confirmPassword: password,
      newPassword: password,
    };
    this.userService.resetPassword(command).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isEmailSent = true;
        this.toastr.success('Password reset successfully.');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isEmailSent = false;
        this.toastr.error(
          err?.error?.message || 'Failed to reset password. Please try again.'
        );
      },
    });
  }
}
