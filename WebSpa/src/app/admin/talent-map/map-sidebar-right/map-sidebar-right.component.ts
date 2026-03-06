import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
} from '@angular/core';
import { MapService } from '@app/shared/services/map.service';
import { Candidate } from '@app/shared/services/map-data.service';

@Component({
  selector: 'app-map-sidebar-right',
  standalone: false,
  templateUrl: './map-sidebar-right.component.html',
  styleUrls: ['./map-sidebar-right.component.scss'],
})
export class MapSidebarRightComponent {
  @Input() selectedCandidate: Candidate | null = null;
  @Output() close = new EventEmitter<void>();

  private appState = inject(MapService);
  chatSelectedSkill = this.appState.chatSelectedSkill;
  data = this.appState.filteredData;

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

  handleToggle() {
    this.close.emit();
  }

  closeChatSkill() {
    this.appState.setChatSelectedSkill(null);
  }
}
