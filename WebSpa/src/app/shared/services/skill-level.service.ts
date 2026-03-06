import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SkillLevel } from '../models/commonmodel';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SkillLevelService {

  baseApiURL: string = environment.issuer + '/api/SkillLevel';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getAllSkillLevel() {
    return this.apiservice.get<SkillLevel[]>(this.baseApiURL + '/getAllSkillLevel');
  }
}
