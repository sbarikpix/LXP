import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrganizationType } from '../models/commonmodel';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OrgTypeService {

  baseApiURL: string = environment.issuer + '/api/OrganizationType';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getAllOrgTypes(): Observable<OrganizationType[]> {
    return this.apiservice.get<OrganizationType[]>(this.baseApiURL + '/getAllOrgType');
  }

}
