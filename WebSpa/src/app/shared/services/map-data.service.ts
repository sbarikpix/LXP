import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface StateConfig {
  name: string;
  baseX: number;
  baseY: number;
  districts: string[];
}

export interface MasterSkill {
  id: string;
  name: string;
}

export interface MasterJob {
  id: string;
  name: string;
}

export interface MapLocation {
  mapLocationId: string;
  locationType: string;
  name: string;
  parentName?: string;
  latitude: string;
  longitude: string;
  defaultZoomLevel: number;
}

export interface Candidate {
  id: string | number;
  name: string;
  state: string;
  district: string;
  skill: string; // First skill name
  skills: string[]; // All skill names
  jobTitle: string;
  risk: string;
  exp: number;
  mentor: boolean;
  coords: { x: number; y: number };
  email: string;
  phone: string;
  country: string;
  isGlobal: boolean;
  image?: string;
  score?: number;
  topSkills?: string[]; // Keep for legacy if needed, but we'll use 'skills'
  performanceScore?: number;
  jobTitleId?: string;
  applicationUserId?: string;
  organizationId?: string;
  organizationName?: string;
  roleName?: string;
  roleId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MapDataService {
  baseApiURL: string = environment.issuer + '/api/Userorganization';

  private STATES_CONFIG: StateConfig[] = [
    {
      name: 'Kerala',
      baseX: 35,
      baseY: 10,
      districts: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    },
    {
      name: 'Assam',
      baseX: 90,
      baseY: 75,
      districts: ['Guwahati', 'Silchar', 'Dibrugarh'],
    },
    {
      name: 'Gujarat',
      baseX: 15,
      baseY: 57,
      districts: ['Ahmedabad', 'Surat', 'Vadodara'],
    },
    {
      name: 'Maharashtra',
      baseX: 30,
      baseY: 45,
      districts: ['Mumbai', 'Pune', 'Nagpur'],
    },
    {
      name: 'Telangana',
      baseX: 50,
      baseY: 35,
      districts: ['Hyderabad', 'Warangal', 'Nizamabad'],
    },
    {
      name: 'Karnataka',
      baseX: 35,
      baseY: 25,
      districts: ['Bangalore', 'Mysore', 'Hubli'],
    },
    {
      name: 'Madhya Pradesh',
      baseX: 45,
      baseY: 60,
      districts: ['Bhopal', 'Indore', 'Gwalior'],
    },
    {
      name: 'Delhi',
      baseX: 43,
      baseY: 82,
      districts: ['New Delhi', 'Noida', 'Gurgaon'],
    },
    {
      name: 'Tamil Nadu',
      baseX: 45,
      baseY: 12,
      districts: ['Chennai', 'Coimbatore', 'Madurai'],
    },
    {
      name: 'West Bengal',
      baseX: 78,
      baseY: 62,
      districts: ['Kolkata', 'Howrah', 'Durgapur'],
    },
    {
      name: 'Uttar Pradesh',
      baseX: 52,
      baseY: 75,
      districts: ['Lucknow', 'Kanpur', 'Varanasi'],
    },
    {
      name: 'Rajasthan',
      baseX: 25,
      baseY: 72,
      districts: ['Jaipur', 'Udaipur', 'Jodhpur'],
    },
  ];

  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  public candidates$ = this.candidatesSubject.asObservable();

  private skillsSubject = new BehaviorSubject<MasterSkill[]>([]);
  public skills$ = this.skillsSubject.asObservable();

  private jobsSubject = new BehaviorSubject<MasterJob[]>([]);
  public jobs$ = this.jobsSubject.asObservable();

  private mapLocationsSubject = new BehaviorSubject<MapLocation[]>([]);
  public mapLocations$ = this.mapLocationsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  get candidates(): Candidate[] {
    return this.candidatesSubject.value;
  }

  get allSkills(): MasterSkill[] {
    return this.skillsSubject.value;
  }

  get allJobs(): MasterJob[] {
    return this.jobsSubject.value;
  }

  get allMapLocations(): MapLocation[] {
    return this.mapLocationsSubject.value;
  }

  getStatesConfig() {
    return this.STATES_CONFIG;
  }

  // private generateCandidates(): ApplicationUser[] {
  //   let data: ApplicationUser[] = [];
  //   let idCounter = 1;

  //   this.STATES_CONFIG.forEach((state) => {
  //     const count = Math.floor(Math.random() * 8) + 8;
  //     for (let i = 0; i < count; i++) {
  //       const district =
  //         state.districts[Math.floor(Math.random() * state.districts.length)];
  //       const skill =
  //         this.ALL_SKILLS[Math.floor(Math.random() * this.ALL_SKILLS.length)];

  //       data.push({
  //         app: idCounter++,
  //         name: this.generateName(),
  //         state: state.name,
  //         district: district,
  //         skill: skill,
  //         category: this.getCategoryForSkill(skill),
  //         risk: this.RISKS[Math.floor(Math.random() * this.RISKS.length)],
  //         exp: Math.floor(Math.random() * 15) + 2,
  //         mentor: Math.random() > 0.7,
  //         coords: {
  //           x: this.randomOffset(state.baseX, 6),
  //           y: this.randomOffset(state.baseY, 6),
  //         },
  //         email: `candidate${idCounter}@example.com`,
  //         phone: `+91 9${Math.floor(Math.random() * 1000000000)}`,
  //         isGlobal: false,
  //         score: Math.floor(Math.random() * 40) + 60,
  //         topSkills: [skill, 'JavaScript', 'Problem Solving'].slice(0, 3),
  //         image: `https://i.pravatar.cc/150?u=${idCounter}`,
  //       });
  //     }
  //   });

  //   return data;
  // }

  loadAllOrganizationSkills(orgId: string): Observable<MasterSkill[]> {
    let params = new HttpParams().set('orgId', orgId);
    return this.apiService
      .get<any[]>(
        environment.issuer + '/api/OrganizationSkill/getallorgskill',
        { params }
      )
      .pipe(
        map((skills) =>
          (skills || []).map((s) => ({
            id: s.chasmaNOVOSkillId || s.id,
            name: s.name,
          }))
        ),
        tap((skills) => this.skillsSubject.next(skills))
      );
  }

  loadAllOrganizationJobs(orgId: string): Observable<MasterJob[]> {
    let params = new HttpParams().set('orgId', orgId);
    return this.apiService
      .get<any[]>(environment.issuer + '/api/OrganizationJob/getallorgJobs', {
        params,
      })
      .pipe(
        map((jobs) =>
          (jobs || []).map((j) => ({
            id: j.chasmaNOVOJobTitleId || j.id,
            name: j.name,
          }))
        ),
        tap((jobs) => this.jobsSubject.next(jobs))
      );
  }

  loadMapLocations(): Observable<MapLocation[]> {
    return this.apiService
      .get<MapLocation[]>(environment.issuer + '/api/MapLocations')
      .pipe(
        tap((locations) => this.mapLocationsSubject.next(locations || []))
      );
  }

  loadOrganizationUsers(
    userId: string | null | undefined,
    loggedInUserId: string | null | undefined,
    orgId?: string | null | undefined
  ): Observable<Candidate[]> {
    if (!loggedInUserId) {
      console.warn(
        'MapDataService: loggedInUserId is required for fetching users'
      );
      return new BehaviorSubject<Candidate[]>([]).asObservable();
    }

    let params: HttpParams = new HttpParams().set(
      'logInUserId',
      loggedInUserId
    );
    if (userId) params = params.set('userId', userId);
    if (orgId) params = params.set('orgId', orgId);

    return this.apiService
      .get<any[]>(this.baseApiURL + '/getallorgusers', {
        params,
      })
      .pipe(
        map((users) => {
          const skillsMaster = this.allSkills;
          const getSkillName = (id: string) =>
            skillsMaster.find((s) => s.id === id)?.name || id;

          return (users || []).map((u, idx) => {
            const skillIds = u.userSkills || [];
            const skillNames = skillIds.map(getSkillName);

            return {
              id: u.applicationUserId || u.id || idx,
              applicationUserId: u.applicationUserId,
              name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              state: u.state || '',
              district: u.district || '',
              skill: skillNames.length > 0 ? skillNames[0] : u.skill || '',
              skills: skillNames,
              jobTitle: u.jobTitleName || '',
              jobTitleId: u.jobTitleId || '',
              risk: u.riskLevel || 'Low',
              exp: u.exp || 0,
              mentor: !!u.isMentor,
              coords: {
                x: parseFloat(u.longitude) || this.getRandomXForState(u.state),
                y: parseFloat(u.latitude) || this.getRandomYForState(u.state),
              },
              email: u.email || '',
              phone: u.phoneNumber || '',
              country: u.country || '',
              isGlobal: !!u.isGlobal,
              image:
                u.profileImagePath ||
                `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random`,
              score: u.performanceScore ?? 0,
              performanceScore: u.performanceScore ?? 0,
              topSkills: skillNames,
              organizationId: u.organizationId,
              organizationName: u.organizationName,
              roleName: u.roleName,
              roleId: u.roleId,
            };
          });
        }),
        tap((candidates) => {
          this.candidatesSubject.next(candidates);
        })
      );
  }

  private getRandomXForState(stateName: string): number {
    const config = this.STATES_CONFIG.find((s) => s.name === stateName);
    if (config) {
      return config.baseX + (Math.random() - 0.5) * 5;
    }
    return 20 + Math.random() * 60; // Spread out a bit more
  }

  private getRandomYForState(stateName: string): number {
    const config = this.STATES_CONFIG.find((s) => s.name === stateName);
    if (config) {
      return config.baseY + (Math.random() - 0.5) * 5;
    }
    return 20 + Math.random() * 60;
  }

  getCoordinates(address: string) {
    const params = {
      address: address,
    };
    return this.apiService.post<any>(
      this.baseApiURL + 'UserCoordinates',
      params
    );
  }
}
