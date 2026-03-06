import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { learningJourneyByIdResponse, learningJourneyResponse } from '../models/commonmodel';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LearningjourneyService {

  baseApiURL: string = environment.issuer + '/api/LearningJourney';

  constructor(private http: HttpClient, private apiservice: ApiService) { }


  addlearningJourney(command: learningJourneyCommand) {
    return this.apiservice.post<any>(this.baseApiURL, command);
  }

  updatelearningJourney(command: learningJourneyCommand) {
    return this.apiservice.put<any>(this.baseApiURL, command);
  }

  getalllearningjourneys(orgId?: string, userId?: string, learningjourneyId?: string) {
    let params = new HttpParams();
    params = params.set('organisationId', orgId || '');
    params = params.set('userId', userId || '');
    params = params.set('learningjourneyId', learningjourneyId || '');
    return this.apiservice.get<learningJourneyResponse[]>(this.baseApiURL, { params });
  }

  getuserlearningJourneydetails(learningjourneyId?: any, userId?: any) {
    let params = new HttpParams();
    params = params.set('journeyId', learningjourneyId);
    params = params.set('userId', userId)
    return this.apiservice.get<learningJourneyByIdResponse[]>(this.baseApiURL + '/getlearningJourneyById', { params });
  };

  adduserlearningjourney(command: userlearningjourneyCommand) {
    return this.apiservice.post<any>(this.baseApiURL + '/userlearningjourney', command);
  }

  addgroupuserlearningjourney(command: groupuserlearningjourneyCommand) {
    return this.apiservice.post<any>(this.baseApiURL + '/groupuserlearningjourney', command);
  }

  updatesubmodulejourney(submoduleId?: any, userLearningJourneyId?: any, isCompleted?: any) {
    let params = new HttpParams();
    params = params.set('usersubmoduleId', submoduleId);
    params = params.set('userLearningJourneyId', userLearningJourneyId)
    params = params.set('isCompleted', isCompleted)
    return this.apiservice.put<any>(this.baseApiURL + '/updatesubmodulejourney', {}, { params });
  }
}

export interface learningJourneyCommand {
  learningJourneyId?: any
  learningJourneyTitle: any
  learningJourneyDescription: any
  learningJourneyImage?: any
  jobTitleId: any
  organizationId: any
  journeyModules: JourneyModules[]
}

export interface userlearningjourneyCommand {
  journeyId: any;
  userId: any;
  assignedUserId?: any;
  isAssigned?: any;
}

export interface groupuserlearningjourneyCommand {
  journeyId: any;
  groupIds: string[]
  assignedUserId?: any;
  isAssigned?: any;
}

export interface JourneyModules {
  moduleTitle: any
  skillId: any
  journeySubModules: JourneySubModules[]
}

export interface JourneySubModules {
  subModuleTitle: any
  levelId: any
}