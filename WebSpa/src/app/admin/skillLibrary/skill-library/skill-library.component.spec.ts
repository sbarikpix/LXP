import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillLibraryComponent } from './skill-library.component';

describe('SkillLibraryComponent', () => {
  let component: SkillLibraryComponent;
  let fixture: ComponentFixture<SkillLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkillLibraryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
