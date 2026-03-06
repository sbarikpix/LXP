import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadUsercontentComponent } from './upload-usercontent.component';

describe('UploadUsercontentComponent', () => {
  let component: UploadUsercontentComponent;
  let fixture: ComponentFixture<UploadUsercontentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadUsercontentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadUsercontentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
