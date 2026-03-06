import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillsViewComponent } from './skills-view.component';

describe('SkillsViewComponent', () => {
  let component: SkillsViewComponent;
  let fixture: ComponentFixture<SkillsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkillsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
