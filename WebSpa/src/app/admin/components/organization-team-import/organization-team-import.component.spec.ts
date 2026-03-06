import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationTeamImportComponent } from './organization-team-import.component';

describe('OrganizationTeamImportComponent', () => {
  let component: OrganizationTeamImportComponent;
  let fixture: ComponentFixture<OrganizationTeamImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationTeamImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationTeamImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
