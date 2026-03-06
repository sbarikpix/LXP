import { Component, inject } from '@angular/core';
import { MapService } from '@app/shared/services/map.service';

@Component({
  selector: 'app-map-header',
  standalone: false,
  templateUrl: './map-header.component.html',
  styleUrls: ['./map-header.component.scss'],
})
export class MapHeaderComponent {
  private appState = inject(MapService);
  currentView = this.appState.mainView;

  setView(view: 'Map' | 'Analytics') {
    this.appState.setMainView(view);
  }
}
