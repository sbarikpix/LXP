import { HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  Skill,
  LevelModel,
  UserSkillsModel,
  UpdateUserSkillModel,
  GetResumeDetailsResponse,
} from '../models/commonmodel';
import { ApiService } from './api.service';
import { AppConstants } from '../App-Constants';
import { DataStorageService } from './data-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  baseApiURL: string = environment.issuer + '/api/OrganizationSkill';
  importurl: string = environment.issuer + '/api/BulkDataImport';
  skillUrl: string = environment.issuer + '/api/ChasmaNOVOSkills';
  constructor(private apiservice: ApiService, private http: HttpClient, private dataStorageService: DataStorageService) { }

  getAllOrganizationSkill(
    orgId: string,
    userId?: string,
    jobTitleId?: string,
    chasmaNOVOSkillId?: string,    
    pageSize?: number,
    perPage?: number,
    searchText?: string
  ): Observable<any[]> {
    let params = new HttpParams();
    params = params.set('orgId', orgId);

    if (chasmaNOVOSkillId) {
      params = params.set('chasmaNOVOSkillId', chasmaNOVOSkillId);
    }
    if (jobTitleId) {
      params = params.set('jobTitleId', jobTitleId);
    }
    if (userId) {
      params = params.set('userId', userId);
    }
    if (pageSize && perPage) {
      params = params.set('pageSize', pageSize.toString());
      params = params.set('skillPerPage', perPage.toString());
    }
    if (searchText) {
      params = params.set('searchText', searchText);
    }

    return this.apiservice.get<any[]>(`${this.baseApiURL}/getallorgskill`, {
      params,
    });
  }

  addOrganizationSkill(command: any): Observable<any> {
    return this.apiservice.post<any>(this.baseApiURL + '/addskills', command);
  }

  updateOrganizationSkill(skillData: Skill): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL + '/updateskill', skillData);
  }

  updateuserSkill(command: UpdateUserSkillModel): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL + '/updateuserskill', command);
  }

  addskillToGroup(command: any): Observable<any> {
    return this.apiservice.post<any>(this.baseApiURL + '/addskilltogroup', command);
  }

  deleteOrganizationSkill(
    orgId: string,
    organisationSkillId: string,
    userId: string
  ): Observable<any> {
    let params = new HttpParams().set('orgId', orgId);
    params = params.set('skillId', organisationSkillId);
    params = params.set('userId', userId);
    return this.apiservice.delete<any>(this.baseApiURL + '/deleteskill', { params });
  }
  uploadFile(file: File, userId: string, orgId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId);
    formData.append('organizationId', orgId);

    return this.http.post<any>(this.importurl + '/upload-organization-skill', formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.dataStorageService.get(AppConstants.LocalStorage.APIToken)}`,
        'UserId': `${this.dataStorageService.get(AppConstants.LocalStorage.UserId)}`
      })
    });
  }

  getskillLevels(userId: string) {
    let params = new HttpParams().set('userId', userId);
    return this.apiservice.get<LevelModel[]>(this.baseApiURL + '/getskillLevels', {
      params,
    });
  }

  getAllJobSkills(orgId: string, jobTitleId: string, skillId?: string) {
    let params = new HttpParams().set('orgId', orgId);
    params = params.set('jobTitleId', jobTitleId);
    skillId ? (params = params.set('chasmaNOVOSkillId', skillId)) : params;
    return this.apiservice.get<Skill[]>(this.baseApiURL + '/getallorgskill', {
      params,
    });
  }

  getuserSkills(userId: string, organaizationId?: string) {
    let params = new HttpParams().set('userId', userId);
    organaizationId
      ? (params = params.set('organizationId', organaizationId))
      : params;
    return this.apiservice.get<UserSkillsModel[]>(
      this.baseApiURL + '/getuserskills',
      { params }
    );
  }

  getAllSkills(jobTitleId: string, skillPerPage?: number, pageSize?: number, searchText?: string) {
    let params = new HttpParams().set('jobTitleId', jobTitleId);

    // Only add 'skillPerPage' if it's a valid value
    if (skillPerPage) {
      params = params.set('skillPerPage', skillPerPage.toString());
    }

    // Only add 'pageSize' if it's a valid value
    if (pageSize) {
      params = params.set('pageSize', pageSize.toString());
    }

    // Only add 'searchText' if it's a valid value
    if (searchText) {
      params = params.set('searchText', searchText);
    }

    return this.apiservice.get<Skill[]>(this.skillUrl + '/getallskills', { params });
  }

  getOrgUsersSkills(organaizationId: string) {
    let params = new HttpParams().set('organizationId', organaizationId);
    return this.apiservice.get<any>(this.baseApiURL + '/getorgusersskills', {
      params,
    });
  }

  // we are not using this API because not we have direct route for resume page
  // generateSkillPassport(command: any) {
  //   return this.http.post<any>(
  //     this.baseApiURL + '/uploadskillpassport',
  //     command
  //   );
  // }

  // getaddToAppleWallet(userId: string, orgId: any, skillpassport: any) {
  //   let params = new HttpParams();
  //   params = params.set('userId', userId);
  //   params = params.set('oraganizationId', orgId);
  //   params = params.set('skillpassport', skillpassport);

  //   return this.http.get<any>(this.baseApiURL + '/generate-applepass', {
  //     params,
  //     responseType: 'blob' as 'json',
  //     headers: new HttpHeaders({
  //       Accept: 'application/vnd.apple.pkpass',
  //     }),
  //   });
  // }

  getaddToAppleWallet(userId: string, orgId: any, skillpassport: any): Observable<any> {
    return this.getOptions().pipe(
      switchMap(defaultOptions => {
        let params = new HttpParams();
        params = params.set('userId', userId);
        params = params.set('oraganizationId', orgId);
        params = params.set('skillpassport', skillpassport);

        const headers = defaultOptions.headers
          .set('Accept', 'application/vnd.apple.pkpass');

        return this.http.get(this.baseApiURL + '/generate-applepass', {
          params,
          headers,
          responseType: 'blob' as 'json'
        });
      })
    );
  }

  getResumeDetails(userId: string) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return this.apiservice.get<GetResumeDetailsResponse>(
      this.baseApiURL + `/getResumeDetails`,
      {
        params,
      }
    );
  }

  getaddToGoogleWallet(userId: string, orgId: any, skillpassport: any) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    params = params.set('oraganizationId', orgId);
    params = params.set('skillpassport', skillpassport);

    return this.apiservice.get<any>(this.baseApiURL + '/generate-googlepass', {
      params,
    });
  }

  getOptions(): Observable<{ headers: HttpHeaders }> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.dataStorageService.get(AppConstants.LocalStorage.APIToken)}`,
      'UserId': `${this.dataStorageService.get(AppConstants.LocalStorage.UserId)}`
    });

    return of({ headers });
  }
}

export interface SkillPassportCommand {
  userId: string;
  organizationId: string;
  base64string: string;
}

export interface GeneratePasscommand {
  userId: any;
  organizationId: any;
  skillPassport: any;
}
