import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MapService } from '@app/shared/services/map.service';

Chart.register(...registerables);

@Component({
  selector: 'app-map-analyticsection',
  standalone: false,
  templateUrl: './map-analyticsection.component.html',
  styleUrls: ['./map-analyticsection.component.scss'],
})
export class MapAnalyticsectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('radarChart') radarChartRef!: ElementRef;
  @ViewChild('polarChart') polarChartRef!: ElementRef;
  @ViewChild('horizontalBarChart') horizontalBarChartRef!: ElementRef;

  private appState = inject(MapService);
  data = this.appState.filteredData;
  filters = this.appState.filters;

  private charts: { [key: string]: Chart } = {};

  constructor() {
    effect(() => {
      const d = this.data();
      this.updateCharts(d);
    });
  }

  ngAfterViewInit() {
    this.updateCharts(this.data());
  }

  ngOnDestroy() {
    Object.values(this.charts).forEach((c) => c.destroy());
  }

  private updateCharts(data: any[]) {
    if (!this.barChartRef) return;

    Object.values(this.charts).forEach((c) => c.destroy());
    this.charts = {};

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';
    const brandColor = '#fc5723';

    // 1. Skill Distribution
    const skillCounts: any = {};
    data.forEach((d) => {
      skillCounts[d.skill] = (skillCounts[d.skill] || 0) + 1;
    });
    const sortedSkills = Object.entries(skillCounts)
      .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
      .slice(0, 8);

    this.charts['bar'] = new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: sortedSkills.map((s: any) => s[0]),
        datasets: [
          {
            label: 'Candidates',
            data: sortedSkills.map((s: any) => s[1]),
            backgroundColor: brandColor,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top Skills Supply' },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });

    // 2. Risk Distribution
    const riskCounts: any = { Low: 0, Medium: 0, High: 0 };
    data.forEach((d) => {
      if (riskCounts[d.risk] !== undefined) riskCounts[d.risk]++;
    });

    this.charts['doughnut'] = new Chart(this.doughnutChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [
          {
            data: [riskCounts.Low, riskCounts.Medium, riskCounts.High],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          title: { display: true, text: 'Attrition Risk Profile' },
        },
        cutout: '65%',
      },
    });

    // 3. Experience Distribution
    const expRanges: any = {
      '0-2 Yrs': 0,
      '3-5 Yrs': 0,
      '6-10 Yrs': 0,
      '10+ Yrs': 0,
    };
    data.forEach((d) => {
      if (d.exp <= 2) expRanges['0-2 Yrs']++;
      else if (d.exp <= 5) expRanges['3-5 Yrs']++;
      else if (d.exp <= 10) expRanges['6-10 Yrs']++;
      else expRanges['10+ Yrs']++;
    });

    this.charts['line'] = new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: Object.keys(expRanges),
        datasets: [
          {
            label: 'Talent Pool',
            data: Object.values(expRanges),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Experience Distribution' },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });

    // 4. Job Title Radar
    const jobTitleCounts: any = {};
    data.forEach((d) => {
      jobTitleCounts[d.jobTitle] = (jobTitleCounts[d.jobTitle] || 0) + 1;
    });
    this.charts['radar'] = new Chart(this.radarChartRef.nativeElement, {
      type: 'radar',
      data: {
        labels: Object.keys(jobTitleCounts),
        datasets: [
          {
            label: 'Job Titles',
            data: Object.values(jobTitleCounts),
            fill: true,
            backgroundColor: 'rgba(252, 87, 35, 0.2)',
            borderColor: '#fc5723',
            pointBackgroundColor: '#fc5723',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#fc5723',
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Job Title Balance' },
        },
      },
    });

    // 5. Mentor vs Non-Mentor Polar Area
    this.charts['polar'] = new Chart(this.polarChartRef.nativeElement, {
      type: 'polarArea',
      data: {
        labels: ['Mentors', 'Learners'],
        datasets: [
          {
            label: 'Mentorship',
            data: [
              data.filter((d) => d.mentor).length,
              data.filter((d) => !d.mentor).length,
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(59, 130, 246, 0.7)',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Mentorship Ratio' },
        },
      },
    });

    // 6. Top Districts
    const distCounts: any = {};
    data
      .filter((d) => !d.isGlobal)
      .forEach((d) => {
        distCounts[d.district] = (distCounts[d.district] || 0) + 1;
      });
    const sortedDist = Object.entries(distCounts)
      .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);

    this.charts['horizontal'] = new Chart(
      this.horizontalBarChartRef.nativeElement,
      {
        type: 'bar',
        data: {
          labels: sortedDist.map((s: any) => s[0]),
          datasets: [
            {
              label: 'Candidates',
              data: sortedDist.map((s: any) => s[1]),
              backgroundColor: '#8b5cf6',
              borderRadius: 4,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Districts' },
          },
          scales: {
            x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            y: { grid: { display: false } },
          },
        },
      },
    );
  }
}
