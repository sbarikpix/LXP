import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Interest } from '../models/commonmodel';
import { environment } from '../../../environments/environment';
import { Interests } from '@app/admin/homepage/homepage/homepage.component';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InterestService {

  baseApiURL: string = environment.issuer + '/api/UserInterest';
  importurl: string = environment.issuer + '/api/BulkDataImport'

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getAllOrganizationInterest(orgId: string, organisationInterestId: string, logInUserId: string) {

    let params = new HttpParams().set('orgId', orgId);
    params = params.set('interestId', organisationInterestId);
    params = params.set('logInUserId', logInUserId);

    return this.apiservice.get<Interest[]>(this.baseApiURL + "/getallorgInterest", { params });
  }

  addOrganizationInterest(interestData: Interest): Observable<any> {
    const addinterestCommand = {
      name: interestData.name,
      description: interestData.description
    };
    return this.apiservice.post<any>(this.baseApiURL + "/addInterest", addinterestCommand);
  }

  updateOrganizationInterest(interestData: Interest): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL + "/updateinterest", interestData);
  }

  deleteOrganizationInterest(orgId: string, organisationInterestId: string, userId: string): Observable<any> {
    let params = new HttpParams().set('orgId', orgId);
    params = params.set('interestId', organisationInterestId);
    params = params.set('userId', userId);
    return this.apiservice.delete<any>(this.baseApiURL + "/deleteinterest", { params })
  }
  uploadFile(file: File, userId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId); // Append logged-in user ID here
    const headers = new HttpHeaders({
      'enctype': 'multipart/form-data'
    });
    return this.apiservice.post<any>(this.importurl + "/upload-organization-interest", formData, { headers });
  }

  getAllInterest(applicationUserId?: string, organaizationId?: string) {
    if (applicationUserId) {
      let params = new HttpParams().set('applicationUserId', applicationUserId);
      params = params.set('organaizationId', organaizationId || '');
      return this.apiservice.get<Interest[]>(this.baseApiURL + "/getAllInterest", { params });
    }
    return this.apiservice.get<Interest[]>(this.baseApiURL + "/getAllInterest");
  }

  getOrgUserInterests(organaizationId: string) {
    let params = new HttpParams().set('organaizationId', organaizationId);
    return this.apiservice.get<Interests[]>(this.baseApiURL + '/getOrgInterests', { params });
  }

}
