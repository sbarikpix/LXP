import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseviewpageComponent } from './courseviewpage.component';

describe('CourseviewpageComponent', () => {
  let component: CourseviewpageComponent;
  let fixture: ComponentFixture<CourseviewpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourseviewpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseviewpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
