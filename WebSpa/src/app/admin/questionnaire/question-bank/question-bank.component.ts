import { Component, OnInit } from '@angular/core';
import { AppConstants } from '@app/shared/App-Constants';
import { ApplicationUser, QuestionBankModel, SkillLevel } from '@app/shared/models/commonmodel';
import { questionService } from '@app/shared/services/question.service';
import { SkillLevelService } from '@app/shared/services/skill-level.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-question-bank',
  templateUrl: './question-bank.component.html',
  styleUrl: './question-bank.component.scss'
})
export class QuestionBankComponent implements OnInit {

  loggedInUser!: ApplicationUser;
  questionBankList:QuestionBankModel[]=[];
  searchText:string='';
  titleFilter: string = '';
  levelFilter: string = '';

  constructor(private question:questionService,
              private levels:SkillLevelService,
            private router:Router,
          private dialog:MatDialog) { }
  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      const emulateuserData = localStorage.getItem('emulatedUser');
      if (emulateuserData) {
        this.loggedInUser = JSON.parse(emulateuserData);
      } else if (storedUser) {
        this.loggedInUser = JSON.parse(storedUser);
      }
    }
    this.getQuestionSkills();
  }

  

  getQuestionSkills() {
    this.question.getQuestionBanks(this.loggedInUser.organizationId).subscribe({
      next: (res: any) => {
        this.questionBankList = res;        
      },
      error: (err) => {
        console.error('Error fetching skills:', err);
      }
    });
  }


  filteredQuestionBanks(): QuestionBankModel[] {
    return this.questionBankList.filter(qb => {
      const matchTitle = this.titleFilter ? qb.title.toLowerCase().includes(this.titleFilter.toLowerCase()) : true;
      const matchLevel = this.levelFilter ? qb.levelName?.toLowerCase().includes(this.levelFilter.toLowerCase()) : true;
      return matchTitle && matchLevel;
    });
  }

 

  back(){
    this.router.navigate([this.loggedInUser.organizationName,this.loggedInUser.roleName,'questionnaire']);
  }

  

}
