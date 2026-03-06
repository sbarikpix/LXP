import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningjourneyComponent } from './learningjourney.component';

describe('LearningjourneyComponent', () => {
  let component: LearningjourneyComponent;
  let fixture: ComponentFixture<LearningjourneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LearningjourneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningjourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
