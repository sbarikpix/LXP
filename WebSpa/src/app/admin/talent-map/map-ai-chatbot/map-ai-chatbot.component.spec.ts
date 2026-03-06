import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapAiChatbotComponent } from './map-ai-chatbot.component';

describe('MapAiChatbotComponent', () => {
  let component: MapAiChatbotComponent;
  let fixture: ComponentFixture<MapAiChatbotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapAiChatbotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapAiChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
