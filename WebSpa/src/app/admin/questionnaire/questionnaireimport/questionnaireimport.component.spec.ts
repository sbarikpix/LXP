import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireimportComponent } from './questionnaireimport.component';

describe('QuestionnaireimportComponent', () => {
  let component: QuestionnaireimportComponent;
  let fixture: ComponentFixture<QuestionnaireimportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuestionnaireimportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionnaireimportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
