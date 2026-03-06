import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSkillDialogComponent } from './add-skill-dialog.component';

describe('AddSkillDialogComponent', () => {
  let component: AddSkillDialogComponent;
  let fixture: ComponentFixture<AddSkillDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddSkillDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSkillDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
