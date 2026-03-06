import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GetallOrgsquery,
  QuestionModel,
  QuestionResponseModel,
  QuestionsList,
  QuestionTypeModel,
} from '../models/commonmodel';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { DataStorageService } from './data-storage.service';
import { AppConstants } from '../App-Constants';

@Injectable({
  providedIn: 'root',
})
export class questionService {
  baseApiURL: string = environment.issuer + '/api/QuestionsBank';
  importurl: string = environment.issuer + '/api/BulkDataImport';
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private dataStorageService: DataStorageService
  ) {}

  getAllquestions(query: GetallOrgsquery) {
    return this.apiservice.post<QuestionResponseModel>(
      this.baseApiURL + '/get-questions',
      query
    );
  }

  getquestionById(questionId: string) {
    let params = new HttpParams();
    params = params.set('questionId', questionId);
    return this.apiservice.get<QuestionsList>(
      this.baseApiURL + '/get-questionById',
      { params }
    );
  }

  getAllquestionTypes() {
    return this.apiservice.get<QuestionTypeModel[]>(
      this.baseApiURL + '/getallquestionTypes'
    );
  }

  // getQuestionBanks(orgId:string,skillId?:string,levelId?:string)
  // {
  //   let param=new HttpParams();
  //   param=param.set('OrganizationId',orgId)
  //   param=param.set('ChasmaNOVOSkillId', skillId || '')
  //   param=param.set('LevelId',levelId||'')   
  //   return this.apiservice.get(this.baseApiURL + '/getquestionBank',{params:param});
  // }
  getQuestionBanks(orgId: string, skills?: { skillId: string; skillLevelId: string }[]) {
    const body = {
      organizationId: orgId,
      skills: skills?.map(s => ({
        chasmaNOVOSkillId: s.skillId,
        levelId: s.skillLevelId
      }))
    };
  
    return this.apiservice.post(this.baseApiURL + '/getquestionBank', body);
  }
  addquestion(data: QuestionModel) {
    return this.apiservice.post<any>(this.baseApiURL, data);
  }

  updatequestion(data: QuestionModel) {
    return this.apiservice.put<any>(this.baseApiURL + '/update-question', data);
  }
  uploadFile(file: File, userId: string, orgId: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('userId', userId);
    formData.append('orgId', orgId);
    // return this.apiservice.post<any>(this.importurl + "/upload-bulk-Question", formData, { headers });

        return this.http.post<any>(this.importurl + '/upload-bulk-Question', formData, {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${this.dataStorageService.get(AppConstants.LocalStorage.APIToken)}`,
                'UserId': `${this.dataStorageService.get(AppConstants.LocalStorage.UserId)}`
            })
        });
    }

    uploadImage(file: File): Observable<any> {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);
        return this.apiservice.post<any>(this.baseApiURL + "/upload-image", formData);
    }

    deleteImage(imageUrl: string): Observable<any> {
        let params = new HttpParams();
        params = params.set('imageUrl', imageUrl);
        return this.apiservice.delete<any>(this.baseApiURL + '/delete-image', { params });
    }

}