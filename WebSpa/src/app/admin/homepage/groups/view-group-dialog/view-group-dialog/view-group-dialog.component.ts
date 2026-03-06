import { Platform } from '@angular/cdk/platform';
import { Component, Inject, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationUser, GroupCommand, GroupRuleMappingDto } from '@app/shared/models/commonmodel';
import { GroupsService } from '@app/shared/services/groups.service';

interface DisplayRule {
  text: string;
  values: string[];
  ruleType: string;
  nextOp: string | null;
  targetOperator?: string;
}


@Component({
  selector: 'app-view-group-dialog',
  templateUrl: './view-group-dialog.component.html',
  styleUrl: './view-group-dialog.component.scss'
})
export class ViewGroupDialogComponent {
  loggedInUser!: ApplicationUser;
  groupList: GroupCommand = {} as GroupCommand;
  loading: boolean = false;
  isLoading: boolean = false;
  totalusers: number = 0;
  activerecords: number = 0;
  Inactiveusers: number = 0;
  totalRecords: number = 0;
  isMobile: boolean = false;

  displayRules: DisplayRule[] = [];
   dataSource: ApplicationUser[] = [];
   filteredUsers  :ApplicationUser[]=[];
  visibleRules: DisplayRule[] = [];
  rulePairs: GroupRuleMappingDto[][] = [];
  visiblePairs: GroupRuleMappingDto[][] = [];
  pageSize = 10;
  pageStart = 0;
  groupId: string | null = null;
  isTargetedOperator: boolean = false;
  excludedRuleTypes = ['Group By Role', 'Group By Organization', "Group By User's", 'Group By Location'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private groupService: GroupsService, private route: ActivatedRoute,
    private router: Router,
    private platform: Platform
  ) { }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (storedUser) {
      this.loggedInUser = JSON.parse(storedUser);
    }
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    const userId=this.route.snapshot.paramMap.get('id');
    if(userId!==this.loggedInUser.applicationUserId){
      this.router.navigate(['/unauthorized']);
    }
  if (this.groupId) {
    this.getGroups(this.groupId);
  }
      if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }


  getGroups(groupId: string) {
    this.isLoading = true;
    this.groupService.getGroupById(groupId).subscribe({
      next: (res: any) => {
        this.groupList = {
          groupName: res.groupName || '',
          description: res.description || '',
          createdBy: res.createdBy || '',
          applicationUsers: res.groupUser,
          ruleMappings: (res.rules ?? []).map((rule: any) => ({
            groupRuleId: rule.groupRuleId || '',
            groupRuleMappingId: rule.groupRuleMappingId || '',
            operator: rule.operator || '',
            targetsOperator:rule.targetsOperator || '',
            targetedValues: (rule.targetedValues ?? []).map((tv: any) => ({
              targetValueId: tv.targetValueId,
              value: tv.value
            })),
            ruleType: rule.ruleType || '',
          }))
        };

        this.dataSource = res.groupUser; // Assuming groupUser contains the users
        this.filteredUsers = [...this.dataSource]; // Initialize filteredUsers with all users
        this.totalusers = this.filteredUsers.length;
        this.activerecords = this.filteredUsers.filter(user => user.isActive).length;
        this.Inactiveusers = this.filteredUsers.filter(user => !user.isActive).length;

        this.displayRules = this.formatRuleChain(this.groupList.ruleMappings);
        this.updatePage(0);
        if (this.paginator) this.paginator.firstPage();

        this.totalRecords = res.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching groups:', err);
        this.isLoading = false;
      }
    });
  }

  private formatRuleChain(src: GroupRuleMappingDto[]): DisplayRule[] {
    const out: DisplayRule[] = [];

    const sorted = [...src].sort((a, b) => {
      const aHasOp = !!a.operator;
      const bHasOp = !!b.operator;
      return (aHasOp === bHasOp) ? 0 : (aHasOp ? 1 : -1);
    });

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const nxt = sorted[i + 1];
    
      out.push({
        text: r.ruleType || '',
        ruleType: r.ruleType || '',
        values: (r.targetedValues ?? []).map(tv => tv.value),
        nextOp: nxt?.operator || null,
        targetOperator: r.targetsOperator
      });
    }
  
    return out;
  }

  private getFormattedRuleText(rule: GroupRuleMappingDto): string {
    const values = (rule.targetedValues ?? []).map(tv => tv.value);
    const valueText: string = values.slice(0, 2).join(', ') + (values.length > 2 ? ', +' : '');
    return `${rule.ruleType} : ${valueText}`;
  }

  onPage(e: PageEvent): void { this.updatePage(e.pageIndex); }

  private updatePage(idx: number): void {
    this.pageStart = idx * this.pageSize;          // 
    const end = this.pageStart + this.pageSize;
    this.visibleRules = this.displayRules.slice(this.pageStart, end);
  }


  back() {
    const userId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
  
    if (userId) {
      const org = this.route.snapshot.paramMap.get('organisationUniqueName') || this.route.parent?.snapshot.paramMap.get('organisationUniqueName');
      const role = this.route.snapshot.paramMap.get('role') || this.route.parent?.snapshot.paramMap.get('role');
  
      if (org && role) {
        this.router.navigate(['/', org, role, 'users', userId, 'groups']);
        return;
      }

      this.router.navigate(['/users', userId, 'groups']);
    } else {
      this.router.navigate(['/']);
    }
  }

  //Filtering Users Based upon search
    userFilter(event: any) {
    const value = event.target.value.toLowerCase();
    if (value) {
      this.filteredUsers = this.dataSource.filter((user) =>
        (user.firstName + ' ' + user.lastName + user.email).toLowerCase().includes(value)
      );
      this.totalusers = this.filteredUsers.length;
      this.activerecords = this.filteredUsers.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveusers = this.filteredUsers.filter(
        (user) => !user.isActive
      ).length;
    } else {
      this.filteredUsers = this.dataSource;
      this.totalusers = this.filteredUsers.length;
      this.activerecords = this.filteredUsers.filter(
        (user) => user.isActive
      ).length;
      this.Inactiveusers = this.filteredUsers.filter(
        (user) => !user.isActive
      ).length;
    }
  }
}


