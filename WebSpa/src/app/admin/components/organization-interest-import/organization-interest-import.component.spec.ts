import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationInterestImportComponent } from './organization-interest-import.component';

describe('OrganizationInterestImportComponent', () => {
  let component: OrganizationInterestImportComponent;
  let fixture: ComponentFixture<OrganizationInterestImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationInterestImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationInterestImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
