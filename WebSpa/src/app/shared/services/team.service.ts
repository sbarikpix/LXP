import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Team } from '../models/commonmodel';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  baseApiURL: string = environment.issuer + '/api/OrganizationTeam';
  importurl: string = environment.issuer + '/api/BulkDataImport';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  addOrganizationTeam(teamData: Team): Observable<any> {
    const addTeamCommand = {
      organizationId: teamData.organizationId,
      name: teamData.name,
      description: teamData.description,
      createdBy: teamData.updatedBy
    };

    return this.apiservice.post<any>(this.baseApiURL + "/addteam", addTeamCommand);
  }

  updateOrganizationTeam(teamData: Team): Observable<any> {

    return this.apiservice.put<any>(this.baseApiURL + "/updateteam", teamData);
  }

  deleteOrganizationTeam(orgId: string, organisationTeamId: string, userId: string): Observable<any> {

    let params: HttpParams = new HttpParams().set('teamId', organisationTeamId);
    params = params.set('orgId', orgId);
    params = params.set('userId', userId);
    return this.apiservice.delete<any>(this.baseApiURL + "/deleteteam", { params });
  }

  getOrganizationTeams(orgId: string, organisationTeamId: string) {
    let params: HttpParams = new HttpParams().set('teamId', organisationTeamId);
    params = params.set('orgId', orgId);

    return this.apiservice.get<Team[]>(this.baseApiURL + "/getallorgteams", { params });
  }
  uploadFile(file: File, userId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId); // Append logged-in user ID here
    const headers = new HttpHeaders({
      'enctype': 'multipart/form-data'
    });
    return this.apiservice.post<any>(this.importurl + "/upload-organization-team", formData, { headers });
  }
}
