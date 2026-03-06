import { computed, Injectable, signal } from '@angular/core';
import { Candidate, MapDataService } from './map-data.service';
import { ApiService } from './api.service';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, switchMap } from 'rxjs';

export interface Filters {
  state: string;
  country: string;
  district: string | null;
  jobTitle: string;
  skill: string | null;
  risk: string | null;
  mentor: boolean;
  user: string;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  // State Signals
  readonly filters = signal<Filters>({
    country: 'All Countries',
    state: 'All States',
    district: null,
    jobTitle: 'Select Job Title',
    skill: null,
    risk: null,
    mentor: false,
    user: '',
  });

  readonly loading = signal<boolean>(false);
  readonly mainView = signal<'Map' | 'Analytics'>('Map');
  readonly viewMode = signal<
    'Global' | 'National' | 'State' | 'District' | 'Individual'
  >('National');
  readonly mapOverlay = signal<'Clusters' | 'Heatmap'>('Clusters');
  readonly selectedCandidate = signal<Candidate | null>(null);

  readonly showLeftPanel = signal<boolean>(true);
  readonly showBottomPanel = signal<boolean>(true);

  readonly activeTab = signal<string>('candidates');
  readonly chatSelectedSkill = signal<string | null>(null);
  readonly loggedInUser = signal<any>(null);

  // Observable to Signal for candidates
  readonly candidates = toSignal(this.dataService.candidates$, {
    initialValue: [],
  });

  // Master lists
  readonly allSkills = toSignal(this.dataService.skills$, { initialValue: [] });
  readonly allJobs = toSignal(this.dataService.jobs$, { initialValue: [] });
  readonly allMapLocations = toSignal(this.dataService.mapLocations$, { initialValue: [] });

  constructor(
    private dataService: MapDataService,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadData();
  }

  loadData() {
    const user = this.authService.getCurrentUser();
    console.log('TalentMap: Current User Context:', user);
    
    if (user) {
      this.loggedInUser.set(user);
      this.loading.set(true);
      const userId = user.applicationUserId || user.userid || user.ApplicationUserId || user.sub || user.userId;
      const loggedInUserId = user.applicationUserId || user.userid || user.ApplicationUserId || user.sub || user.userId;
      const orgId = user.organizationId || user.OrganizationId;

      console.log('TalentMap: Fetching data with:', { userId, orgId, loggedInUserId });

      // Load master lists first, then users
      forkJoin([
        this.dataService.loadAllOrganizationSkills(orgId),
        this.dataService.loadAllOrganizationJobs(orgId),
        this.dataService.loadMapLocations()
      ]).pipe(
        // Pass null for userId to ensure we get the full organization user list
        switchMap(() => this.dataService.loadOrganizationUsers(null, loggedInUserId, orgId))
      ).subscribe({
        next: (users) => {
          console.log('TalentMap: Data loaded successfully, count:', users?.length);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('TalentMap: Error loading data:', err);
          this.loading.set(false);
        },
      });
    } else {
      console.warn('TalentMap: No user context found in AuthService');
    }
  }

  // Computed filtered data
  readonly filteredData = computed(() => {
    let result = this.candidates();
    const f = this.filters();

    if (f.country !== 'All Countries')
      result = result.filter((item) => item.country === f.country);
    if (f.state !== 'All States')
      result = result.filter((item) => item.state === f.state);
    if (f.district)
      result = result.filter((item) => item.district === f.district);
    if (f.jobTitle !== 'Select Job Title')
      result = result.filter((item) => item.jobTitle === f.jobTitle);
    
    // Skill filter: check if selected skill name exists in candidate's skills array
    if (f.skill) {
      result = result.filter((item) => 
        item.skills && item.skills.some(s => s === f.skill)
      );
    }

    if (f.risk) result = result.filter((item) => item.risk === f.risk);
    if (f.mentor) result = result.filter((item) => item.mentor === true);
    if (f.user && f.user.trim() !== '') {
      const searchText = f.user.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText) ||
          item.jobTitle.toLowerCase().includes(searchText) ||
          (item.skills && item.skills.some(s => s.toLowerCase().includes(searchText)))
      );
    }
    return result;
  });

  // Actions
  updateFilter(key: keyof Filters, value: any) {
    this.filters.update((prev) => ({ ...prev, [key]: value }));
    // Logic to clear selection if filtered out is handled reactively normally,
    // but here we might need an effect or just let the UI handle it.
    // For now, let's keep it simple.
  }

  setFilters(newFilters: Filters) {
    this.filters.set(newFilters);
  }

  resetFilters() {
    this.setFilters({
      country: 'All Countries',
      state: 'All States',
      district: null,
      jobTitle: 'Select Job Title',
      skill: null,
      risk: null,
      mentor: false,
      user: '',
    });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  selectCandidate(candidate: Candidate | null) {
    this.selectedCandidate.set(candidate);
    if (candidate) {
      if (this.activeTab() !== 'candidates') this.activeTab.set('candidates');
      if (!this.showBottomPanel()) this.showBottomPanel.set(true);
    }
  }

  setChatSelectedSkill(skill: string | null) {
    this.chatSelectedSkill.set(skill);
    if (skill && !this.showBottomPanel()) this.showBottomPanel.set(true);
  }

  toggleLeftPanel() {
    this.showLeftPanel.update((v: any) => !v);
  }

  toggleBottomPanel() {
    this.showBottomPanel.update((v: any) => !v);
  }

  setMainView(view: 'Map' | 'Analytics') {
    this.mainView.set(view);
  }

  setViewMode(
    mode: 'Global' | 'National' | 'State' | 'District' | 'Individual'
  ) {
    this.viewMode.set(mode);
  }

  setMapOverlay(overlay: 'Clusters' | 'Heatmap') {
    this.mapOverlay.set(overlay);
  }
}
