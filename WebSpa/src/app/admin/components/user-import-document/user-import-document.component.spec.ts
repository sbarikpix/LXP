import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserImportDocumentComponent } from './user-import-document.component';

describe('UserImportDocumentComponent', () => {
  let component: UserImportDocumentComponent;
  let fixture: ComponentFixture<UserImportDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserImportDocumentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserImportDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
