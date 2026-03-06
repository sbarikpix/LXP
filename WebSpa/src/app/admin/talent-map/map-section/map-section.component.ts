import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  effect,
  inject,
  PLATFORM_ID,
  OnInit,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Map, Layer, Marker } from 'leaflet';
import { MapService } from '@app/shared/services/map.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map-section',
  standalone: false,
  templateUrl: './map-section.component.html',
  styleUrls: ['./map-section.component.scss'],
})
export class MapSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private elRef = inject(ElementRef);
  public appState = inject(MapService);

  viewModes: ('Global' | 'National' | 'State' | 'District' | 'Individual')[] = [
    'Global',
    'National',
    'State',
    'District',
    'Individual',
  ];

  // Signals from State
  data = this.appState.filteredData;
  viewMode = this.appState.viewMode;
  mapOverlay = this.appState.mapOverlay;
  selectedCandidate = this.appState.selectedCandidate;
  loggedInUser = this.appState.loggedInUser;

  // Local State
  selectedCluster = signal<any>(null);
  clusterDetails = signal<any>(null);
  selectedUser = signal<any>(null);
  popupPosition = signal({ x: 0, y: 0 }); // Pixel position relative to container

  mapStyle = signal<'Street' | 'Satellite'>('Street');

  public L: any = null; // Dynamic Leaflet instance
  private map: Map | null = null;
  private tileLayer: Layer | null = null;
  private markers: Marker[] = [];
  private heatLayer: any = null;
  private isMapReady = false;
  private isProgrammaticZoom = false;
  private resizeHandler: any = null;

  constructor(private route: Router) {
    // Effect to render data when critical deps change
    effect(() => {
      // track dependencies
      this.data();
      this.mapOverlay();
      this.viewMode(); // Important: Track viewMode changes to re-cluster
      this.selectedCluster();
      this.selectedUser();
      this.handleManualViewModeZoom();

      if (this.isMapReady) {
        // Run in next tick to avoid signal write conflicts during effect
        setTimeout(() => this.renderData(), 0);
      }
    });

    // Effect for Map Style
    effect(() => {
      this.updateMapStyle();
    });

    // Effect for View Mode zooming
    effect(() => {
      this.handleManualViewModeZoom();
    });

    // Effect for Auto Zoom to Candidate
    effect(() => {
      this.handleAutoZoomToCandidate();
    });

    // Effect: when bottom panel toggles, Leaflet needs to recalculate container size
    effect(() => {
      this.appState.showBottomPanel();
      // adjust map container height then invalidate size after transition
      this.adjustMapHeight();
    });

    // Effect: fly to database location when filter changes
    effect(() => {
      const f = this.appState.filters();
      if (!this.map || !this.isMapReady) return;

      let targetLocation: any = null;
      if (f.district) {
        targetLocation = this.appState.allMapLocations().find(l => l.name.toLowerCase() === f.district?.toLowerCase() && l.locationType === 'City');
      } else if (f.state !== 'All States') {
        targetLocation = this.appState.allMapLocations().find(l => l.name.toLowerCase() === f.state.toLowerCase() && l.locationType === 'State');
      } else if (f.country !== 'All Countries') {
        targetLocation = this.appState.allMapLocations().find(l => l.name.toLowerCase() === f.country.toLowerCase() && l.locationType === 'Country');
      }

      if (targetLocation) {
        this.isProgrammaticZoom = true;
        this.map.flyTo([parseFloat(targetLocation.latitude), parseFloat(targetLocation.longitude)], targetLocation.defaultZoomLevel || this.map.getZoom(), {
          duration: 1.5
        });
      }
    });
  }

  private adjustMapHeight() {
    if (this.map) {
      // Small delay to allow CSS transitions to finish
      setTimeout(() => {
        try {
          this.map!.invalidateSize();
        } catch (e) {}
      }, 350);
    }
  }

  ngAfterViewInit(): void {
    // create map using this.mapContainer.nativeElement
    this.initMap();

    // ensure Leaflet recomputes size after render
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  private async initMap() {
    if (!this.mapContainer || !isPlatformBrowser(this.platformId)) return;

    this.L = await import('leaflet');
    // @ts-ignore
    await import('leaflet.heat');

    this.adjustMapHeight();

    this.map = this.L.map(this.mapContainer.nativeElement, {
      center: [20, 10],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 18,
    });

    this.updateMapStyle();

    this.isMapReady = true;
    this.adjustMapHeight();

    // Initial Render
    this.renderData();

    try {
      this.map?.invalidateSize();
    } catch (e) {}

    setTimeout(() => {
      try {
        this.map?.invalidateSize();
      } catch (e) {}
    }, 300);

    this.map!.on('click', () => {
      this.selectedCluster.set(null);
      this.clusterDetails.set(null);
      this.selectedUser.set(null);
    });

    this.map!.on('zoomend', () => {
      if (this.isProgrammaticZoom) {
        this.isProgrammaticZoom = false;
        return;
      }
      if (!this.map) return;

      const zoom = this.map!.getZoom();
      let newMode: 'Global' | 'National' | 'State' | 'District' | 'Individual' =
        'National';

      if (zoom < 3) newMode = 'Global';
      else if (zoom < 5) newMode = 'National';
      else if (zoom >= 5 && zoom < 6.5) newMode = 'State';
      else if (zoom >= 6.5 && zoom < 9) newMode = 'District';
      else if (zoom >= 9) newMode = 'Individual';

      if (this.viewMode() !== newMode) {
        this.appState.setViewMode(newMode);
      }
      this.updatePopupPositions();
    });

    this.map!.on('move', () => this.updatePopupPositions());
    this.map!.on('zoom', () => this.updatePopupPositions());
  }

  private updateMapStyle() {
    if (!this.map) return;

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    if (this.mapStyle() === 'Street') {
      this.tileLayer = this.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(this.map);
    } else {
      const satLayer = this.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      const labelLayer = this.L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      this.tileLayer = this.L.layerGroup([satLayer, labelLayer]).addTo(
        this.map
      );
    }
  }

  private handleManualViewModeZoom() {
    if (!this.map || !this.isMapReady) return;
    const currentZoom = this.map.getZoom();
    const mode = this.viewMode();

    let isValid = false;
    if (mode === 'Global' && currentZoom < 3) isValid = true;
    else if (mode === 'National' && currentZoom >= 3 && currentZoom < 5)
      isValid = true;
    else if (mode === 'State' && currentZoom >= 5 && currentZoom < 6.5)
      isValid = true;
    else if (mode === 'District' && currentZoom >= 6.5 && currentZoom < 9)
      isValid = true;
    else if (mode === 'Individual' && currentZoom >= 9) isValid = true;

    if (!isValid) {
      let targetZoom = currentZoom;
      if (mode === 'Global') targetZoom = 2;
      else if (mode === 'National') targetZoom = 4;
      else if (mode === 'State') targetZoom = 5;
      else if (mode === 'District') targetZoom = 7;
      else if (mode === 'Individual') targetZoom = 10;

      this.isProgrammaticZoom = true;
      this.map.flyTo(this.map.getCenter(), targetZoom, {
        duration: 0.5,
        easeLinearity: 0.25,
      });
    }
  }

  private handleAutoZoomToCandidate() {
    const candidate = this.selectedCandidate();
    if (!this.map || !candidate) return;

    const [lat, lng] = this.getLatLng(
      candidate.coords.x,
      candidate.coords.y,
      candidate.isGlobal
    );
    this.isProgrammaticZoom = true;
    this.map.flyTo([lat, lng], 10, {
      animate: true,
      duration: 1.5,
    });

    // Ensure data is re-rendered after the fly operation finishes
    setTimeout(() => {
      this.renderData();
    }, 1600);

    untracked(() => {
      // Clear other temporary selections, keep the focus on the point
      this.selectedCluster.set(null);
      this.clusterDetails.set(null);
      // We explicitly DON'T set selectedUser here so the popup stays closed
    });
  }

  private updatePopupPositions() {
    if (!this.map) return;
    if (this.selectedCluster()) {
      const c = this.selectedCluster();
      const pos = this.getPixelPosition(c.lat, c.lng);
      this.popupPosition.set({ x: pos.x, y: pos.y - 60 });
    }
    if (this.selectedUser()) {
      const u = this.selectedUser();
      const pos = this.getPixelPosition(u.lat, u.lng);
      this.popupPosition.set({ x: pos.x, y: pos.y - 20 });
    }
  }

  private renderData() {
    if (!this.map) return;
    console.log('renderData');
    this.adjustMapHeight();

    this.markers.forEach((m) => m.remove());
    this.markers = [];
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }

    const data = this.data();
    if (this.mapOverlay() === 'Heatmap') {
      this.selectedCluster.set(null);
      this.selectedUser.set(null);

      if ((this.L as any).heatLayer) {
        const heatPoints = data.map((item) => {
          const [lat, lng] = this.getLatLng(
            item.coords.x,
            item.coords.y,
            item.isGlobal,
            item.country,
            'Country'
          );
          return [lat, lng, 0.8];
        });
        this.heatLayer = (this.L as any)
          .heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 10 })
          .addTo(this.map);
      }
      return;
    }

    const processed = this.processData(data);

    processed.forEach((item) => {
      const [lat, lng] = this.getLatLng(
        item.x,
        item.y,
        // Important: check isGlobal logic. In processData, we map 'country' or use 'isGlobal'.
        // If the processed item has isGlobal:true, we pass that.
        item.isGlobal,
        item.name,
        item.type
      );

      const size = Math.min(80, 40 + item.count * 0.5);

      let icon;
      const isSelected =
        this.selectedCluster()?.id === `${item.type}-${item.name}`;

      if (item.type !== 'Individual') {
        // Cluster Icon
        icon = this.L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div style="
              background-color: ${
                isSelected ? '#fc5723' : 'rgba(252, 87, 35, 0.85)'
              };
              width: ${size}px; height: ${size}px;
              border-radius: 25%;
              border: ${isSelected ? '4px' : '2px'} solid white;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              color: white; font-weight: bold;
              font-size: ${size > 50 ? '14px' : '12px'};
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              transition: all 0.2s; cursor: pointer;
            ">
              <div class="cluster-count">${item.count}</div>
              <div class="cluster-label" style="font-size:10px; font-weight:normal; margin-top:-2px">${
                item.name
              }</div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      } else {
        // Individual Icon
        const color =
          item.risk === 'High'
            ? '#ef4444'
            : item.risk === 'Medium'
            ? '#f59e0b'
            : '#10b981';

        const isUserSelected = this.selectedUser()?.id === item.id;

        icon = this.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="
                  background-color: ${color}; width: 14px; height: 14px; 
                  border-radius: 50%; border: 2px solid white; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ${
                    isUserSelected
                      ? 'transform: scale(1.5); border-color: #fc5723;'
                      : ''
                  }
              "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
      }

      const marker = this.L.marker([lat, lng], { icon }).addTo(this.map!);
      marker.on('click', (e: any) => {
        this.L.DomEvent.stopPropagation(e);
        const pixelPos = this.getPixelPosition(lat, lng);

        if (item.type === 'Individual') {
          this.selectedCluster.set(null);
          this.clusterDetails.set(null);
          const userObj = { ...item, lat, lng };
          this.selectedUser.set(userObj);
          this.appState.selectCandidate(userObj);
          this.popupPosition.set({ x: pixelPos.x, y: pixelPos.y - 20 });
        } else {
          this.selectedUser.set(null);
          const clusterId = `${item.type}-${item.name}`;
          const stats = this.calculateClusterStats(
            item.items,
            item.type,
            item.name
          );

          this.selectedCluster.set({
            id: clusterId,
            name: item.name,
            type: item.type,
            state: item.state,
            count: item.count,
            lat,
            lng,
          });
          this.clusterDetails.set(stats);
          this.popupPosition.set({
            x: pixelPos.x,
            y: pixelPos.y - size / 2 - 10,
          });
        }
      });

      this.markers.push(marker);
    });
  }

  private processData(data: any[]): any[] {
    const mode = this.viewMode();
    if (mode === 'Global') {
      return [
        {
          name: 'Global',
          type: 'Global',
          count: data.length,
          x: 50,
          y: 50,
          scoreLabel: this.calculateAvgScore(data),
          items: data,
          isGlobal: true,
        },
      ];
    }
    if (mode === 'National') {
      const groups: any = {};
      data.forEach((item) => {
        const countryKey = item.country || 'India';
        if (!groups[countryKey]) {
          groups[countryKey] = {
            count: 0,
            xSum: 0,
            ySum: 0,
            name: countryKey,
            type: 'National',
            items: [],
          };
        }
        groups[countryKey].count++;
        groups[countryKey].xSum += item.coords.x;
        groups[countryKey].ySum += item.coords.y;
        groups[countryKey].items.push(item);
      });

      return Object.values(groups).map((c: any) => {
        const x = c.xSum / c.count;
        const y = c.ySum / c.count;
        return {
          ...c,
          x,
          y,
          // If country is India, we want it to potentially trigger the India center fallback if it's 50/50
          isGlobal: c.name.toLowerCase() !== 'india',
        };
      });
    } else if (mode === 'State') {
      const groups: any = {};
      const individuals: any[] = [];
      data.forEach((item) => {
        if (item.isGlobal) {
          individuals.push({
            ...item,
            type: 'Individual',
            x: item.coords.x,
            y: item.coords.y,
            isGlobal: true,
          });
          return;
        }
        if (!groups[item.state])
          groups[item.state] = {
            count: 0,
            xSum: 0,
            ySum: 0,
            name: item.state,
            type: 'State',
            items: [],
          };
        groups[item.state].count++;
        groups[item.state].xSum += item.coords.x;
        groups[item.state].ySum += item.coords.y;
        groups[item.state].items.push(item);
      });
      return [
        ...Object.values(groups).map((g: any) => ({
          ...g,
          x: g.xSum / g.count,
          y: g.ySum / g.count,
        })),
        ...individuals,
      ];
    } else if (mode === 'District') {
      const groups: any = {};
      const individuals: any[] = [];
      data.forEach((item) => {
        if (item.isGlobal) {
          individuals.push({
            ...item,
            type: 'Individual',
            x: item.coords.x,
            y: item.coords.y,
            isGlobal: true,
          });
          return;
        }
        const key = `${item.state}-${item.district}`;
        if (!groups[key])
          groups[key] = {
            count: 0,
            xSum: 0,
            ySum: 0,
            name: item.district,
            type: 'District',
            state: item.state,
            items: [],
          };
        groups[key].count++;
        groups[key].xSum += item.coords.x;
        groups[key].ySum += item.coords.y;
        groups[key].items.push(item);
      });
      return [
        ...Object.values(groups).map((g: any) => ({
          ...g,
          x: g.xSum / g.count,
          y: g.ySum / g.count,
        })),
        ...individuals,
      ];
    } else {
      return data.map((item) => ({
        ...item,
        type: 'Individual',
        x: item.coords.x,
        y: item.coords.y,
        isGlobal: item.isGlobal,
      }));
    }
  }

  private calculateClusterStats(
    clusterData: any[],
    clusterType: string,
    clusterName: string
  ) {
    const stats: any = {
      total: clusterData.length,
      riskDistribution: { High: 0, Medium: 0, Low: 0 },
      skillDistribution: {},
      topSkills: [],
      topDistricts: [],
    };

    clusterData.forEach((item) => {
      if (item.risk in stats.riskDistribution) {
        stats.riskDistribution[item.risk]++;
      }
      const skillsToProcess =
        item.skills && item.skills.length > 0 ? item.skills : [item.skill];
      skillsToProcess.forEach((s: string) => {
        if (s) {
          stats.skillDistribution[s] = (stats.skillDistribution[s] || 0) + 1;
        }
      });
    });

    stats.topSkills = Object.entries(stats.skillDistribution)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill, count]) => ({ skill, count }));

    return stats;
  }

  private getLatLng(x: number, y: number, isGlobal = false, name?: string, type?: string): [number, number] {
    // Check if we have a database-defined center point for this location
    if (name) {
      const normalizedType = type === 'National' ? 'Country' : (type === 'District' ? 'City' : type);
      const dbLocation = this.appState.allMapLocations()?.find(l => 
        l.name.toLowerCase() === name.toLowerCase() && 
        l.locationType.toLowerCase() === (normalizedType?.toLowerCase() || '')
      );
      if (dbLocation) {
        return [parseFloat(dbLocation.latitude), parseFloat(dbLocation.longitude)];
      }
    }

    // Ultimate safety check to prevent "Invalid LatLng" crashes
    if (isNaN(x) || isNaN(y)) {
      console.warn('Map: Received NaN coordinates, falling back to center.');
      return [21.1458, 79.0882];
    }

    return [this.normalizeY(y), this.normalizeX(x, isGlobal)];
  }

  private calculateAvgScore(items: any[]): string {
    if (!items || items.length === 0) return '0';
    const total = items.reduce((sum, item) => sum + (item.score || 0), 0);
    return Math.round(total / items.length).toString();
  }

  // Helper to normalize Y coordinate (Latitude)
  private normalizeY(y: number): number {
    // If y is the "India Center" fallback (50), return real India center latitude
    if (y === 50) {
      return 20.5937;
    }
    // Otherwise, treat y as Latitude
    return y;
  }

  // Helper to normalize X coordinate (Longitude)
  private normalizeX(x: number, isGlobal: boolean): number {
    // If x is the "India Center" fallback (50) and not global, return real India center longitude
    if (x === 50 && !isGlobal) {
      return 78.9629;
    }
    // Otherwise, treat x as Longitude
    return x;
  }

  private getPixelPosition(lat: number, lng: number) {
    if (!this.map) return { x: 0, y: 0 };
    const point = this.map.latLngToContainerPoint([lat, lng]);
    return { x: point.x, y: point.y };
  }

  setMapLayout(style: 'Street' | 'Satellite') {
    this.mapStyle.set(style);
    this.updateMapStyle();
    try {
      this.map?.invalidateSize();
    } catch (e) {}
  }

  setOverlay(overlay: 'Clusters' | 'Heatmap') {
    this.appState.setMapOverlay(overlay);
  }

  refreshMap() {
    if (!this.map) return;
    this.isProgrammaticZoom = true;
    this.map.setView([20.5937, 78.9629], 4);
    this.appState.setViewMode('National');
    this.selectedCluster.set(null);
    this.selectedUser.set(null);
    this.appState.setMapOverlay('Clusters');
  }

  zoomIn() {
    this.map?.zoomIn();
  }
  zoomOut() {
    this.map?.zoomOut();
  }

  zoomToCluster() {
    const cluster = this.selectedCluster();
    if (this.map && cluster) {
      this.isProgrammaticZoom = true;
      if (cluster.type === 'National') {
        this.appState.setViewMode('National');
        this.appState.updateFilter('state', 'All States');
        this.appState.updateFilter('district', null);
      } else if (cluster.type === 'State') {
        this.appState.setViewMode('State');
        this.appState.updateFilter('state', cluster.name);
        this.appState.updateFilter('district', null);
      } else if (cluster.type === 'District') {
        this.appState.setViewMode('District');
        this.appState.updateFilter('state', cluster.state || 'All States');
        this.appState.updateFilter('district', cluster.name);
      }

      const nextZoom =
        cluster.type === 'National' ? 5 : cluster.type === 'State' ? 7 : 10;
      this.map.setView([cluster.lat, cluster.lng], nextZoom);
      setTimeout(() => this.selectedCluster.set(null), 600);
    }
  }

  closeUserPopup() {
    this.selectedUser.set(null);
  }

  handleContact(user: any) {
    if (user && (user.email || user.contactEmail)) {
      const email = user.email || user.contactEmail;
      try {
        window.open(`mailto:${email}`, '_blank');
      } catch (e) {}
    } else {
      this.appState.selectCandidate(user);
    }
  }

  handleProfile(user: any) {
    this.appState.selectCandidate(user);
    this.appState.setMainView('Map');
    this.appState.setViewMode('Individual');
  }
}
