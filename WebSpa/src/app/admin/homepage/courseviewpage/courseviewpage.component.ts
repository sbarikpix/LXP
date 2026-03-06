import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesServicesService } from '@app/shared/services/courses-services.service';

@Component({
  selector: 'app-courseviewpage',
  templateUrl: './courseviewpage.component.html',
  styleUrl: './courseviewpage.component.scss',
})
export class CourseviewpageComponent implements OnInit {
  mainCourse: any;

  constructor(private router: Router, private courseStateService: CoursesServicesService,
    private location: Location,
    private title: Title,) { this.title.setTitle('Courses'); }

  ngOnInit(): void {
    this.mainCourse = this.courseStateService.getCourse();
    if (this.mainCourse && !Array.isArray(this.mainCourse)) {
      this.mainCourse = [this.mainCourse]; // Wrap single object in an array
    }

  }

  startcourse(cbtpath: any) {
    window.open(cbtpath, "_blank");
  }

  // recomendedCourse = [
  //   {
  //     image: '', // Replace with your image URL
  //     category: 'Java',
  //     title: 'Java',
  //     subtitle: 'Tutorial 1 - Introduction to Java',
  //     badge: 'Course',
  //     value: 12,
  //   },
  //   {
  //     image: '',
  //     category: 'Python',
  //     title: 'Python ',
  //     subtitle: 'Tutorial 1 - Introduction to Python',
  //     badge: 'Course',
  //     value: 50,
  //   },
  //   {
  //     image: '',
  //     category: 'Angular',
  //     title: 'Angular ',
  //     subtitle: 'Tutorial 1 - Introduction to Angular',
  //     badge: 'Course',
  //     value: 30,
  //   },
  //   {
  //     image: '',
  //     category: 'Html',
  //     title: 'HTML ',
  //     subtitle: 'Tutorial 1 - Introduction to HTML',
  //     badge: 'Course',
  //     value: 95,
  //   },
  //   {
  //     image: '',
  //     category: 'Java',
  //     title: 'Java',
  //     subtitle: 'Tutorial 1 - Introduction to Java',
  //     badge: 'Course',
  //     value: 56,
  //   },
  //   {
  //     image: '',
  //     category: 'Python',
  //     title: 'Python ',
  //     subtitle: 'Tutorial 1 - Introduction to Python',
  //     badge: 'Course',
  //     value: 60,
  //   },
  //   {
  //     image: '',
  //     category: 'Angular',
  //     title: 'Angular ',
  //     subtitle: 'Tutorial 1 - Introduction to Angular',
  //     badge: 'Course',
  //     value: 70,
  //   },
  //   {
  //     image: '',
  //     category: 'Html',
  //     title: 'HTML ',
  //     subtitle: 'Tutorial 1 - Introduction to HTML',
  //     badge: 'Course',
  //     value: 80,
  //   },
  // ];

  back() {
    this.location.back()
  }
}
