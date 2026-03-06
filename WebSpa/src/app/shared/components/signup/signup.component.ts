import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationCommandModel } from '@app/shared/models/commonmodel';
import { FcmService } from '@app/shared/services/fcm.service';
import {
  LoginService,
  SignupCommand,
} from '@app/shared/services/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  isLoading: boolean = false;
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  logoUrl = 'https://chasmadevstore.blob.core.windows.net/public/novo_logo.png';
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private signupService: LoginService,
    private fcmService: FcmService
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address1: ['', Validators.required],
      //address2: ['', Validators.required],
      city: ['', Validators.required],
      district: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      zip: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
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

  ngOnInit(): void {}

  onSubmit() {
    if (!this.signupForm.valid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    if (this.signupForm.valid) {
      const command: SignupCommand = {
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
        email: this.signupForm.value.email,
        address1: this.signupForm.value.address1,
        address2: this.signupForm.value.address2,
        city: this.signupForm.value.city,
        district: this.signupForm.value.district,
        state: this.signupForm.value.state,
        country: this.signupForm.value.country,
        zip: this.signupForm.value.zip,
        password: this.signupForm.value.password,
        confirmPassword: this.signupForm.value.confirmPassword,
        username: this.signupForm.value.email,
        mobile: undefined,
      };
      this.signupService.signup(command).subscribe({
        next: (res: any) => {
          this.notifyUserSignupSuccess();
          this.isLoading = false;
          this.toastr.success('Signup successful!');
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.isLoading = false;
          let errmsg = error.error.UsersOrganizations[0];
          this.toastr.error(errmsg);
        },
      });
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
  allFieldsHaveErrors(): boolean {
    const controls = this.signupForm.controls;
    return Object.keys(controls).every(
      (key) => controls[key].errors && controls[key].touched
    );
  }
  notifyUserSignupSuccess() {
    const command: NotificationCommandModel = {
      title: 'Signup Successful',
      body: 'Welcome to Chasma Novo! Your signup was successful.',
    };
    this.fcmService.sendNotification(command).subscribe({
      next: (res: any) => {
        console.log('Notification sent successfully');
      },
      error: (error: any) => {
        console.error('Error sending notification:', error);
      },
    });
  }
}
