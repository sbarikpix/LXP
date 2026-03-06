import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { badgeCriteria, badgesdata, UserBadge, userPoinResponses } from '../models/commonmodel';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserBadgeServiceService {

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  baseApiURL: string = environment.issuer + '/api/UserBadges';
  basepointUrl: string = environment.issuer + '/api/UserPoints'
  badgeURL: string = environment.issuer + '/api/Badges'

  getUserBadges(ApplicationUserId: string) {
    let params: HttpParams = new HttpParams().set('ApplicationUserId', ApplicationUserId);
    return this.apiservice.get<UserBadge[]>(`${this.baseApiURL}/getUserbadges`, { params });
  }

  getUserPoints(ApplicationUserId: string, organaizationId: string) {
    let params: HttpParams = new HttpParams().set('OrganizationId', organaizationId).set('ApllicationUserId', ApplicationUserId)
    return this.apiservice.get<userPoinResponses[]>(`${this.basepointUrl}/getUserpoints`, { params });
  }

  getbadges(ApplicationUserId: string) {
    let params: HttpParams = new HttpParams().set('ApplicationUserId', ApplicationUserId)
    return this.apiservice.get<badgesdata[]>(`${this.badgeURL}/getbadges`, { params });
  }

  updateuserbadge(command: UserBadge) {
    return this.apiservice.put<UserBadge[]>(`${this.baseApiURL}/updateUserbadge`, command)
  }

  addBadgeCriteria(requestBody: any): Observable<any> {
    return this.apiservice.post<any>(`${this.baseApiURL}/addbadgecriteria`, requestBody);
  }

  getBadgeCriteria(ApplicationUserId: string, organaizationId: any) {
    let params: HttpParams = new HttpParams().set('ApplicationUserId', ApplicationUserId);
    params = params.set('OrganizationId', organaizationId)
    return this.apiservice.get<badgeCriteria[]>(`${this.baseApiURL}/getbadgecriteria`, { params });
  }

}