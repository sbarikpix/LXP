import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationSkillImportComponent } from './organization-skill-import.component';

describe('OrganizationSkillImportComponent', () => {
  let component: OrganizationSkillImportComponent;
  let fixture: ComponentFixture<OrganizationSkillImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationSkillImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationSkillImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
