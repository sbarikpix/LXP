import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GroupCommand, GroupRules, Groups, TargetValueDto, UpdateGroup } from '../models/commonmodel';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  baseApiURL: string = environment.issuer + '/api/Groups';

  constructor(private http: HttpClient, private apiService: ApiService) { }

  getAllGroups(organaizationId: string) {
    let params = new HttpParams().set('OrganizationId', organaizationId);
    return this.apiService.get<Groups[]>(this.baseApiURL + '/getallgroups',{params});
  }

  deleteGroup(groupId: string) {
    return this.apiService.delete(`${this.baseApiURL}/deletegroup?groupId=${groupId}`);
  }

  getGroupById(groupId: string) {
    return this.apiService.get<GroupDetailsResponse>(
      `${this.baseApiURL}/getgroupbyid?groupId=${groupId}`
    );
  }

  getGroupRules() {
    return this.apiService.get<GroupRules>(`${this.baseApiURL}/getgrouprules`);
  }

  addGroup(groupData: GroupCommand) {
    return this.apiService.post<any>(`${this.baseApiURL}/addgroup`, groupData);
  }

  updateGroup(groupData: UpdateGroup) {
    return this.apiService.put<any>(this.baseApiURL + '/updategroup', groupData);
  }

  refreshGroup(groupId: string,organizationId: string) : Observable<any>{
    const command = {
      groupId: groupId,
      organizationId: organizationId
    };
    return this.apiService.post(`${this.baseApiURL}/${ groupId }/refresh`,command);
  }

  getGroupUsers(groupId:string[] ){
    let params = new HttpParams();
    groupId.forEach(id => {
      params = params.append('GroupId', id);
    });
    return this.apiService.get(`${this.baseApiURL}/getgroupusers`,{ params });
  }

}




export interface GroupDetailsResponse {
  groupName: any;
  description: any;
  createdBy: any;
  creatorName: any;
  createdOn: any;
  rules: GroupRuleMapping[];
}

export interface GroupRuleMapping {
  groupRuleId: string;
  groupRuleMappingId:string;
  operator: string;
  targetsOperator:string;
  ruleType: any;
  targetedValues: TargetValueDto[]; 
}
