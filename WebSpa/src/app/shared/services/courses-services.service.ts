import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GetAllCoursesResponse, UserContentCommand } from '../models/commonmodel';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CoursesServicesService {
  private courseSubject = new BehaviorSubject<any>(null);
  course$ = this.courseSubject.asObservable();
  baseApiURL: string = environment.issuer + '/api/Courses';

  constructor(private http: HttpClient, private apiservice: ApiService) { }

  getAllcourses(query: GetAllCoursesQuery) {
    return this.apiservice.post<GetAllCoursesResponse[]>(this.baseApiURL + "/GetAllCourses", query);
  }

  setCourse(course: any) {
    this.courseSubject.next(course);
  }

  getCourse() {
    return this.courseSubject.getValue();
  }

}

export interface GetAllCoursesQuery {
  userId: string;
  levelId: any;
  skillId: any;
}
