import { Component, computed, inject, signal } from '@angular/core';
import { MapService } from '@app/shared/services/map.service';
import {
  MapDataService,
  Candidate,
} from '@app/shared/services/map-data.service';

@Component({
  selector: 'app-map-bottompanel',
  standalone: false,
  templateUrl: './map-bottompanel.component.html',
  styleUrls: ['./map-bottompanel.component.scss'],
})
export class MapBottompanelComponent {
  public appState = inject(MapService);
  private dataService = inject(MapDataService);

  activeTab = this.appState.activeTab;
  data = this.appState.filteredData;
  selectedCandidate = this.appState.selectedCandidate;
  viewMode = this.appState.viewMode;
  loggedInUser = this.appState.loggedInUser;

  toggleBottomPanel() {
    this.appState.toggleBottomPanel();
  }

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 5;

  setItemsPerPage(count: number) {
    this.itemsPerPage = count;
    this.currentPage.set(1);
  }

  currentData = computed(() => {
    if (this.activeTab() === 'candidates') {
      return this.data();
    } else {
      // Group by skill - now considering ALL skills for each candidate
      const groups: Record<string, any> = {};
      this.data().forEach((c) => {
        // Use the skills array we populated in MapDataService
        const skillList = (c.skills && c.skills.length > 0) ? c.skills : [c.skill];
        
        skillList.forEach(skillName => {
          if (!skillName) return;
          
          if (!groups[skillName]) {
            groups[skillName] = {
              name: skillName,
              total: 0,
              highRiskCount: 0,
              avgRisk: 0,
              riskSum: 0,
            };
          }
          groups[skillName].total++;
          if (c.risk === 'High') groups[skillName].highRiskCount++;
          const riskVal = c.risk === 'High' ? 3 : c.risk === 'Medium' ? 2 : 1;
          groups[skillName].riskSum += riskVal;
        });
      });

      return Object.values(groups).map((g) => ({
        ...g,
        avgRisk: (g.riskSum / g.total).toFixed(1),
      })).sort((a, b) => b.total - a.total); // Sort by total count by default
    }
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.currentData().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() =>
    Math.ceil(this.currentData().length / this.itemsPerPage)
  );

  setActiveTab(tab: string) {
    this.appState.setActiveTab(tab);
    this.currentPage.set(1);
  }

  onSelectCandidate(c: Candidate) {
    this.appState.selectCandidate(c);
  }

  onChatOpen(skill: string) {
    this.appState.setChatSelectedSkill(skill);
  }

  handleNextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((n) => n + 1);
    }
  }

  handlePrevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((n) => n - 1);
    }
  }
}
