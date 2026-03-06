import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ReplaySubject, Subject } from 'rxjs';
import { Configuration, ConfigurationService } from './configurations.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  url: string;

  // private loginSubject = new ReplaySubject();
  // loginObserver = this.loginSubject.asObservable();
  // configurationService: any;
  private loginChangedSubject = new Subject<void>();

  public loginChanged$ = this.loginChangedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private configurationService: ConfigurationService
  ) {
    this.url = this.configurationService.configuration.chasmaNOVOAPI;
  }

  getToken(query: GetLoginQuery) {
    return this.apiService.post<GetUserResult>(
      `${this.url}/api/Userorganization/GetToken`,
      query
    );
  }

  // updateAPIToken(query: any) {
  //   return this.apiService.post<string>(`${this.url}/api/Userorganization/ResetToken`, query);
  // }

  changePassword(query: any) {
    return this.apiService.post<string>(
      `${this.url}/api/Users/ChangePassword`,
      query
    );
  }

  resetPassword(command: ResetPasswordCommand) {
    return this.apiService.post<any>(
      `${this.url}/api/Userorganization/resetpassword`,
      command
    );
  }

  forgotPassword(query: ForgotPasswordCommand) {
    return this.apiService.post<string>(
      `${this.url}/api/Userorganization/ForgotPassword`,
      query
    );
  }

  signup(command: SignupCommand) {
    return this.apiService.post<any>(
      `${this.url}/api/Userorganization/SignUp`,
      command
    );
  }

  loginChanged(): void {
    this.loginChangedSubject.next();
  }

  refreshToken() {
    return this.apiService.get<GetUserResult>(
      `${this.url}/api/Userorganization/RefreshToken`
    );
  }
}

export interface GetLoginQuery {
  userName: string;
  password: string;
}

export interface LoginModel {
  userName: string;
  password: string;
}

export interface GetUserResult {
  apiKey: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  userName: string;
  profileImagePath: string;
  dateOfBirth: Date | null;
  gender: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber: string;
  isActive: boolean;
  userInterests: string[];
  jobTitleId: string;
  organizationTeamId: string;
  userSkills: string[];
  managerId: string;
  roleId: string;
  roleName?: string;
  isEmailVerified: boolean;
  sKillPassport?: any;
  responsibility?: string;
}

export interface UpdatePasswordCommand {
  userId: string;
  userName: string;
  newPassword: string;
  currentPassword: string;
}

export interface ResetPasswordCommand {
  userId: any;
  confirmPassword: string;
  newPassword: string;
}

export interface ForgotPasswordCommand {
  email: any;
}

export interface SignupCommand {
  firstName: any;
  lastName: any;
  email: any;
  username: any;
  address1: any;
  address2: any;
  mobile?: any;
  city: any;
  district: any;
  state: any;
  zip: any;
  country: any;
  password: any;
  confirmPassword: any;
}
