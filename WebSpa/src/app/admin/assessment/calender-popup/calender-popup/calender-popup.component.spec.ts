import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderPopupComponent } from './calender-popup.component';

describe('CalenderPopupComponent', () => {
  let component: CalenderPopupComponent;
  let fixture: ComponentFixture<CalenderPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalenderPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalenderPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
