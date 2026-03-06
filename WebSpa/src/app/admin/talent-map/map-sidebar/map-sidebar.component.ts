import { Component, computed, signal, inject } from '@angular/core';
import { MapService, Filters } from '@app/shared/services/map.service';
import {
  MapDataService,
  StateConfig,
} from '@app/shared/services/map-data.service';

@Component({
  selector: 'app-map-sidebar',
  standalone: false,
  templateUrl: './map-sidebar.component.html',
  styleUrls: ['./map-sidebar.component.scss'],
})
export class MapSidebarComponent {
  private appState = inject(MapService);
  private dataService = inject(MapDataService);

  // No longer using hardcoded config, deriving from data

  // Local UI state
  openSections = signal<{
    metrics: boolean;
    geography: boolean;
    skills: boolean;
    risk: boolean;
  }>({
    metrics: true,
    geography: true,
    skills: true,
    risk: true,
  });

  // Access global state
  filters = this.appState.filters;
  data = this.appState.filteredData;

  // Metrics
  riskIndex = computed(() => {
    const d = this.data();
    if (!d.length) return 0;
    const highRisk = d.filter((x) => x.risk === 'High').length;
    return (highRisk / d.length).toFixed(2);
  });

  mentorCoverage = computed(() => {
    const d = this.data();
    if (!d.length) return 0;
    const mentors = d.filter((x) => x.mentor).length;
    return Math.round((mentors / d.length) * 100);
  });

  // Available options derived from data
  availableCountries = computed(() => {
    const d = this.appState.candidates();
    const countries = new Set(d.map(c => c.country).filter(Boolean));
    return Array.from(countries).sort();
  });

  availableStates = computed(() => {
    const d = this.appState.candidates();
    const f = this.filters();
    let filtered = d;
    if (f.country !== 'All Countries') {
      filtered = filtered.filter(c => c.country === f.country);
    }
    const states = new Set(filtered.map(c => c.state).filter(Boolean));
    return Array.from(states).sort();
  });

  availableDistricts = computed(() => {
    const d = this.appState.candidates();
    const f = this.filters();
    let filtered = d;
    if (f.country !== 'All Countries') {
      filtered = filtered.filter(c => c.country === f.country);
    }
    if (f.state !== 'All States') {
      filtered = filtered.filter(c => c.state === f.state);
    }
    const districts = new Set(filtered.map(c => c.district).filter(Boolean));
    return Array.from(districts).sort();
  });

  availableJobTitles = computed(() => {
    const d = this.appState.candidates();
    const jobs = new Set(d.map(c => c.jobTitle).filter(Boolean));
    return Array.from(jobs).sort();
  });

  availableSkills = computed(() => {
    const d = this.appState.candidates();
    const allUserSkills = d.flatMap(c => c.skills || []);
    const skills = new Set(allUserSkills.filter(Boolean));
    return Array.from(skills).sort();
  });

  toggleSection(section: 'metrics' | 'geography' | 'skills' | 'risk') {
    this.openSections.update((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  updateFilter(key: keyof Filters, value: any) {
    this.appState.updateFilter(key, value);
    if (key === 'country') {
      this.appState.updateFilter('state', 'All States');
      this.appState.updateFilter('district', null);
    }
    if (key === 'state') this.appState.updateFilter('district', null);
    if (key === 'jobTitle') this.appState.updateFilter('skill', null);
  }

  resetAll() {
    this.appState.resetFilters();
  }
}
