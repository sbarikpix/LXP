import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationInterestsComponent } from './organization-interests.component';

describe('OrganizationInterestsComponent', () => {
  let component: OrganizationInterestsComponent;
  let fixture: ComponentFixture<OrganizationInterestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationInterestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationInterestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
