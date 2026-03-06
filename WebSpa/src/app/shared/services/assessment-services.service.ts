import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  ApplicationUser,
  AssessmentResponse,
  ExamQuestionsModel,
  GetQuestionPaperResponse,
  GetScheduledAssessmentsResponseModel,
  ScheduleData,
  SubmittedQuestions,
} from '../models/commonmodel';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ExamServicesService {
  baseApiURL: string = environment.issuer + '/api/Assessment';

  constructor(private http: HttpClient, private apiservice: ApiService) {}

  getIpaddress() {
    return this.apiservice.get<any>(this.baseApiURL + '/get-Ipaddress');
  }

  getexamquestions(query: GetQuestionPaperQuery) {
    return this.apiservice.post<GetQuestionPaperResponse[]>(
      this.baseApiURL + '/get-questionPaper',
      query
    );
  }

  submitExam(command: GetQuestionPaperResponse) {
    return this.apiservice.post<AssessmentResponse>(this.baseApiURL, command);
  }

  scheduleAssessment(command: ScheduleData) {
    return this.apiservice.post<any>(
      this.baseApiURL + '/scheduleAssessment',
      command
    );
  }

  getscheduledUsers(userId: string, orgId: string) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    params = params.set('OrgId', orgId);
    return this.apiservice.get<any[]>(this.baseApiURL + '/get-scheduledUsers', {
      params,
    });
  }

  getscheduledAssessments(userId: string) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return this.apiservice.get<GetScheduledAssessmentsResponseModel[]>(
      this.baseApiURL + '/get-scheduledassessments',
      { params }
    );
  }

  getAssessmentMetrices(
    userId: string,
    organizationId: string,
    assessmentType?: string
  ) {
    let params = new HttpParams();
    params = params.set('UserId', userId);
    params = params.set('OrganisationId', organizationId);
    params = params.set('AssessmentType', assessmentType ? assessmentType : '');
    return this.apiservice.get<any[]>(
      this.baseApiURL + '/getassessment-metrices',
      {
        params,
      }
    );
  }

  getuserattemptdetails(userid: string, userattemptId: string) {
    let params = new HttpParams();
    params = params.set('userId', userid);
    params = params.set('userattemptId', userattemptId);
    return this.apiservice.get<GetQuestionPaperResponse>(
      this.baseApiURL + '/getattemptdetails',
      { params }
    );
  }
}
export interface GetQuestionPaperQuery {
  userId: string;
  organizationId: string;
  skillsDetails: skillDetails[];
  questionIds?: questionDetails[];
}
export interface skillDetails {
  skillId: string;
  skillLevelId: string;
}

export interface questionDetails {
  questionId: string;
}
