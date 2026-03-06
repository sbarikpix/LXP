import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ApplicationUser,
  GetAllCoursesResponse,
  OrganizationUserResponse,
  UserAssignedContent,
  UserContentbySkillCommand,
  UserContentCommand,
} from '../models/commonmodel';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { DataStorageService } from './data-storage.service';
import { AppConstants } from '../App-Constants';

@Injectable({
  providedIn: 'root',
})
export class UserContentService {
  baseApiURL: string = environment.issuer + '/api/UserContent';
  constructor(
    private apiservice: ApiService,
    private http: HttpClient,
    private dataStorageService: DataStorageService
  ) {}

  uploadusercontent(command: UserContentCommand) {
    if (command.file) {
      const formData = new FormData();
      formData.append('File', command.file, command.file.name);
      formData.append('UserId', command.userId);
      formData.append('OrganizationId', command.organizationId);
      formData.append('Title', command.title);
      formData.append('Description', command.description || '');

      if (command.skillId) formData.append('SkillId', command.skillId);
      if (command.levelId) formData.append('LevelId', command.levelId);
      if (command.webURL) formData.append('WebURL', command.webURL);
      if (command.thumbnail) formData.append('Thumbnail', command.thumbnail);

      return this.http.post<any>(this.baseApiURL + '/usercontent', formData, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.dataStorageService.get(
            AppConstants.LocalStorage.APIToken
          )}`,
          UserId: `${this.dataStorageService.get(
            AppConstants.LocalStorage.UserId
          )}`,
        }),
      });
    } else {
      return this.apiservice.post<any>(
        this.baseApiURL + '/usercontent/webUrl',
        command
      );
    }
  }

  getusercontent(orgId: string, userContentId?: string) {
    let params = new HttpParams();
    // params = params.set('userId', userId);
    params = params.set('orgId', orgId);
    if (userContentId) {
      params = params.set('userContentId', userContentId);
    }
    return this.apiservice.get<UserContentResponse[]>(this.baseApiURL, {
      params,
    });
  }

  getuserskillcontent(command: UserContentbySkillCommand) {
    return this.apiservice.post<GetAllCoursesResponse[]>(
      this.baseApiURL + '/userskillcontent',
      command
    );
  }

  assignedContent(command: AssignContent) {
    return this.apiservice.post<any>(
      this.baseApiURL + '/userassignedcontent',
      command
    );
  }

  assignContentToGroup(command: AssignContent) {
    return this.apiservice.post<any>(
      this.baseApiURL + 'assigncotenttogroup',
      command
    );
  }

  getuserassignedContent(userId: string) {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return this.apiservice.get<UserAssignedContent[]>(
      this.baseApiURL + '/getassignedusercontent',
      { params }
    );
  }

  updateuserassignedContent(userAssignedContentId: any) {
    let params = new HttpParams().set('contentId', userAssignedContentId);
    return this.apiservice.put<any>(
      this.baseApiURL + '/updateassignedcontent',
      {},
      { params }
    );
  }

  editcontent(command: UserContentCommand) {
    const formData: FormData = new FormData();
    formData.append('userId', command.userId);
    formData.append('userContentId', command.userContentId);
    formData.append('title', command.title);
    formData.append('description', command.description);
    formData.append('thumbnail', command.thumbnail);
    return this.apiservice.post<any>(this.baseApiURL + '/editcontent', command);
  }
}

export interface UserContentResponse {
  userContentId: any;
  applicationUserId: any;
  organizationId: any;
  title: any;
  thumbnail: any;
  description: any;
  contentPath: any;
  chasmaNOVOSkillId: any;
  skillName: any;
  levelId: any;
  levelName: any;
  createdOn: any;
}

export interface AssignContent {
  assignedUserId: string;
  assignedToUserId?: string;
  groupId?: string;
  organizationId: string;
  skillId: string;
  levelId?: string;
  contentTitle?: string;
}
