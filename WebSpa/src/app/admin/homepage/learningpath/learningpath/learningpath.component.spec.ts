import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningpathComponent } from './learningpath.component';

describe('LearningpathComponent', () => {
  let component: LearningpathComponent;
  let fixture: ComponentFixture<LearningpathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LearningpathComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningpathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
