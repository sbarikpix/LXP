import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationSkillsComponent } from './organization-skills.component';

describe('OrganizationSkillsComponent', () => {
  let component: OrganizationSkillsComponent;
  let fixture: ComponentFixture<OrganizationSkillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationSkillsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationSkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
