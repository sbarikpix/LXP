import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../models/commonmodel';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  baseApiURL: string = environment.issuer + '/api/UserRoles';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getOrganizationRoles(roleId?: string) {
    var params = new HttpParams();
    if (roleId)
      params = params.set('roleId', roleId);
    return this.apiservice.get<Role[]>(this.baseApiURL + "/get-roles", { params });
  }
}
