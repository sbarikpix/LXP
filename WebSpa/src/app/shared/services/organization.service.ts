import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GetallOrgsquery, Organization, OrganizationResponse } from '../models/commonmodel';
import { Observable } from 'rxjs';
import { __param } from 'tslib';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  baseApiURL: string = environment.issuer + '/api/Organization';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  addOrganization(addOrgCommand: any): Observable<any> {
    return this.apiservice.post<any>(this.baseApiURL + "/AddOrg", addOrgCommand);
  }

  updateOrganization(updatedOrganization: Organization): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL + "/updateorg", updatedOrganization);
  }

  getOrganization(orgId: string, logInUserId: string) {
    let params = new HttpParams().set('orgid', orgId || '');
    params = params.set('logInUserId', logInUserId);
    return this.apiservice.get<Organization[]>(this.baseApiURL + "/getallorg", { params });
  }

  getAllOrganizations(query: GetallOrgsquery) {
    return this.apiservice.post<OrganizationResponse>(this.baseApiURL + "/getallorgIds", query);
  }
}
