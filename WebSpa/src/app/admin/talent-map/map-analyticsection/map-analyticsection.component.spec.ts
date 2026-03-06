import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapAnalyticsectionComponent } from './map-analyticsection.component';

describe('MapAnalyticsectionComponent', () => {
  let component: MapAnalyticsectionComponent;
  let fixture: ComponentFixture<MapAnalyticsectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapAnalyticsectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapAnalyticsectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
