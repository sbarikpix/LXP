import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowlearningjourneyComponent } from './showlearningjourney.component';

describe('ShowlearningjourneyComponent', () => {
  let component: ShowlearningjourneyComponent;
  let fixture: ComponentFixture<ShowlearningjourneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowlearningjourneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowlearningjourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
