import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerosterPopupComponent } from './manageroster-popup.component';

describe('ManagerosterPopupComponent', () => {
  let component: ManagerosterPopupComponent;
  let fixture: ComponentFixture<ManagerosterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManagerosterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerosterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
