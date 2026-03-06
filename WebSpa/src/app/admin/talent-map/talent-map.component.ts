import { Component, inject, OnInit } from '@angular/core';
import { MapService } from '@app/shared/services/map.service';
import { MapDataService } from '@app/shared/services/map-data.service';

@Component({
  selector: 'app-talent-map',
  templateUrl: './talent-map.component.html',
  styleUrls: ['./talent-map.component.scss'],
  standalone: false,
})
export class TalentMapComponent implements OnInit {
  appState = inject(MapService);
  dataService = inject(MapDataService);

  ngOnInit() {
    this.appState.loadData();
  }

  // State
  mainView = this.appState.mainView;
  showLeftPanel = this.appState.showLeftPanel;
  showBottomPanel = this.appState.showBottomPanel;
  selectedCandidate = this.appState.selectedCandidate;
  chatSelectedSkill = this.appState.chatSelectedSkill;
  loading = this.appState.loading;

  // Data for chatbot
  allData = this.appState.candidates;

  toggleLeftPanel() {
    this.appState.toggleLeftPanel();
  }

  toggleBottomPanel() {
    this.appState.toggleBottomPanel();
  }

  // Handle AI Actions
  handleAIAction(action: any) {
    switch (action.type) {
      case 'FILTER':
        Object.entries(action.payload).forEach(([key, value]) => {
          this.appState.updateFilter(key as any, value);
        });
        break;
      case 'SELECT_USER':
        const user = this.allData().find(
          (u: any) => u.name.toLowerCase() === action.payload.toLowerCase()
        );
        if (user) {
          this.appState.resetFilters();
          this.appState.selectCandidate(user);
          this.appState.setMainView('Map');
          this.appState.setViewMode('Individual');
        }
        break;
      case 'RESET':
        this.appState.resetFilters();
        break;
      case 'SWITCH_VIEW':
        this.appState.setMainView(action.payload);
        break;
      default:
        break;
    }
  }

  closeSidebarRight() {
    this.appState.selectCandidate(null);
  }

  closeChatSkill() {
    this.appState.setChatSelectedSkill(null);
  }
}
