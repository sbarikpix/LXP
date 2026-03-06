import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserSkillRating } from '../models/commonmodel';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserSkillRatingService {

  baseApiURL: string = environment.issuer + '/api/UserSkillRating';
  constructor(private http: HttpClient, private apiservice: ApiService) { }

  addUserSkillRating(skillRatingCommand: any) {
    return this.apiservice.post<UserSkillRating[]>(this.baseApiURL + '/addSkillRating', skillRatingCommand);
  }

  getAllUserSkillRatings(userId: string) {
    let param = new HttpParams().set('applicationUserId', userId);
    return this.apiservice.get<UserSkillRating[]>(this.baseApiURL + '/getAllUserSkillRatings', { params: param });
  }
}
