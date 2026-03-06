import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobTitle } from '../models/commonmodel';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class JobTitleService {
  baseApiURL: string = environment.issuer + '/api/OrganizationJob';
  importurl: string = environment.issuer + '/api/BulkDataImport';

  constructor(private http: HttpClient, private apiservice: ApiService) {}

  getAllOrganizationJobTitle(
    orgId: string,
    organisationJobId: string,
    JobsPerPage?: number,
    pageSize?: number,
    searchText?: string
  ): Observable<JobTitle[]> {
    let params = new HttpParams();
    params = params.set('orgId', orgId);
    params = params.set('chasmaNOVOJobId', organisationJobId);
    if (JobsPerPage) {
      params = params.set('jobsPerPage', JobsPerPage.toString());
    }

    // Only add 'pageSize' if it's a valid value
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }

    // Only add 'searchText' if it's a valid value
    if (searchText) {
      params = params.set('searchText', searchText);
    }

    return this.apiservice.get<JobTitle[]>(this.baseApiURL + '/getallorgjobs', {
      params,
    });
  }

  addOrganizationJob(jobData: JobTitle): Observable<any> {
    const addJobCommand = {
      organizationId: jobData.organizationId,
      chasmaNOVOJobSetId: jobData.chasmaNOVOJobTitleId,
      createdBy: 'admin',
    };
    return this.apiservice.post<any>(
      this.baseApiURL + '/addjob',
      addJobCommand
    );
  }

  updateOrganizationJobTitle(jobData: JobTitle): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL + '/updatejob', jobData);
  }

  deleteOrganizationJob(
    orgId: string,
    organisationJobId: string,
    userId: string
  ): Observable<any> {
    let params = new HttpParams().set('orgId', orgId);
    params = params.set('jobId', organisationJobId);
    params = params.set('userId', userId);
    return this.apiservice.delete<any>(this.baseApiURL + '/deletejob', {
      params,
    });
  }
  uploadFile(file: File, userId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId); // Append logged-in user ID here
    const headers = new HttpHeaders({
      enctype: 'multipart/form-data',
    });
    return this.apiservice.post<any>(
      this.importurl + '/upload-organization-job',
      formData,
      { headers }
    );
  }
}
