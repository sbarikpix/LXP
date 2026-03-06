import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApplicationUser, learningJourneyResponse } from '@app/shared/models/commonmodel';
import { LearningjourneyService } from '@app/shared/services/learningjourney.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-manageroster-popup',
  templateUrl: './manageroster-popup.component.html',
  styleUrl: './manageroster-popup.component.scss'
})
export class ManagerosterPopupComponent implements OnInit {
  learningjourneyId: any;
  loggedInUser!: ApplicationUser;
  learningusers: learningJourneyResponse[] = [];

  constructor(public dialogRef: MatDialogRef<ManagerosterPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private learningservice: LearningjourneyService) {
    this.learningjourneyId = data.learningjourneyId
  }

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }

    if (this.learningjourneyId) {
      this.getlearningjourneydetails(this.learningjourneyId);
    }
  }

  getlearningjourneydetails(learningjourneyId: any) {
    this.learningservice.getalllearningjourneys('', '', learningjourneyId).subscribe({
      next: (res) => {
        this.learningusers = res;
      },
      error: (err) => {

      }
    })
  }

  onClose() {
    this.dialogRef.close();
  }
}
