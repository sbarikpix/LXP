import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignSkillDialogComponent } from './assign-skill-dialog.component';

describe('AssignSkillDialogComponent', () => {
  let component: AssignSkillDialogComponent;
  let fixture: ComponentFixture<AssignSkillDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssignSkillDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignSkillDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
