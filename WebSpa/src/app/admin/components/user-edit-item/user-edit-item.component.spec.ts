import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEditItemComponent } from './user-edit-item.component';

describe('UserEditItemComponent', () => {
  let component: UserEditItemComponent;
  let fixture: ComponentFixture<UserEditItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserEditItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserEditItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
