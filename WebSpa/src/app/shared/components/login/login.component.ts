import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { AppConstants } from '@app/shared/App-Constants';
import { ApplicationUser } from '@app/shared/models/commonmodel';
import { AuthService } from '@app/shared/services/auth.service';
import { DataStorageService } from '@app/shared/services/data-storage.service';
import { GetLoginQuery, LoginModel, LoginService } from '@app/shared/services/login.service';
import { RoleService } from '@app/shared/services/role.service';
import { error } from 'console';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  authToken: any;
  isLoading: boolean = false;
  loginError: any;
  loginObj = {} as LoginModel;
  username = '';
  password = '';
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string | null = null;
  externalProviders = [
    { 'provider': 'google', 'providerlogo': 'assets/Images/Google.png' },
    { 'provider': 'microsoft', 'providerlogo': 'assets/Images/Microsoft.png' }
  ];
  loggedInUser!: ApplicationUser;

  // constructor(private loginService: LoginService,
  //   private router: Router,
  //   private authService: AuthService,
  //   private roleService: RoleService,
  //   private appcomponent: AppComponent,
  //   private fb: FormBuilder,
  //   private dataStorageService: DataStorageService, private title: Title) {
  //   this.title.setTitle("ChasmaNOVO")
  //   this.loginForm = this.fb.group({
  //     username: ['', [Validators.required, Validators.email]],
  //     password: ['', [Validators.required, Validators.minLength(8)]],
  //     // rememberMe: [false]
  //   });
  // }

  constructor(
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private dataStorageService: DataStorageService,
    private title: Title
  ) {
    this.title.setTitle("ChasmaNOVO");
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }


  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.navigateAfterLogin();
    }
  }

  isLogin() {
    return this.authService.isLoggedIn();
  }


  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { username, password } = this.loginForm.value;
    const command: GetLoginQuery = {
      userName: username,
      password: password
    };

    this.loginService.getToken(command).subscribe({
      next: (user) => {
        this.authToken = user;

        // Store authentication data
        this.storeAuthData(user, username);

        // Notify app component about login change
        this.loginService.loginChanged();

        // Navigate or let app component handle the flow
        this.navigateAfterLogin();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Incorrect username or password.';
        console.error('Login error:', err);
      }
    });
  }

  private storeAuthData(authToken: any, username: string): void {
    this.dataStorageService.set(AppConstants.LocalStorage.IsLoggedIn, 'true');
    this.dataStorageService.set(AppConstants.LocalStorage.APIToken, authToken.apiKey);
    this.dataStorageService.set(AppConstants.LocalStorage.UserId, authToken.userId);
    this.dataStorageService.set(AppConstants.LocalStorage.UserName, username);
    this.dataStorageService.set(AppConstants.LocalStorage.roleName, authToken.roleName);
  }

  private navigateAfterLogin(): void {
    // this.router.navigate(['/']); // This will trigger app component logic
    const storedUser = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (storedUser) {
      this.loggedInUser = JSON.parse(storedUser);
    }
    this.router.navigate([
      this.loggedInUser?.organizationName,
      this.loggedInUser?.roleName,
      'home',
    ]);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(): void {
    this.router.navigate(['/forgotpassword']);
  }

  loginWithExternalProvider(provider: string): void {
    this.isLoading = true;
    // this.authService.externalLogin(provider).subscribe({
    //   next: (response) => {
    //     this.isLoading = false;
    //     this.router.navigate(['/dashboard']);
    //   },
    //   error: (error) => {
    //     this.isLoading = false;
    //     this.errorMessage = `Failed to login with ${provider}. Please try again.`;
    //   }
    // });
  }
}
