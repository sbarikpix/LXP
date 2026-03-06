import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapBottompanelComponent } from './map-bottompanel.component';

describe('MapBottompanelComponent', () => {
  let component: MapBottompanelComponent;
  let fixture: ComponentFixture<MapBottompanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapBottompanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapBottompanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
