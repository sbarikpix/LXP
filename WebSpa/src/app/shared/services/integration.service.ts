import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AddIntegration } from '../models/commonmodel';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {

  baseApiURL: string = environment.issuer + '/api/Integrations';
  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getallintegrations(orgId: string) {
    let params = new HttpParams().set('organisationId', orgId);
    return this.apiservice.get<any[]>(this.baseApiURL, { params });
  }

  getintegrationById(integrationId: string, organisationId: string) {
    let params = new HttpParams().set('integrationId', integrationId);
    params = params.set('organisationId', organisationId)
    return this.apiservice.get<any[]>(this.baseApiURL + '/getintegrationById', { params });
  }

  addintegration(command: AddIntegration): Observable<any> {
    return this.apiservice.post<any>(this.baseApiURL, command);
  }

  updateintegration(command: AddIntegration): Observable<any> {
    return this.apiservice.put<any>(this.baseApiURL, command);
  }
}
