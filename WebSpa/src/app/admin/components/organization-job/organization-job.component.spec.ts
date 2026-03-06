import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationJobComponent } from './organization-job.component';

describe('OrganizationJobComponent', () => {
  let component: OrganizationJobComponent;
  let fixture: ComponentFixture<OrganizationJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationJobComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
