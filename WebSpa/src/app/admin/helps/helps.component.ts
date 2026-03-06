import { Component, OnInit } from '@angular/core';

interface HelpTopic {
  title: string;
  subtitle?: string;
  sections: {
    heading?: string;
    body: string;
    videoUrl?: string;
    faqs?: { q?: string; a?: string; open?: boolean }[];
  }[];
}

@Component({
  selector: 'app-helps',
  templateUrl: './helps.component.html',
  styleUrls: ['./helps.component.scss'],
})
export class HelpsComponent implements OnInit {
  topicsCollapsed = false;
  selectedTopicIndex = 0;
  searchTerm = '';

  topics: HelpTopic[] = [
    {
      title: 'NOVO Platform Overview',
      subtitle: 'Introduction to NOVO features and capabilities',
      sections: [
        {
          body: 'NOVO is a comprehensive platform designed to streamline organization management, user engagement, and learning experiences. This section provides an overview of its key features and functionalities.',
          videoUrl:
            'https://chasmadevstore.blob.core.windows.net/chasmanovo/help/Overview/Novo_LMS_Overview.mp4',
        },
      ],
    },
    {
      title: 'Getting Started',
      subtitle: 'How to set up your account and first steps',
      sections: [
        {
          heading: 'Overview',
          body: 'Quick start guide to get you started...',
        },
        {
          heading: 'FAQs',
          body: '',
          faqs: [
            {
              q: 'How do I reset my password?',
              a: 'Go to profile > security and choose reset.',
            },
            {
              q: 'How do I change my email?',
              a: 'Contact support to update your email.',
            },
          ],
        },
      ],
    },
    {
      title: 'Profile & Avatar',
      subtitle: 'Manage profile and avatar image',
      sections: [
        {
          heading: 'Upload Avatar',
          body: 'You can upload a profile image from the profile page. Supported formats: PNG, JPG.',
        },
        {
          heading: 'Initials Avatar',
          body: 'If no image is present initials are shown.',
        },
      ],
    },
    {
      title: 'Billing',
      subtitle: 'Manage subscriptions and invoices',
      sections: [
        { body: 'Billing related information and how to download invoices.' },
      ],
    },
  ];

  filteredTopics: HelpTopic[] = [];

  constructor() {}

  ngOnInit(): void {
    this.filteredTopics = [...this.topics];
  }

  selectTopic(index: number) {
    this.selectedTopicIndex = index ? index : 0;
  }

  get selectedTopic(): HelpTopic {
    return this.selectedTopicIndex >= 0
      ? this.filteredTopics[this.selectedTopicIndex]
      : this.filteredTopics[0];
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = (value || '').trim().toLowerCase();
    this.filteredTopics = this.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(this.searchTerm) ||
        (t.subtitle || '').toLowerCase().includes(this.searchTerm) ||
        t.sections.some(
          (s) =>
            (s.heading || '').toLowerCase().includes(this.searchTerm) ||
            s.body.toLowerCase().includes(this.searchTerm)
        )
    );
    // reset selection if current index out of bounds
    if (this.filteredTopics.length === 0) this.selectedTopicIndex = -1;
    else if (this.selectedTopicIndex >= this.filteredTopics.length)
      this.selectedTopicIndex = 0;
  }

  contactSupport() {
    // navigate or open modal -- implement according to app routing/modal pattern
    window.alert('Contact support: support@yourcompany.com');
  }
}
