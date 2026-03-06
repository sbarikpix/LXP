import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApplicationUser,
  JobTitle,
  Skill,
  UpdateGroup,
} from '@app/shared/models/commonmodel';
import {
  GroupRuleMapping,
  GroupsService,
} from '@app/shared/services/groups.service';
import { JobTitleService } from '@app/shared/services/job-title.service';
import { OrganizationService } from '@app/shared/services/organization.service';
import { SkillService } from '@app/shared/services/skill.service';
import { UserService } from '@app/shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { RoleService } from '@app/shared/services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export function targetsOperatorRequiredForRuleTypes(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const ruleTypeControl = group.get('ruleType');
    const targetsOperatorControl = group.get('targetsOperator');

    if (!ruleTypeControl || !targetsOperatorControl) {
      return null;
    }

    const ruleType = ruleTypeControl.value;
    const targetsOperator = targetsOperatorControl.value;
    const requiredRuleTypes = [
      'Group By BeginnerSkill',
      'Group By AdvancedSkill',
      'Group By ExpertSkill',
      'Group By IntermediateSkill',
      'Group By Skills',
    ];

    if (requiredRuleTypes.includes(ruleType)) {
      if (
        !targetsOperator ||
        (Array.isArray(targetsOperator) && targetsOperator.length === 0) ||
        targetsOperator === ''
      ) {
        targetsOperatorControl.setErrors({ required: true });
        return { targetsOperatorRequired: true };
      } else {
        // Clear previous errors if valid
        if (targetsOperatorControl.hasError('required')) {
          targetsOperatorControl.updateValueAndValidity({
            onlySelf: true,
            emitEvent: false,
          });
          targetsOperatorControl.setErrors(null);
        }
        return null;
      }
    } else {
      // For other rule types no validation error on targetsOperator
      if (targetsOperatorControl.hasError('required')) {
        targetsOperatorControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: false,
        });
        targetsOperatorControl.setErrors(null);
      }
      return null;
    }
  };
}

@Component({
  selector: 'app-add-group-dialog',
  templateUrl: './add-group-dialog.component.html',
  styleUrl: './add-group-dialog.component.scss',
})
export class AddGroupDialogComponent implements OnInit {
  skillSearchControl = new FormControl('');
  jobSearchControl = new FormControl('');

  stateCtrl = new FormControl<any[]>([]);
  selectedCountries: any[] = [];
  selectedStates: any[] = [];

  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  isLoading: boolean = false;
  private loading = false;
  allSkills: any[] = [];
  filteredSkills = new BehaviorSubject<Skill[]>([]);
  filteredJobs = new BehaviorSubject<JobTitle[]>([]);
  filteredCountries: any[] = [];
  public skillPerPage = 10;
  groupForm: FormGroup;
  groupTypes: any;
  isEditMode: boolean = false;
  selectedRuleId: string = '';
  selectedRule: any;
  selectedJob: any;
  selectedSkill: any;
  selectedOrg: any;
  selectedUsers: any[] = [];
  isOrgGroup: boolean = false;
  isJobGroup: boolean = false;
  isSkillGroup: boolean = false;
  isUserGroup: boolean = false;
  orgList: any[] = [];
  jobList: JobTitle[] = [];
  groupTypeNames: any[] = [];
  loggedInUser!: ApplicationUser;
  pageSize: number = 1;
  jobsPerPage: number = 10;
  searchText: string = '';
  orgId: string = '';
  jobId: string = '';
  skillId: string = '';
  groupId?: string;
  filteredStates: any[] = [];
  selectedCountry: any;
  selectedState: any;
  allorgUsers: any;
  UserRole: any;
  displayRuleFn = (rule: any) => rule?.ruleType ?? '';
  @ViewChild('jobSelect') jobSelect: MatSelect | undefined;
  currentRuleIndex: number = 0;
  public ruleSkillsMap = new Map<number, any[]>();
  public filteredSkillsMap = new Map<number, BehaviorSubject<any[]>>();
  public skillSearchControls: Map<number, FormControl> = new Map<
    number,
    FormControl
  >();
  private skillPageSizeMap = new Map<number, number>();
  private SearchTimeout: any;
  private jobPageMap = new Map<number, number>();
  public countryControls: Map<number, FormControl> = new Map<
    number,
    FormControl
  >();
  public stateControls: Map<number, FormControl> = new Map<
    number,
    FormControl
  >();

  constructor(
    private fb: FormBuilder,
    private toaster: ToastrService,
    private dialogRef: MatDialogRef<AddGroupDialogComponent>,
    private groupService: GroupsService,
    private jobTitleService: JobTitleService,
    private orgService: OrganizationService,
    private skillService: SkillService,
    private userService: UserService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.groupId = data.GroupId;
    this.groupForm = this.fb.group({
      groupName: ['', Validators.required],
      groupDescription: [''],
      rules: this.fb.array([]),
      logicOperator: ['AND'],
      isActive: [true],
    });
  }
  ngOnInit(): void {
    // this.countries = Country.getAllCountries();
    this.filteredCountries = [...this.countries];
    // this.states = State.getAllStates();
    // this.cities = City.getAllCities();
    const storedUser = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (storedUser) {
      this.loggedInUser = JSON.parse(storedUser);
    }
    if (this.groupId) {
      this.isEditMode = true;
      this.fetchGroupForEdit(this.groupId);
    }
    this.getRules();

    this.skillSearchControl.valueChanges
      .pipe(
        filter((value): value is string => value !== null),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((searchText: string) => {
          this.searchText = (searchText || '').toLowerCase();
          this.pageSize = 1;

          const selectedSkillIds = this.getSelectedSkillIds(
            this.currentRuleIndex
          );

          this.filteredSkills.next([]);
          if (!this.searchText.trim()) {
            return of(this.allSkills);
          }
          return this.skillService.getAllOrganizationSkill(
            this.loggedInUser.organizationId,
            '',
            '',
            '',
            this.pageSize,
            this.skillPerPage,
            this.searchText
          );
        })
      )
      .subscribe((res) => {
        const selectedSkillIds = this.getSelectedSkillIds(
          this.currentRuleIndex
        );
        let combinedSkills = [...res];

        selectedSkillIds.forEach((id) => {
          if (!combinedSkills.find((skill) => skill.chasmaNOVOSkillId === id)) {
            const skillFromCache = this.allSkills.find(
              (skill) => skill.chasmaNOVOSkillId === id
            );

            if (skillFromCache) {
              combinedSkills.push(skillFromCache);
            }
          }
        });

        this.allSkills = combinedSkills.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        this.filteredSkills.next(this.allSkills);
      });

    // Subscribe to job search input changes
    this.jobSearchControl.valueChanges
      .pipe(
        filter((value): value is string => value !== null),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((searchText: string) => {
          this.searchText = (searchText || '').toLowerCase();
          this.pageSize = 1;
          const selectedJobIds = this.getSelectedJobIds(this.currentRuleIndex);
          // this.filteredJobs.next([]);
          if (!this.searchText.trim()) {
            return of(this.jobList);
          }
          return this.jobTitleService.getAllOrganizationJobTitle(
            this.loggedInUser.organizationId,
            '',
            this.jobsPerPage,
            this.pageSize,
            this.searchText
          );
        })
      )
      .subscribe((res) => {
        const selectedJobIds = this.getSelectedJobIds(this.currentRuleIndex);
        let combinedJobs = [...res];

        // Add any selected jobs missing from the API results
        selectedJobIds.forEach((id) => {
          if (!combinedJobs.find((job) => job.chasmaNOVOJobTitleId === id)) {
            const jobFromCache = this.jobList.find(
              (job) => job.chasmaNOVOJobTitleId === id
            );
            if (jobFromCache) {
              combinedJobs.push(jobFromCache);
            }
          }
        });

        this.jobList = combinedJobs.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        this.filteredJobs.next(this.jobList);
      });
  }

  getSelectedSkillIds(i: number): string[] {
    const val = this.getRuleControl(i, 'ruleTarget').value;
    return Array.isArray(val) ? val : [];
  }

  getSelectedJobIds(index: number): string[] {
    const val = this.getRuleControl(index, 'ruleTarget').value;
    return Array.isArray(val) ? val : [];
  }

  getRules() {
    this.groupService.getGroupRules().subscribe({
      next: (res: any) => {
        this.groupTypes = res.filter(
          (type: any) => type.ruleType != 'Group By Location'
        );
      },
      error: () => {
        this.toaster.error('Failed to load group rules');
      },
    });
  }

  onStateSelected(state: any) {
    this.selectedState = state;
    if (this.selectedCountry && state) {
      // this.cities = City.getCitiesOfState(
      //   this.selectedCountry.isoCode,
      //   state.isoCode
      // );
    }
  }

  requiredArrayValidator(control: FormControl) {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  }

  createRuleFormGroup(index: number = 0): FormGroup {
    return this.fb.group(
      {
        operator: ['', index > 0 ? Validators.required : []],
        targetsOperator: [''],
        groupType: ['', Validators.required],
        groupTypeName: ['', Validators.required],
        ruleType: [''],
        ruleTarget: [[], [this.requiredArrayValidator]],
        selectedValue: [''],
      },
      {
        validators: [targetsOperatorRequiredForRuleTypes()],
      }
    );
  }

  get rules(): FormArray {
    return this.groupForm.get('rules') as FormArray;
  }

  // addRule(): void {
  //   const rules = this.groupForm.get('rules') as FormArray;
  //   const index = rules.length;
  //   this.rules.push(this.createRuleFormGroup());
  // }
  public getSkillSearchControl(i: number): FormControl {
    return this.skillSearchControls.get(i)!; // non-null assert here, safe if set in addRule
  }

  addRule(): void {
    const index = this.rules.length;
    this.rules.push(this.createRuleFormGroup(index));

    // Initialize maps for skill-based rules
    this.ruleSkillsMap.set(index, []);
    this.filteredSkillsMap.set(index, new BehaviorSubject<any[]>([]));
    const searchControl = new FormControl('');
    this.skillSearchControls.set(index, new FormControl(''));

    this.setupSkillSearch(index);
    this.getallskillsForRule(index, '');
    this.countryControls.set(index, new FormControl([]));
    this.stateControls.set(index, new FormControl([]));
  }

  private setupSkillSearch(ruleIndex: number): void {
    const control = this.skillSearchControls.get(ruleIndex)!;

    control.valueChanges
      .pipe(
        filter((value): value is string => value !== null),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((searchText) => {
          const loggedInOrgId = this.loggedInUser.organizationId;
          const search = (searchText || '').toLowerCase();
          const currentSkills = this.ruleSkillsMap.get(ruleIndex) || [];

          if (!search.trim()) {
            return of(currentSkills);
          }
          return this.skillService.getAllOrganizationSkill(
            loggedInOrgId,
            '',
            '',
            '',
            this.pageSize,
            this.skillPerPage,
            search
          );
        })
      )
      .subscribe((res) => {
        let skills = this.ruleSkillsMap.get(ruleIndex) || [];
        const selectedIds = this.getSelectedSkillIds(ruleIndex);

        // Ensure selected stay in list
        selectedIds.forEach((id) => {
          if (!skills.find((s) => s.chasmaNOVOSkillId === id)) {
            const fromNew = res.find((s) => s.chasmaNOVOSkillId === id);
            if (fromNew) skills.push(fromNew);
          }
        });

        skills = [...skills, ...res]
          .filter(
            (s, i, arr) =>
              arr.findIndex(
                (a) => a.chasmaNOVOSkillId === s.chasmaNOVOSkillId
              ) === i
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        this.ruleSkillsMap.set(ruleIndex, skills);
        this.filteredSkillsMap.get(ruleIndex)!.next(skills);
      });
  }

  getallskillsForRule(
    ruleIndex: number,
    searchText: string = '',
    page: number = 1
  ): void {
    const currentSkills = this.ruleSkillsMap.get(ruleIndex) || [];
    this.skillService
      .getAllOrganizationSkill(
        this.loggedInUser.organizationId,
        '',
        '',
        '',
        page,
        this.skillPerPage,
        searchText
      )
      .subscribe((res) => {
        const merged = [...currentSkills, ...res]
          .filter(
            (s, i, arr) =>
              arr.findIndex(
                (a) => a.chasmaNOVOSkillId === s.chasmaNOVOSkillId
              ) === i
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        this.ruleSkillsMap.set(ruleIndex, merged);
        this.filteredSkillsMap.get(ruleIndex)?.next(merged);
      });
  }

  removeRule(index: number): void {
    this.rules.removeAt(index);
  }

  toggleUserSelection(user: any, event: any) {
    if (event.checked) {
      this.selectedUsers.push(user);
    } else {
      this.selectedUsers = this.selectedUsers.filter((u) => u.id !== user.id);
    }
  }

  onCountriesSelected(selectedCountries: any[], ruleIndex: number): void {
    this.selectedCountries = selectedCountries || [];
    this.selectedStates = [];
    this.states = [];
    this.cities = [];
    this.stateCtrl.setValue([]);

    const ruleGroup = this.rules.at(ruleIndex) as FormGroup;
    const targetCtrl = ruleGroup.get('ruleTarget');

    if (this.selectedCountries.length > 1) {
      const countryNames = this.selectedCountries.map((c) => c.name);
      targetCtrl?.setValue(countryNames);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: countryNames.join(', ') });
    } else if (this.selectedCountries.length === 1) {
      // this.states = State.getStatesOfCountry(this.selectedCountries[0].isoCode);
      targetCtrl?.setValue([]);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: '' });
    } else {
      targetCtrl?.setValue([]);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: '' });
    }
  }

  onStatesSelected(selectedStates: any[], ruleIndex: number): void {
    this.selectedStates = selectedStates || [];
    this.cities = [];

    const ruleGroup = this.rules.at(ruleIndex) as FormGroup;
    const targetCtrl = ruleGroup.get('ruleTarget');

    if (this.selectedStates.length > 1) {
      const stateNames = this.selectedStates.map((s) => s.name);
      targetCtrl?.setValue(stateNames);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: stateNames.join(', ') });
    } else if (
      this.selectedStates.length === 1 &&
      this.selectedCountries.length === 1
    ) {
      // this.cities = City.getCitiesOfState(
      //   this.selectedCountries[0].isoCode,
      //   this.selectedStates[0].isoCode
      // );
      targetCtrl?.setValue([]);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: '' });
    } else {
      targetCtrl?.setValue([]);
      targetCtrl?.updateValueAndValidity();
      ruleGroup.patchValue({ groupTypeName: '' });
    }
  }

  onUserSelectionChange(event: MatSelectChange, index: number): void {
    const selectedUserIds = event.value;
    const ruleGroup = this.rules.at(index) as FormGroup;

    ruleGroup.get('ruleTarget')?.setValue(selectedUserIds);
    ruleGroup.get('ruleTarget')?.markAsTouched();
    ruleGroup.get('ruleTarget')?.updateValueAndValidity();

    if (!ruleGroup.get('groupType')?.value) {
      const userRuleType = this.groupTypes?.find(
        (g: any) => g.ruleType === "Group By User's"
      );
      ruleGroup.patchValue({
        groupType: userRuleType,
        groupTypeName:
          userRuleType?.displayName ||
          userRuleType?.name ||
          userRuleType?.ruleType,
      });
    }
    ruleGroup.markAllAsTouched();
    ruleGroup.updateValueAndValidity();
  }

  onRuleChanged(rule: any, type: string, index: number): void {
    this.searchText = '';
    const rulesArray = this.groupForm.get('rules') as FormArray;
    const ruleGroup = rulesArray.at(index) as FormGroup;
    const ruleType =
      type === 'ruleType' ? rule.ruleType : ruleGroup.get('ruleType')?.value;
    const isDuplicate = rulesArray.controls.some((ctrl, i) => {
      if (i === index) return false;
      return ctrl.get('ruleType')?.value === ruleType;
    });
    if (isDuplicate) {
      this.snackBar.open('Rule already added', 'Close', { duration: 3000 });
      ruleGroup.patchValue({
        groupType: '',
      });
      return;
    }
    if (type === 'ruleType') {
      if (rule.ruleType === "Group By User's") {
        ruleGroup.patchValue({
          ruleType: rule.ruleType,
          groupType: rule,
          groupTypeName: rule.displayName || rule.name || rule.ruleType,
        });
      } else {
        ruleGroup.patchValue({
          ruleType: rule.ruleType,
          groupType: rule,
        });
      }
      this.selectedRuleId = rule.groupRuleId;
      switch (rule.ruleType) {
        case 'Group By Job':
          this.jobList = [];
          this.getAllJobs(this.jobsPerPage, this.pageSize);
          break;
        case 'Group By Org':
          this.getAllOrganizations();
          break;
        case 'Group By BeginnerSkill':
        case 'Group By IntermediateSkill':
        case 'Group By AdvancedSkill':
        case 'Group By ExpertSkill':
        case 'Group By Skills':
          this.allSkills = [];
          this.getallskills(
            this.loggedInUser.organizationId,
            '',
            '',
            '',
            this.pageSize,
            this.skillPerPage,
            this.searchText
          );
          break;
        case "Group By User's":
          this.getallUsers();
          break;

        case 'Group By Location':
          this.selectedCountries = [];
          this.selectedStates = [];
          this.states = [];
          this.cities = [];
          ruleGroup.patchValue({
            ruleTarget: [],
            groupTypeName: '',
          });
          break;

        case 'Group By Role':
          this.getUserRoles();
          break;
      }
    } else if (type === 'job') {
      const selectedJobs = this.jobList.filter((job) =>
        rule.includes(job.chasmaNOVOJobTitleId)
      );
      const jobNames = selectedJobs.map((job) => job.name).join(', ');
      ruleGroup.patchValue({
        groupTypeName: jobNames,
        ruleTarget: rule,
      });
    } else if (type === 'org') {
      const selectedOrgs = this.orgList.filter((org) =>
        rule.includes(org.organizationId)
      );
      const orgNames = selectedOrgs.map((org) => org.name).join(', ');
      ruleGroup.patchValue({
        groupTypeName: orgNames,
        ruleTarget: rule,
      });
    } else if (type === 'skill') {
      // const selectedSkills = this.allSkills.filter(skill => rule.includes(skill.chasmaNOVOSkillId));
      // const skillNames = selectedSkills.map(skill => skill.name).join(', ');
      // ruleGroup.patchValue({
      //   groupTypeName: skillNames,
      //   ruleTarget: rule
      // });
      const availableSkills = this.ruleSkillsMap.get(index) || [];
      const selectedSkills = availableSkills.filter((skill) =>
        rule.includes(skill.chasmaNOVOSkillId)
      );
      const skillNames = selectedSkills.map((skill) => skill.name).join(', ');
      ruleGroup.patchValue({
        groupTypeName: skillNames,
        ruleTarget: rule, // this should always be an array of skill IDs
      });
    } else if (type === 'country' && ruleType === 'Group By Location') {
      this.selectedCountries = rule || [];
      this.selectedStates = [];
      this.states = [];
      this.cities = [];
      this.stateCtrl.setValue([]);
      if (this.selectedCountries.length > 1) {
        const countryNames = this.selectedCountries.map((c) => c.name);
        ruleGroup.patchValue({
          groupTypeName: countryNames.join(', '),
          ruleTarget: countryNames,
        });
        this.states = [];
        this.cities = [];
      } else if (this.selectedCountries.length === 1) {
        // this.states = State.getStatesOfCountry(
        //   this.selectedCountries[0].isoCode
        // );
        ruleGroup.patchValue({
          groupTypeName: '',
          ruleTarget: [],
        });
      } else {
        ruleGroup.patchValue({
          groupTypeName: '',
          ruleTarget: [],
        });
      }
    } else if (type === 'state' && ruleType === 'Group By Location') {
      this.selectedStates = rule || [];
      this.cities = [];
      if (this.selectedStates.length > 1) {
        const stateNames = this.selectedStates.map((s) => s.name);
        ruleGroup.patchValue({
          groupTypeName: stateNames.join(', '),
          ruleTarget: stateNames,
        });
        this.cities = [];
      } else if (
        this.selectedStates.length === 1 &&
        this.selectedCountries.length === 1
      ) {
        // this.cities = City.getCitiesOfState(
        //   this.selectedCountries[0].isoCode,
        //   this.selectedStates[0].isoCode
        // );
        ruleGroup.patchValue({
          groupTypeName: '',
          ruleTarget: [],
        });
      } else {
        ruleGroup.patchValue({
          groupTypeName: '',
          ruleTarget: [],
        });
      }
    } else if (type === 'city' && ruleType === 'Group By Location') {
      const selectedCityNames = Array.isArray(rule) ? rule : [rule];
      ruleGroup.patchValue({
        groupTypeName: selectedCityNames.join(', '),
        ruleTarget: selectedCityNames,
      });
    } else if (type === 'user') {
      ruleGroup.patchValue({
        groupTypeName: rule.fullName,
        ruleTarget: [rule.applicationUserId],
      });
    } else if (type === 'role') {
      const rolename =
        this.UserRole.find((r: any) => r.roleId === rule)?.name || rule;
      ruleGroup.patchValue({
        groupTypeName: rolename,
        ruleTarget: rule,
      });
    }
  }

  getRuleControl(i: number, controlName: string): FormControl {
    return this.rules.at(i).get(controlName) as FormControl;
  }

  getUserRoles() {
    this.roleService.getOrganizationRoles().subscribe({
      next: (res: any) => {
        this.UserRole = res.map((role: any) => ({
          ...role,
        }));
      },
    });
  }

  getallUsers() {
    this.isUserGroup = true;
    this.isJobGroup = false;
    this.isOrgGroup = false;
    this.isSkillGroup = false;
    this.userService
      .getOrganizationUsers(
        '',
        this.loggedInUser.applicationUserId,
        this.loggedInUser.organizationId
      )
      .subscribe({
        next: (res: any) => {
          this.allorgUsers = res.map((user: any) => ({
            ...user,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
          }));
        },
      });
  }

  getallskills(
    organaizationId: string,
    userId: string,
    skillId: string,
    jobTitleId: string,
    pageSize: number,
    perPage: number,
    searchText: string
  ): void {
    this.isJobGroup = false;
    this.isOrgGroup = false;
    this.isSkillGroup = true;
    this.loading = true;
    this.skillService
      .getAllOrganizationSkill(
        organaizationId,
        userId,
        skillId,
        jobTitleId,
        pageSize,
        perPage,
        searchText
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res && res.length > 0) {
            this.allSkills = [...this.allSkills, ...res];
            this.allSkills.sort((a, b) => a.name.localeCompare(b.name));
            this.filteredSkills.next(this.allSkills);
            if (res.length < this.skillPerPage) {
            }
          } else {
            this.filteredSkills.next([]);
          }
        },
        error: () => {
          this.loading = false;
          console.error('Error fetching skills');
          return of([]);
        },
      });
  }

  getAllJobs(jobsPerPage: number, pageSize: number, searchText: string = '') {
    this.isOrgGroup = false;
    this.isJobGroup = true;
    this.isSkillGroup = false;
    this.jobTitleService
      .getAllOrganizationJobTitle(
        this.loggedInUser.organizationId,
        '',
        jobsPerPage,
        pageSize,
        searchText
      )
      .subscribe({
        next: (res: JobTitle[]) => {
          if (res && res.length > 0) {
            this.jobList = [...this.jobList, ...res];
            this.filteredJobs.next(this.jobList);
          }
        },
      });
  }

  getAllOrganizations() {
    this.isJobGroup = false;
    this.isOrgGroup = true;
    this.isSkillGroup = false;
    this.orgService
      .getOrganization('', this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res: any) => {
          this.orgList = res;
        },
      });
  }

  onJobDropdownOpen(opened: boolean, type: string, index: number) {
    if (type === 'skill' && index !== undefined) {
      this.currentRuleIndex = index;
    }

    if (opened) {
      setTimeout(() => {
        const panel = document.querySelector('.job-dropdown-panel');
        if (panel) {
          if (type === 'skill') {
            panel.addEventListener('scroll', (event: Event) => this.onDropDownScroll(event, 'skill', index), { passive: true });
          }
          else if (type === 'job') {
            panel.addEventListener('scroll', (event: Event) => this.onDropDownScroll(event, 'job', index), { passive: true });
          }
        }
      }, 0);
    }
  }

  onDropDownScroll(event: Event, scrollInput: string, ruleIndex: number): void {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, offsetHeight } = target;

    if (scrollTop + offsetHeight >= scrollHeight - 10) {
      const currentPage = this.skillPageSizeMap.get(ruleIndex) || 1;
      const nextPage = currentPage + 1;
      this.skillPageSizeMap.set(ruleIndex, nextPage);

      if (scrollInput === 'skill') {
        this.getallskillsForRule(ruleIndex, this.skillSearchControls.get(ruleIndex)?.value || '', nextPage);
      } else if (scrollInput === 'job') {
        // same logic for jobs if you have pagination
        // this.getAllJobs(this.jobsPerPage, nextPage, this.searchText);
        const currentPage = this.jobPageMap.get(ruleIndex) || 1;
        const nextPage = currentPage + 1;
        this.jobPageMap.set(ruleIndex, nextPage);

        this.jobTitleService
          .getAllOrganizationJobTitle(
            this.loggedInUser.organizationId,
            '',
            this.jobsPerPage,
            nextPage,
            this.searchText // keep search text in scroll
          )
          .subscribe((res: any[]) => {
            if (res && res.length > 0) {
              const merged = [...this.jobList, ...res]
                .filter((j, i, arr) => arr.findIndex(a => a.chasmaNOVOJobTitleId === j.chasmaNOVOJobTitleId) === i)
                .sort((a, b) => a.name.localeCompare(b.name));

              this.jobList = merged;
              this.filteredJobs.next(this.jobList);
            }
          });
      }
    }
  }

  onSearchInput(event: any, input: string, ruleIndex?: number): void {
    const searchValue = (event.target.value || '').toLowerCase();

    if (input === 'skill') {
      if (!ruleIndex && ruleIndex !== 0) return; // must have rule index

      // Cancel any pending debounce
      if (this.SearchTimeout) {
        clearTimeout(this.SearchTimeout);
      }

      this.SearchTimeout = setTimeout(() => {
        this.searchText = searchValue;
        this.pageSize = 1;

        // Get selected skill IDs for this rule
        const selectedSkillIds = this.getSelectedSkillIds(ruleIndex);

        // Call API for search results
        this.skillService
          .getAllOrganizationSkill(
            this.loggedInUser.organizationId,
            '',
            '',
            '',
            this.pageSize,
            this.skillPerPage,
            this.searchText
          )
          .subscribe((res: any[]) => {
            let combinedSkills = [...res];

            // Add any selected skills not in API result
            selectedSkillIds.forEach((id) => {
              if (!combinedSkills.find((s) => s.chasmaNOVOSkillId === id)) {
                const fromCache =
                  (this.ruleSkillsMap.get(ruleIndex) || []).find(
                    (s) => s.chasmaNOVOSkillId === id
                  ) || this.allSkills.find((s) => s.chasmaNOVOSkillId === id);
                if (fromCache) {
                  combinedSkills.push(fromCache);
                }
              }
            });

            // Sort alphabetically
            combinedSkills.sort((a, b) => a.name.localeCompare(b.name));

            // Update caches & observable
            this.ruleSkillsMap.set(ruleIndex, combinedSkills);
            this.filteredSkillsMap.get(ruleIndex)?.next(combinedSkills);
          });
      }, 400);
    } else if (input === 'country') {
      this.filteredCountries = this.countries.filter((country) =>
        country.name.toLowerCase().includes(searchValue)
      );
    } else if (input === 'job') {
      if (!ruleIndex && ruleIndex !== 0) return;

      if (this.SearchTimeout) {
        clearTimeout(this.SearchTimeout);
      }

      this.SearchTimeout = setTimeout(() => {
        this.searchText = searchValue;
        this.jobPageMap.set(ruleIndex, 1); // reset page for this search

        const selectedIds = this.getSelectedJobIds(ruleIndex);

        this.jobTitleService
          .getAllOrganizationJobTitle(
            this.loggedInUser.organizationId,
            '',
            this.jobsPerPage,
            1, // first page
            this.searchText
          )
          .subscribe((res: any[]) => {
            let combinedJobs = [...res];

            selectedIds.forEach((id) => {
              if (!combinedJobs.find((j) => j.chasmaNOVOJobTitleId === id)) {
                const fromCache = this.jobList.find(
                  (j) => j.chasmaNOVOJobTitleId === id
                );
                if (fromCache) combinedJobs.push(fromCache);
              }
            });

            combinedJobs.sort((a, b) => a.name.localeCompare(b.name));

            this.jobList = combinedJobs;
            this.filteredJobs.next(this.jobList);
          });
      }, 400);
    }
  }

  addGroup() {
    if (!this.groupForm.valid) {
      this.toaster.error('Please fill in all required fields.');
      return;
    }
    const formValue = this.groupForm.value;
    const rulesArray = this.rules.controls;
    const ruleMappings = rulesArray.map((ruleGroup: any, index: number) => {
      return {
        groupRuleId: ruleGroup.value.groupType?.groupRuleId,
        operator: index > 0 ? ruleGroup.value.operator : '',
        targetsOperator: ruleGroup.value.targetsOperator
          ? ruleGroup.value.targetsOperator
          : 'OR',
        targetedValue: ruleGroup.value.ruleTarget,
      };
    });

    const groupData = {
      groupName: formValue.groupName,
      description: formValue.groupDescription,
      createdBy: this.loggedInUser.applicationUserId,
      ruleMappings: ruleMappings,
      organizationId: this.loggedInUser.organizationId,
    };

    this.isLoading = true;
    this.groupService.addGroup(groupData).subscribe({
      next: (res: any) => {
        if (res.isSuccess == true) {
          this.toaster.success(res.message);
        } else {
          this.toaster.error(res.message);
        }
        this.isLoading = false;
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.isLoading = false;
        let errmsg = err?.error?.message || 'Failed to add group';
        this.toaster.error(errmsg);
        console.error('Error adding group:', err);
      },
    });
  }

  fetchGroupForEdit(groupId: string): void {
    this.isLoading = true;
    this.groupService
      .getGroupById(groupId)
      .pipe(
        switchMap((groupData: any) => {
          this.groupForm.patchValue({
            groupName: groupData.groupName,
            groupDescription: groupData.description,
            isActive: groupData.isActive,
          });

          const rules = groupData.rules || [];
          const requiredLoaders = [];

          const hasJob = rules.some((r: any) => r.ruleType === 'Group By Job');
          const hasOrg = rules.some((r: any) => r.ruleType === 'Group By Org');
          const hasSkill = rules.some((r: any) =>
            r.ruleType?.includes('Skill')
          );
          const hasUser = rules.some(
            (r: any) => r.ruleType === "Group By User's"
          );
          const hasRole = rules.some(
            (r: any) => r.ruleType === 'Group By Role'
          );
          const hasLocation = rules.some(
            (r: any) => r.ruleType === 'Group By Location'
          );
          const skills = rules.some(
            (r: any) => r.ruleType === 'Group By Skills'
          );

          if (hasJob)
            requiredLoaders.push(
              this.jobTitleService.getAllOrganizationJobTitle(
                this.loggedInUser.organizationId,
                '',
                this.jobsPerPage,
                this.pageSize,
                ''
              )
            );
          else requiredLoaders.push(of([]));

          if (hasOrg)
            requiredLoaders.push(
              this.orgService.getOrganization(
                '',
                this.loggedInUser.applicationUserId
              )
            );
          else requiredLoaders.push(of([]));

          if (hasSkill || skills)
            requiredLoaders.push(
              this.skillService.getAllOrganizationSkill(
                this.loggedInUser.organizationId,
                '',
                '',
                '',
                this.pageSize,
                this.skillPerPage,
                this.searchText
              )
            );
          else requiredLoaders.push(of([]));

          if (hasUser)
            requiredLoaders.push(
              this.userService.getOrganizationUsers(
                '',
                this.loggedInUser.applicationUserId,
                this.loggedInUser.organizationId
              )
            );
          else requiredLoaders.push(of([]));

          if (hasRole)
            requiredLoaders.push(this.roleService.getOrganizationRoles());
          else requiredLoaders.push(of([]));

          if (hasLocation) {
            // requiredLoaders.push(of(Country.getAllCountries()));
            // requiredLoaders.push(of(State.getAllStates()));
            // requiredLoaders.push(of(City.getAllCities()));
          }

          return forkJoin(requiredLoaders).pipe(
            switchMap(
              ([
                jobs,
                orgs,
                skills,
                users,
                roles,
                countries,
                states,
                cities,
              ]) => {
                this.jobList = jobs;
                this.orgList = orgs;
                this.allSkills = skills;
                this.allorgUsers = users.map((u: any) => ({
                  ...u,
                  fullName: `${u.firstName} ${u.lastName}`.trim(),
                }));
                this.UserRole = roles;
                // this.countries =
                //   countries && countries.length > 0
                //     ? countries
                //     : Country.getAllCountries();
                this.filteredCountries = [...this.countries];
                this.states = states;
                this.cities = cities;
                this.populateRules(groupData.rules);
                this.isLoading = false;
                return of(null);
              }
            )
          );
        })
      )
      .subscribe({
        next: () => {},
        error: () => {
          this.toaster.error(
            'Failed to load group data or supporting information'
          );
        },
      });
  }

  populateRules(rules: GroupRuleMapping[]): void {
    const rulesFormArray = this.groupForm.get('rules') as FormArray;
    rulesFormArray.clear();
    const groupedRulesMap = new Map<string, GroupRuleMapping[]>();

    // Group rules by groupRuleId and ruleType
    rules.forEach((rule) => {
      const key = `${rule.groupRuleId}_${rule.ruleType}`;
      if (!groupedRulesMap.has(key)) {
        groupedRulesMap.set(key, []);
      }
      groupedRulesMap.get(key)!.push(rule);
    });

    // Flatten grouped entries to iterate
    const flatGroupedRules: {
      grouped: GroupRuleMapping[];
      first: GroupRuleMapping;
    }[] = [];
    for (const [, grouped] of groupedRulesMap.entries()) {
      flatGroupedRules.push({ grouped, first: grouped[0] });
    }

    flatGroupedRules.forEach((item, index) => {
      const { grouped, first } = item;
      const targetedValues: string[] = (first.targetedValues ?? []).map(
        (tv) => tv.value
      );
      const targetId: string[] = (first.targetedValues ?? []).map(
        (tv) => tv.targetValueId
      ); // assumed names or display values
      const matchingGroupType = this.groupTypes.find(
        (gt: { groupRuleId: string }) => gt.groupRuleId === first.groupRuleId
      );

      const formGroup = this.createRuleFormGroup(index);
      let ruleTargetValue: any[] = [];
      let displayNames: string[] = [];

      switch (first.ruleType) {
        case "Group By User's":
          // Add any selected users missing from allorgUsers
          targetedValues.forEach((fullName) => {
            const exists = this.allorgUsers?.some(
              (u: any) => `${u.firstName} ${u.lastName}` === fullName
            );
            if (!exists) {
              // Add minimal user object (you might want to fetch full data if needed)
              this.allorgUsers.push({
                applicationUserId: 'temp-' + fullName,
                firstName: fullName.split(' ')[0] || '',
                lastName: fullName.split(' ')[1] || '',
                fullName,
              });
            }
          });

          ruleTargetValue = this.allorgUsers
            .filter((user: ApplicationUser) =>
              targetedValues.includes(`${user.firstName} ${user.lastName}`)
            )
            .map((user: ApplicationUser) => user.applicationUserId);

          displayNames = targetedValues;
          break;

        case 'Group By AdvancedSkill':
        case 'Group By BeginnerSkill':
        case 'Group By IntermediateSkill':
        case 'Group By ExpertSkill':
        case 'Group By Skills':
          ruleTargetValue = targetId;
          displayNames = targetedValues;
          this.ruleSkillsMap.set(index, []);
          this.filteredSkillsMap.set(index, new BehaviorSubject<any[]>([]));
          this.skillSearchControls.set(index, new FormControl(''));
          this.setupSkillSearch(index);

          // Get current per-rule array
          let ruleSkillList = this.ruleSkillsMap.get(index) || [];

          // Ensure all targetedIds are present in that list
          targetId.forEach((id, idx) => {
            const exists = ruleSkillList.some(
              (skill) => skill.chasmaNOVOSkillId === id
            );
            if (!exists) {
              ruleSkillList.push({
                chasmaNOVOSkillId: id,
                name: targetedValues[idx] ?? 'Unknown Skill',
              });
            }
          });

          // Sort and save back into the map
          ruleSkillList = ruleSkillList.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          this.ruleSkillsMap.set(index, ruleSkillList);

          // Publish to the per‑rule observable so dropdown shows them
          this.filteredSkillsMap.get(index)!.next(ruleSkillList);

          break;

        case 'Group By Job':
          ruleTargetValue = targetId;
          displayNames = targetedValues;

          targetId.forEach((id, idx) => {
            const exists = this.jobList.some(
              (j) => j.chasmaNOVOJobTitleId === id
            );
            if (!exists) {
              this.jobList.push({
                chasmaNOVOJobTitleId: id,
                name: targetedValues[idx] ?? 'Unknown Job',
                description: '',
                organizationTypeId: '',
                usersCount: 0,
                organizationId: this.loggedInUser.organizationId,
              } as JobTitle);
            }
          });
          break;

        case 'Group By Org':
          ruleTargetValue = targetId;
          displayNames = targetedValues;
          break;

        case 'Group By Role':
          ruleTargetValue = targetId;
          displayNames = targetedValues;
          break;

        case 'Group By Location':
          const matchedCities = this.cities.filter((city) =>
            targetedValues.includes(city.name)
          );
          if (matchedCities.length > 0) {
            const city = matchedCities[0];
            const countryObj = this.countries.find(
              (c) => c.isoCode === city.countryCode
            );
            // const stateObj = State.getStatesOfCountry(city.countryCode).find(
            //   (s) =>
            //     s.isoCode === city.stateCode &&
            //     s.countryCode === city.countryCode
            // );

            this.selectedCountries = countryObj ? [countryObj] : [];
            // this.selectedStates = stateObj ? [stateObj] : [];

            this.countryControls.set(
              index,
              new FormControl(this.selectedCountries)
            );
            // this.states = State.getStatesOfCountry(city.countryCode);
            // this.stateControls.set(index, new FormControl(this.selectedStates));
            // this.cities = City.getCitiesOfState(
            //   city.countryCode,
            //   city.stateCode
            // );

            ruleTargetValue = [city.name];
            displayNames = [city.name];
          } else {
            // Try to match by state
            const matchedStates = this.states.filter((s) =>
              targetedValues.includes(s.name)
            );
            if (matchedStates.length > 0) {
              this.selectedStates = matchedStates;
              const countryIsoCodes = [
                ...new Set(matchedStates.map((s) => s.countryCode)),
              ];
              this.selectedCountries = this.countries.filter((c) =>
                countryIsoCodes.includes(c.isoCode)
              );

              this.countryControls.set(
                index,
                new FormControl(this.selectedCountries)
              );
              if (this.selectedCountries.length === 1) {
                // this.states = State.getStatesOfCountry(
                //   this.selectedCountries[0].isoCode
                // );
                this.stateControls.set(index, new FormControl(matchedStates));
              }

              ruleTargetValue = matchedStates.map((s) => s.name);
              displayNames = ruleTargetValue;
            } else {
              // Try to match by country
              const matchedCountries = this.countries.filter((c) =>
                targetedValues.includes(c.name)
              );
              if (matchedCountries.length > 0) {
                this.selectedCountries = matchedCountries;
                this.countryControls.set(
                  index,
                  new FormControl(this.selectedCountries)
                );
                if (matchedCountries.length === 1) {
                  // this.states = State.getStatesOfCountry(
                  //   matchedCountries[0].isoCode
                  // );
                }

                ruleTargetValue = matchedCountries.map((c) => c.name);
                displayNames = ruleTargetValue;
              }
            }
          }
          break;
      }

      let operator = index > 0 ? first.operator || '' : '';
      const sanitizedOperator = (first.targetsOperator || '')
        .toUpperCase()
        .trim();
      formGroup.patchValue({
        operator: operator,
        targetsOperator: sanitizedOperator,
        groupType: matchingGroupType || '',
        ruleType: first.ruleType,
        ruleTarget: ruleTargetValue,
        groupTypeName: displayNames.join(', '),
      });
      this.groupForm.updateValueAndValidity();
      rulesFormArray.push(formGroup);
    });
  }

  updateGroup() {
    const formValue = this.groupForm.value;
    const rulesArray = this.rules.controls;
    const ruleMappings = rulesArray.map((ruleGroup: any, index: number) => {
      return {
        groupRuleId: ruleGroup.value.groupType?.groupRuleId,
        operator: index > 0 ? ruleGroup.value.operator : '',
        targetsOperator: ruleGroup.value.targetsOperator,
        targetedValue: this.getTargetedValueIds(ruleGroup),
      };
    });

    const groupData: UpdateGroup = {
      groupId: this.groupId,
      groupName: formValue.groupName,
      description: formValue.groupDescription,
      isActive: formValue.isActive,
      organizationId: this.loggedInUser.organizationId,
      ruleMappings: ruleMappings,
    };

    this.isLoading = true;
    this.groupService.updateGroup(groupData).subscribe({
      next: (res: any) => {
        if (res.isSuccess === true) {
          this.toaster.success(res.message);
          this.dialogRef.close(res);
        } else {
          this.toaster.error(res.message);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const errmsg = err?.error?.message || 'Failed to update group';
        this.toaster.error(errmsg);
        console.error('Error updating group:', err);
      },
    });
  }

  getTargetedValueIds(ruleGroup: any): any[] {
    const ruleType = ruleGroup.value.ruleType;
    const value = ruleGroup.value.ruleTarget || [];
    const skillRuleTypes = [
      'Group By BeginnerSkill',
      'Group By IntermediateSkill',
      'Group By AdvancedSkill',
      'Group By ExpertSkill',
      'Group By Skills',
    ];
    if (skillRuleTypes.includes(ruleType)) {
      return (value || []).map((v: any) => {
        const found = this.allSkills.find(
          (s) => s.chasmaNOVOSkillId === v || s.name === v
        );
        return found ? found.chasmaNOVOSkillId : v;
      });
    }

    if (ruleType === 'Group By Job') {
      return (value || []).map((v: any) => {
        const found = this.jobList.find(
          (j) => j.chasmaNOVOJobTitleId === v || j.name === v
        );
        return found ? found.chasmaNOVOJobTitleId : v;
      });
    }

    if (ruleType === 'Group By Org') {
      return (value || []).map((v: any) => {
        const found = this.orgList.find(
          (o) => o.organizationId === v || o.name === v
        );
        return found ? found.organizationId : v;
      });
    }

    if (ruleType === "Group By User's") {
      return (value || []).map((v: any) => {
        const found = this.allorgUsers.find(
          (u: { applicationUserId: any; firstName: any; lastName: any }) =>
            u.applicationUserId === v || `${u.firstName} ${u.lastName}` === v
        );
        return found ? found.applicationUserId : v;
      });
    }

    if (ruleType === 'Group By Role') {
      return (value || []).map((v: any) => {
        const found = this.UserRole.find(
          (r: { roleId: any; name: any }) => r.roleId === v || r.name === v
        );
        return found ? found.roleId : v;
      });
    }

    if (ruleType === 'Group By Location') {
      return (value || []).map((v: any) => {
        if (typeof v === 'string') {
          return v;
        }
        if (v && typeof v === 'object' && v.name) {
          return v.name;
        }
        return v;
      });
    }

    return value;
  }

  isTargetVisible(ruleType: string): boolean {
    return [
      'Group By BeginnerSkill',
      'Group By AdvancedSkill',
      'Group By ExpertSkill',
      'Group By IntermediateSkill',
      'Group By Skills',
    ].includes(ruleType);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  isFormValid(): boolean {
    return this.groupForm.valid;
  }
}
