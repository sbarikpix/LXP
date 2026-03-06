import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  baseApiURL: string = environment.issuer + '/api/Reports';
  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getuserassessmentdetails(command: GetReportsData) {
    return this.apiservice.post<any>(this.baseApiURL + '/getassessmentreport', command);
  }

  getlearningjourneyreport(command: GetReportsData) {
    return this.apiservice.post<any>(this.baseApiURL + '/getlearningjourneyreport', command);
  }

  getusersskillsreport(command: GetReportsData) {
    return this.apiservice.post<any>(this.baseApiURL + '/getusersskillsreport', command);
  }

  getManagerusersreport(command: GetReportsData) {
    return this.apiservice.post<any>(this.baseApiURL + '/managerusersreport', command)
  }

  getallusersreport(command: GetReportsData) {
    return this.apiservice.post<any>(this.baseApiURL + '/alluserssummaryreport', command)
  }
}

export interface GetReportsData {
  page: number;
  pagesize: number;
  filters?: any;
  sortField?: any;
  sortOrder?: any;
  userId: string;
  organizationId?: string;
}