import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationsOverviewComponent } from './organizations-overview.component';

describe('OrganizationsOverviewComponent', () => {
  let component: OrganizationsOverviewComponent;
  let fixture: ComponentFixture<OrganizationsOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationsOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
