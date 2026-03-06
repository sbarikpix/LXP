import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ApplicationUser,
  OrganizationUserResponse,
} from '../models/commonmodel';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { DataStorageService } from './data-storage.service';
import { AppConstants } from '../App-Constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  baseApiURL: string = environment.issuer + '/api/Userorganization';
  importurl: string = environment.issuer + '/api/BulkDataImport';
  constructor(private http: HttpClient, private apiservice: ApiService, private dataStorageService: DataStorageService) { }

  addOrganizationUser(addUserCommand: any): Observable<any> {
    return this.apiservice.post<any>(this.baseApiURL + '/adduserorg', addUserCommand);
  }

  updateOrganizationUser(updateUserCommand: any): Observable<any> {
    return this.apiservice.put<any>(
      this.baseApiURL + '/updateuserorg',
      updateUserCommand
    );
  }

  deleteOrganizationUser(orgId: string, userId: string): Observable<any> {
    let params: HttpParams = new HttpParams().set('orgId', orgId);
    params = params.set('userId', userId);

    return this.apiservice.delete<any>(this.baseApiURL + '/deleteuserorg', {
      params,
    });
  }

  getOrganizationUsers(
    userId: string,
    logInUserId: string,
    orgId?: string
  ): Observable<any> {
    let params: HttpParams = new HttpParams().set('userId', userId);
    if (orgId) params = params.set('orgId', orgId);
    params = params.set('logInUserId', logInUserId);
    return this.apiservice.get<ApplicationUser[]>(
      this.baseApiURL + '/getallorgusers',
      { params }
    );
  }

  getAllOrganizationUsers(query: any): Observable<any> {
    return this.apiservice.post<OrganizationUserResponse>(this.baseApiURL + '/getallusers', query);
  }

  uploadFile(file: File, userId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId);

    return this.http.post<any>(this.importurl + '/upload-Organization-Users', formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.dataStorageService.get(AppConstants.LocalStorage.APIToken)}`,
        'UserId': `${this.dataStorageService.get(AppConstants.LocalStorage.UserId)}`
      })
    });
  }
  exportToExcelApi(queryParams: any): Observable<any> {
    return this.apiservice.get<any>(`${this.importurl}/export-organization-user`, {
      params: queryParams,
    });
  }
}
