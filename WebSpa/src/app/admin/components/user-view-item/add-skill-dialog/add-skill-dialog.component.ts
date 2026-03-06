import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { SkillService } from '@app/shared/services/skill.service';
import { Skill } from '@app/shared/models/commonmodel';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-add-skill-dialog',
  templateUrl: './add-skill-dialog.component.html',
  styleUrl: './add-skill-dialog.component.scss',
})
export class AddSkillDialogComponent implements OnInit {
  skillsFormGroup = this.fb.group({
    skills: [this.data.skillnames || '', Validators.required],
    level: ['', Validators.required],
  });

  allSkills: Skill[] = [];
  filteredSkills!: Observable<Skill[]>;
  selectedSkills: Array<{ name: string; level: string; skillid: string }> = [];
  levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  loading: boolean = false;
  constructor(
    private fb: FormBuilder,
    private skillService: SkillService,
    private dialogRef: MatDialogRef<AddSkillDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.getAllOrgSkills();
  }

  getAllOrgSkills() {
    this.loading = true;
    this.skillService.getAllSkills(this.data.jobtitleId).subscribe({
      next: (res) => {
        this.allSkills = res;
        this.filteredSkills = this.skillsFormGroup
          .get('skills')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this.filterSkills(value || ''))
          );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      },
    });
    this.loading = false;
  }

  filterSkills(value: string): Skill[] {
    if (value === '') return [];
    const filterValue = value.toLowerCase();
    return this.allSkills.filter((skill) =>
      skill.name.toLowerCase().includes(filterValue)
    );
  }

  saveSkills(): void {
    const skill = this.skillsFormGroup.get('skills')?.value;
    const level = this.skillsFormGroup.get('level')?.value;
    if (skill && level && !this.selectedSkills.find((i) => i.name === skill)) {
      const skillId = this.allSkills.find(
        (x) => x.name === skill
      )?.chasmaNOVOSkillId;
      if (skillId) {
        this.selectedSkills.push({ name: skill, level, skillid: skillId });
      }
    }
    this.dialogRef.close(this.selectedSkills);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
