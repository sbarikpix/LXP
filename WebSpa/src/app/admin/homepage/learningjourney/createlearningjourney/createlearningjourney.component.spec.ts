import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatelearningjourneyComponent } from './createlearningjourney.component';

describe('CreatelearningjourneyComponent', () => {
  let component: CreatelearningjourneyComponent;
  let fixture: ComponentFixture<CreatelearningjourneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatelearningjourneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatelearningjourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
