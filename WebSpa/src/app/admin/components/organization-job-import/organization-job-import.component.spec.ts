import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationJobImportComponent } from './organization-job-import.component';

describe('OrganizationJobImportComponent', () => {
  let component: OrganizationJobImportComponent;
  let fixture: ComponentFixture<OrganizationJobImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationJobImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationJobImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
