import { Platform } from '@angular/cdk/platform';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserBadge } from '@app/shared/models/commonmodel';
import { UserBadgeServiceService } from '@app/shared/services/userBadgeService.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-badge',
  templateUrl: './view-badge.component.html',
  styleUrl: './view-badge.component.scss'
})
export class ViewBadgeComponent implements OnInit {
  userBadgeData: UserBadge[] = [];
  userId: any;
  isMobile: boolean = false;
  userName: any;

  constructor(private userBadge: UserBadgeServiceService, private route: ActivatedRoute,
    private router: Router, private platform: Platform) {

  }
  ngOnInit(): void {
    const segments = this.route.snapshot.url;

    let currentPath = segments.map((segment) => segment.path).join('/');
    // Fallback: If currentPath is empty, use this.router.url
    if (!currentPath) {
      currentPath = this.router.url.slice(1);
      this.userId = currentPath.split('/')[2];
    }

    if (this.userId) {
      this.getUserbadges(this.userId);
    }
    this.isMobile = this.platform.ANDROID || this.platform.IOS;
  }

  getUserbadges(userId: any) {
    this.userBadge.getUserBadges(userId).subscribe({
      next: (res) => {
        this.userBadgeData = res;
        this.userName = res[0].userName;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  SignIn() {
    const url = environment.redirectUri;
    window.open(url, '_blank');
  }
  // formatDate(dateString: string): string {
  //   return new Date(dateString).toLocaleDateString();
  // }
}
