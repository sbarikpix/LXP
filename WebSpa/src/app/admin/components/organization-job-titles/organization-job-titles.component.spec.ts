import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationJobTitlesComponent } from './organization-job-titles.component';

describe('OrganizationJobTitlesComponent', () => {
  let component: OrganizationJobTitlesComponent;
  let fixture: ComponentFixture<OrganizationJobTitlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationJobTitlesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationJobTitlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
