import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserContentviewComponent } from './user-contentview.component';

describe('UserContentviewComponent', () => {
  let component: UserContentviewComponent;
  let fixture: ComponentFixture<UserContentviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserContentviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserContentviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
