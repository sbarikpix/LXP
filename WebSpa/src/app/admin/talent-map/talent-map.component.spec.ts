import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalentMapComponent } from './talent-map.component';

describe('SkillscapeAtlasComponent', () => {
  let component: TalentMapComponent;
  let fixture: ComponentFixture<TalentMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TalentMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TalentMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
