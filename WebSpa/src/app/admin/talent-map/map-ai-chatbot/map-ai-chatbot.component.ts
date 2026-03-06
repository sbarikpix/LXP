import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  effect,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MapService } from '@app/shared/services/map.service';
import { MapDataService } from '@app/shared/services/map-data.service';

@Component({
  selector: 'app-map-ai-chatbot',
  standalone: false,
  templateUrl: './map-ai-chatbot.component.html',
  styleUrls: ['./map-ai-chatbot.component.scss'],
})
export class MapAiChatbotComponent implements AfterViewChecked, OnChanges {
  @Input() selectedSkill: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<any>();

  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private appState = inject(MapService);
  private dataService = inject(MapDataService);

  // Data Sources
  data = this.appState.filteredData;
  allData = this.dataService.candidates;

  // State
  mode = signal<'chat' | 'insights'>('chat');
  messages = signal<any[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your AI Talent & Career Advisor. I can filter candidates, search for specific people, or provide market insights. Try asking 'Filter by React skill', 'Go to Analytics', or 'Show candidates in Kerala'.",
    },
  ]);
  input = signal('');
  isTyping = signal(false);
  insightIndex = signal(0);

  // Computed
  knownSkills = computed(() => [
    ...new Set(this.dataService.candidates.map((d) => d.skill.toLowerCase())),
  ]);
  knownStates = computed(() => [
    ...new Set(this.dataService.candidates.map((d) => d.state.toLowerCase())),
  ]);
  knownDistricts = computed(() => [
    ...new Set(
      this.dataService.candidates
        .filter((d) => d.district)
        .map((d) => d.district!.toLowerCase()),
    ),
  ]);

  insightsData = computed(() => {
    const d = this.data();
    if (!d.length) return null;

    const highRiskCount = d.filter((x) => x.risk === 'High').length;
    const total = d.length;

    const skillCounts: any = {};
    d.forEach((x) => (skillCounts[x.skill] = (skillCounts[x.skill] || 0) + 1));
    const topSupply = Object.entries(skillCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3);

    const mentorCount = d.filter((x) => x.mentor).length;
    const avgExp = (d.reduce((acc, curr) => acc + curr.exp, 0) / total).toFixed(
      1,
    );

    return { highRiskCount, total, topSupply, mentorCount, avgExp };
  });

  private intervalId: any;

  constructor() {
    effect(() => {
      if (this.mode() === 'insights') {
        this.intervalId = setInterval(() => {
          this.insightIndex.update((i) => (i + 1) % 4);
        }, 5000);
      } else {
        clearInterval(this.intervalId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedSkill'] && this.selectedSkill) {
      this.mode.set('chat');
      const newMsg = {
        role: 'assistant',
        content: `I see you're interested in ${this.selectedSkill}. Here are some quick insights:\n\n• Demand for ${this.selectedSkill} has grown by 15% this quarter.\n• Suggested action: Initiate retention program.`,
      };
      this.messages.update((msgs) => [...msgs, newMsg]);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  suggestedQuestions = [
    'Go to Analytics',
    'Show candidates in Kerala',
    'Filter by React',
    'Show high risk candidates',
    'Analyze my learning path',
    'Create a 6-month career plan',
    "Explain 'Event Loop'",
  ];

  handleSend() {
    if (!this.input().trim()) return;

    const userMsg = { role: 'user', content: this.input() };
    this.messages.update((prev) => [...prev, userMsg]);
    const txt = this.input();
    this.input.set('');
    this.isTyping.set(true);

    setTimeout(() => {
      const responseText = this.processCommand(txt);
      this.messages.update((prev) => [
        ...prev,
        { role: 'assistant', content: responseText },
      ]);
      this.isTyping.set(false);
    }, 800);
  }

  processText(text: string) {
    this.input.set(text);
    this.handleSend();
  }

  processCommand(text: string) {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('analytics') ||
      lowerText.includes('charts') ||
      lowerText.includes('stats')
    ) {
      this.action.emit({ type: 'SWITCH_VIEW', payload: 'Analytics' });
      return 'Switching to Analytics view.';
    }
    if (lowerText.includes('map') || lowerText.includes('geography')) {
      this.action.emit({ type: 'SWITCH_VIEW', payload: 'Map' });
      return 'Switching to Map view.';
    }

    const searchMatch = lowerText.match(
      /(?:find|search|where is|locate)\s+([a-z\s]+)/i,
    );
    if (searchMatch && searchMatch[1]) {
      const nameQuery = searchMatch[1].trim();
      const isSkill = this.knownSkills().includes(nameQuery);
      const isState = this.knownStates().includes(nameQuery);

      if (!isSkill && !isState) {
        const user = this.allData.find(
          (u) => u.name.toLowerCase() === nameQuery,
        );
        if (user) {
          this.action.emit({ type: 'SELECT_USER', payload: nameQuery });
          return `I found ${user.name} in ${user.district}, ${user.state}. I've centered the map on their location.`;
        } else {
          return `I couldn't find anyone named "${nameQuery}". Try another name.`;
        }
      }
    }

    if (lowerText.includes('reset') || lowerText.includes('clear filters')) {
      this.action.emit({ type: 'RESET' });
      return "I've reset all filters and map views.";
    }
    if (lowerText.includes('high risk')) {
      this.action.emit({ type: 'FILTER', payload: { risk: 'High' } });
      return 'Filtering display for High Risk candidates.';
    }
    if (lowerText.includes('med risk')) {
      this.action.emit({ type: 'FILTER', payload: { risk: 'Medium' } });
      return 'Filtering display for Medium Risk candidates.';
    }
    if (lowerText.includes('low risk')) {
      this.action.emit({ type: 'FILTER', payload: { risk: 'Low' } });
      return 'Filtering display for Low Risk candidates.';
    }
    if (lowerText.includes('mentor')) {
      this.action.emit({ type: 'FILTER', payload: { mentor: true } });
      return 'Showing only active mentors.';
    }

    const matchedSkill = this.knownSkills().find((skill) =>
      lowerText.includes(skill),
    );
    if (matchedSkill) {
      const originalSkill =
        this.dataService.candidates.find((d) => d.skill.toLowerCase() === matchedSkill)
          ?.skill || matchedSkill;
      this.action.emit({ type: 'FILTER', payload: { skill: originalSkill } });
      return `Filtering candidates with skill: **${originalSkill}**.`;
    }

    const matchedState = this.knownStates().find((state) =>
      lowerText.includes(state),
    );
    if (matchedState) {
      const originalState =
        this.dataService.candidates.find((d) => d.state.toLowerCase() === matchedState)
          ?.state || matchedState;
      this.action.emit({
        type: 'FILTER',
        payload: { state: originalState, district: null },
      });
      return `Showing candidates in **${originalState}**.`;
    }

    const matchedDistrict = this.knownDistricts().find((dist) =>
      lowerText.includes(dist),
    );
    if (matchedDistrict) {
      const originalDistrictData = this.dataService.candidates.find(
        (d) => d.district?.toLowerCase() === matchedDistrict,
      );
      if (originalDistrictData) {
        this.action.emit({
          type: 'FILTER',
          payload: {
            state: originalDistrictData.state,
            district: originalDistrictData.district,
          },
        });
        return `Showing candidates in **${originalDistrictData.district}**, ${originalDistrictData.state}.`;
      }
    }

    if (lowerText.includes('learning path') || lowerText.includes('improve')) {
      return "Based on your profile, I recommend focusing on **System Design** and **Cloud Architecture**. Your coding skills are strong, but moving to a Senior role requires broader architectural understanding.";
    }
    
    return "I can help with Career Planning, Learning Support, Productivity, or Map filtering. Try asking: 'Analyze my learning path', 'Show React experts', 'Go to Analytics', or 'Show candidates in Kerala'.";
  }
}
