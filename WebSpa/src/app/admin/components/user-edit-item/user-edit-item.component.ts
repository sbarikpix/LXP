import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ApplicationUser } from '../../../shared/models/commonmodel';
import { Skill } from '../../../shared/models/commonmodel';
import { Team } from '../../../shared/models/commonmodel';
import { SkillService } from '../../../shared/services/skill.service';
import { TeamService } from '../../../shared/services/team.service';
import { InterestService } from '../../../shared/services/interest.service';
import { Interest } from '../../../shared/models/commonmodel';
import { JobTitleService } from '../../../shared/services/job-title.service';
import { JobTitle } from '../../../shared/models/commonmodel';
import { RoleService } from '../../../shared/services/role.service';
import { Role } from '../../../shared/models/commonmodel';
import { DatePipe, Location, isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ImageUploadDialogComponent } from '../image-upload-dialog/image-upload-dialog.component';
import { OrganizationService } from '../../../shared/services/organization.service';
import { Organization } from '../../../shared/models/commonmodel';
import {
  BehaviorSubject,
  concatMap,
  debounceTime,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppConstants } from '../../../shared/App-Constants';
import { Title } from '@angular/platform-browser';
import {
  ForgotPasswordCommand,
  LoginService,
} from '@app/shared/services/login.service';
import { Router } from '@angular/router';
import { MapDataService } from '@app/shared/services/map-data.service';
import type { Map, Layer, Marker } from 'leaflet';

@Component({
  selector: 'app-user-edit-item',
  templateUrl: './user-edit-item.component.html',
  styleUrl: './user-edit-item.component.scss',
})
export class UserEditItemComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  public L: any = null; // Dynamic Leaflet instance
  jobperpage: number = 10;
  pagesize: number = 1;
  searchText: string = '';
  currentPage = 0;
  totalJobs = 0;
  allJobsLoaded = false;
  jobtitleId: string = '';

  isEditMode: boolean = false;
  isLoading: boolean = false;
  showIcons: boolean = false;
  hoverAvatar: boolean = false;
  isOrgProspective: boolean = false;

  organizationId: string = '';
  userId: string = '';
  isFetchingLocation: boolean = false;

  userToEdit!: ApplicationUser;
  selectedGender: string = '';
  selectedJobTitle!: JobTitle;
  selectedTeam!: Team;
  assignedManager?: ApplicationUser;
  selectedRole!: Role;

  orgSkillList: Skill[] = [];
  orgTeamList: Team[] = [];
  orgJobList: JobTitle[] = [];
  orgInterestList: Interest[] = [];
  managerList: ApplicationUser[] = [];
  roles: Role[] = [];
  orgList: Organization[] = [];

  selectedSkills: Skill[] = [];
  selectedInterests: Interest[] = [];
  selectedImage: string = '';
  selectedOrganization!: Organization;

  loggedInUser!: ApplicationUser;
  userOrganization!: ApplicationUser;

  selectedJobTitleId: any;
  selectedTeamTitleId: any;

  jobFilterCtrl = new FormControl();
  TeamFilterCtrl = new FormControl();
  orgfilterctrl = new FormControl();

  interestFilterCtrl = new FormControl();
  skillFilterCtrl = new FormControl();
  locationSearchCtrl = new FormControl();

  filteredJobs: BehaviorSubject<JobTitle[]> = new BehaviorSubject<JobTitle[]>(
    []
  );
  filteredTeams: any;
  filteredInterests: any;
  filteredSkills: any;
  filteredorgs: any;

  selectedInterestsControl = new FormControl();
  selectedSkillsControl = new FormControl();
  selectedSkillsText: string = '';
  selectedInterestText: string = '';

  addedUserSkills: {
    chasmaNOVOSkillId: string;
    levelId: string;
  }[] = [];

  @ViewChild('userMap', { static: false })
  set userMap(el: ElementRef<HTMLDivElement>) {
    if (el) {
      this.userMapRef = el;
      // If map already exists, remove it as it is attached to an old element
      if (this.map) {
        this.map.remove();
        this.map = null!;
      }

      // Initialize new map
      setTimeout(() => {
        this.initUserMap();
      }, 0);
    }
  }

  userMapRef!: ElementRef<HTMLDivElement>;
  map!: any;
  marker?: any;
  enablePinning = true;
  selectedLat: number | null = null;
  selectedLng: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private loginservice: LoginService,
    private formBuilder: FormBuilder,
    private skillService: SkillService,
    private teamService: TeamService,
    private interestService: InterestService,
    private jobTitleService: JobTitleService,
    private roleService: RoleService,
    private datePipe: DatePipe,
    private toastr: ToastrService,
    private location: Location,
    private dialog: MatDialog,
    private title: Title,
    private orgService: OrganizationService,
    private mapDataService: MapDataService
  ) {
    this.route.params.subscribe((params) => {
      if (params['organizationId'] && params['id']) {
        this.isEditMode = true;
        this.organizationId = params['organizationId'];
        this.userId = params['id'];
        this.title.setTitle('Users | Edit');
      } else {
        this.isEditMode = false;
        this.organizationId = params['organizationId'];
        this.userId = '';
        this.title.setTitle('Users | Add');
      }
    });
  }

  userForm = this.formBuilder.group({
    firstName: ['', [Validators.required, this.customNameValidator()]],
    middleName: [''],
    lastName: ['', [Validators.required, this.customNameValidator()]],
    email: [
      '',
      [Validators.required, Validators.email, this.customEmailValidator()],
    ],
    dateOfBirth: [''],
    gender: [''],
    address1: [''],
    address2: [''],
    city: [''],
    district: [''],
    state: [''],
    zip: [''],
    country: [''],
    phoneNumber: ['', [Validators.pattern(/^[+]?[0-9\s-()]{10,15}$/)]],
    jobTitleId: ['', Validators.required],
    organisationTeamId: [''],
    roleId: ['', Validators.required],
    organizationId: ['', Validators.required],
    managerId: [''],
    organizationInterestIds: [['']],
    organizationSkillIds: [['']],
    responsibility: [''],
    latitude: [''],
    longitude: [''],
    isMentor: [false],
  });

  validateDOB() {
    const dob = this.userForm.get('dateOfBirth')!.value;
    const today = new Date();
    if (dob && !isNaN(Date.parse(dob))) {
      if (new Date(dob) > today) {
        this.userForm.get('dateOfBirth')!.setErrors({ invalid: true });
      } else {
        this.userForm.get('dateOfBirth')!.setErrors(null);
      }
    }
  }

  customEmailValidator() {
    return (control: { value: string }) => {
      const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
      if (control.value && !pattern.test(control.value.toLowerCase())) {
        return { patternInvalid: true };
      }
      return null;
    };
  }

  customNameValidator() {
    return (control: { value: string }) => {
      const trimmedValue = control.value.trim();
      const pattern = /^[a-zA-Z]+$/;

      if (trimmedValue === '') {
        return { required: true };
      } else if (!pattern.test(trimmedValue)) {
        return { patternInvalid: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('loggedInUser');
    const emulateuserData = localStorage.getItem('emulatedUser');
    if (emulateuserData) {
      this.loggedInUser = JSON.parse(emulateuserData);
    } else if (userData) {
      this.loggedInUser = JSON.parse(userData);
    }

    const isFromOverview = this.route.snapshot.paramMap.get('tab');
    const orgId = this.route.snapshot.paramMap.get('organizationId')!;
    if (
      orgId !== this.loggedInUser.organizationId &&
      this.loggedInUser.roleName !== AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.router.navigate(['/unauthorized']);
    }

    if (isFromOverview) {
      this.isOrgProspective = true;
      this.getOrganizationList(orgId);
    } else {
      this.getOrganizationList();
    }

    if (this.organizationId && this.userId) {
      this.pagesize = 0;
      this.jobperpage = 0;
    }
    this.jobFilterCtrl.valueChanges
      .pipe(
        debounceTime(300),
        tap(() => {
          // reset paging when typing
          this.pagesize = 1;
          this.allJobsLoaded = false;
          this.orgJobList = []; // CLEAR old list
        }),
        switchMap((searchTerm) => {
          this.searchText = searchTerm;
          return this.fetchFilteredJobs(searchTerm);
        })
      )
      .subscribe((jobs: JobTitle[]) => {
        this.orgJobList = jobs; // Save locally
        this.filteredJobs.next(jobs); // Update dropdown list
      });
  }

  fetchFilteredJobs(searchTerm: string): Observable<JobTitle[]> {
    return this.jobTitleService
      .getAllOrganizationJobTitle(
        this.selectedOrganization.organizationId,
        this.jobtitleId, // Ensure this is valid
        this.jobperpage,
        this.pagesize,
        searchTerm
      )
      .pipe(
        tap((res: JobTitle[]) => {
          // If there are jobs returned, append them to the list
          if (res && res.length > 0) {
            // Append to the original job list
            this.orgJobList = [...this.orgJobList, ...res];

            // Update the filtered list with the latest results
            this.filteredJobs.next([...this.filteredJobs.value, ...res]);
          } else {
            // If no more jobs, set the allJobsLoaded flag to true
            this.allJobsLoaded = true;
          }
        })
      );
  }

  getOrganizationList(orgId?: string) {
    this.isLoading = true;
    this.orgService
      .getOrganization(orgId || '', this.loggedInUser.applicationUserId)
      .subscribe({
        next: (res) => {
          this.orgList = res.filter((x) => x.isActive);
          if (this.isEditMode) {
            this.userService
              .getOrganizationUsers(
                this.userId,
                this.loggedInUser.applicationUserId
              )
              .subscribe({
                next: (response) => {
                  this.userOrganization = response[0];
                  this.selectOrganization(
                    this.orgList.find(
                      (org) =>
                        org.organizationId ===
                        this.userOrganization.organizationId
                    )!
                  );
                  this.isLoading = false;
                },
                error: (err: HttpErrorResponse) => {
                  this.isLoading = false;
                  this.toastr.error(AppConstants.DefaultError.Error);
                },
              });
          } else {
            const orgFromRoute =
              this.route.snapshot.paramMap.get('organizationId');
            if (orgFromRoute) {
              this.selectOrganization(
                this.orgList.find((org) => org.organizationId === orgFromRoute)!
              );
            } else {
              this.selectOrganization(this.orgList[0]);
            }
          }

          this.filteredorgs = this.orgfilterctrl.valueChanges.pipe(
            startWith(''),
            map((org) =>
              org ? this._filterOrganizations(org) : this.orgList.slice()
            )
          );
        },
      });
  }

  private _filterOrganizations(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.orgList.filter((org) =>
      org.name.toLowerCase().includes(filterValue)
    );
  }

  getUserOrganization() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers(
        this.userId,
        this.loggedInUser.applicationUserId,
        this.organizationId
      )
      .subscribe({
        next: (res) => {
          this.userOrganization = res[0];
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toastr.error(AppConstants.DefaultError.Error);
        },
      });
  }

  selectOrganization(organization: Organization) {
    this.selectedOrganization = organization;
    this.userForm.patchValue({
      organizationId: organization.organizationId,
    });
    if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin
    ) {
      this.userForm.get('jobTitleId')?.setValidators(Validators.required);
    } else {
      this.userForm.get('jobTitleId')?.clearValidators();
    }
    this.userForm.get('jobTitleId')?.updateValueAndValidity();

    this.managerList = [];

    this.isLoading = true;

    forkJoin({
      teams: this.teamService.getOrganizationTeams(
        this.selectedOrganization.organizationId,
        ''
      ),
      interests: this.interestService.getAllInterest(this.userId || '', ''),
      jobs: this.jobTitleService.getAllOrganizationJobTitle(
        this.selectedOrganization.organizationId,
        '',
        this.jobperpage,
        this.pagesize,
        this.searchText
      ),
      roles: this.roleService.getOrganizationRoles(),
      users: this.userService.getOrganizationUsers(
        '',
        this.loggedInUser.applicationUserId,
        this.selectedOrganization.organizationId
      ),
    })
      .pipe(
        tap(({ teams, interests, jobs, roles, users }) => {
          this.getOrganizationInterests(interests);
          this.getOrganizationTeams(teams);
          this.getOrganizationJobs(jobs);
          this.getOrganizationRoles(roles);
          this.getManagerList(users);

          if (
            this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager
          ) {
            this.assignManager(this.loggedInUser.applicationUserId);
            this.assignedManager = this.loggedInUser;
          }

          if (this.isEditMode) {
            this.getUserToEdit();
          }
        }),
        concatMap((res) => {
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        error: (err) => {
          this.isLoading = false;
          this.toastr.error('An unexpected error occurred.');
        },
      });
  }

  getOrganizationSkills(skills: Skill[]) {
    this.orgSkillList = skills;
    this.filteredSkills = this.skillFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((skill) =>
        skill ? this._filterSkills(skill) : this.orgSkillList.slice()
      )
    );
    this.selectedSkillsControl.valueChanges.subscribe((selected) => {
      this.selectedSkills = selected;
      this.getSelectedSkillsText();
      this.updateSelectedSkills();
    });
  }

  public _filterSkills(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.orgSkillList.filter((skill) =>
      skill.name.toLowerCase().includes(filterValue)
    );
  }

  getOrganizationInterests(interests: Interest[]) {
    this.orgInterestList = interests;
    this.filteredInterests = this.interestFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((interest) =>
        interest
          ? this._filterInterests(interest)
          : this.orgInterestList.slice()
      )
    );
    this.selectedInterestsControl.valueChanges.subscribe((selected) => {
      this.selectedInterests = selected;
      this.getSelectedInterestsText();
      this.updateSelectedInterests();
    });
  }

  public _filterInterests(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.orgInterestList.filter((interest) =>
      interest.name.toLowerCase().includes(filterValue)
    );
  }

  getOrganizationTeams(teams: Team[]) {
    this.orgTeamList = teams;
    this.filteredTeams = this.TeamFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((team) => (team ? this._filterTeams(team) : this.orgTeamList.slice()))
    );
  }

  private _filterTeams(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.orgTeamList.filter((team) =>
      team.name.toLowerCase().includes(filterValue)
    );
  }

  getOrganizationJobs(jobs: JobTitle[]) {
    this.orgJobList = jobs;
    this.filteredJobs.next(jobs); // Initialize the filtered jobs with the fetched jobs
    this.pagesize = 1; // Reset page size
    this.allJobsLoaded = false; // Reset "all jobs loaded" flag
  }
  onDropdownScroll() {
    this.pagesize++;
    this.fetchJobTitles(
      this.selectedOrganization.organizationId,
      '',
      this.jobperpage, // Number of items per page
      this.pagesize,
      this.searchText
    );
  }
  fetchJobTitles(
    orgId: string,
    organisationJobId: string,
    JobsPerPage: number,
    pageSize: number,
    searchText: string
  ): void {
    // Start loading while fetching data

    // Fetching job titles with pagination
    this.jobTitleService
      .getAllOrganizationJobTitle(
        orgId,
        organisationJobId,
        JobsPerPage, // Number of items per page
        pageSize,
        searchText // Current page size
        // You can use this searchText if you need filtering
      )
      .subscribe({
        next: (res) => {
          // Check if results are returned
          if (res && res.length > 0) {
            this.orgJobList = [...this.orgJobList, ...res];
            const updatedJobs = [...this.filteredJobs.value, ...res];
            this.filteredJobs.next(updatedJobs);
          } else {
            this.allJobsLoaded = true;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching job titles:', err);
        },
      });
  }

  getOrganizationRoles(roles: Role[]) {
    this.roles = []; // Reset roles array

    if (
      this.loggedInUser.roleName ===
        AppConstants.ChasmanovoRoles.Global_admin &&
      this.selectedOrganization.isGlobalOrg === true
    ) {
      // Global admin + global org: allow all roles
      this.roles = roles;
    } else if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.Global_admin
    ) {
      // Global admin + other org: allow all except Global_admin
      roles.forEach((role) => {
        if (role.name !== AppConstants.ChasmanovoRoles.Global_admin) {
          this.roles.push(role);
        }
      });
    } else if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.admin
    ) {
      // Admin: all except Global_admin
      roles.forEach((role) => {
        if (role.name !== AppConstants.ChasmanovoRoles.Global_admin) {
          this.roles.push(role);
        }
      });
    } else if (
      this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager
    ) {
      // Manager: all except Global_admin and admin
      roles.forEach((role) => {
        if (
          role.name !== AppConstants.ChasmanovoRoles.Global_admin &&
          role.name !== AppConstants.ChasmanovoRoles.admin
        ) {
          this.roles.push(role);
        }
      });
    } else {
      // Others: only learner
      roles.forEach((role) => {
        if (role.name === AppConstants.ChasmanovoRoles.learner) {
          this.roles.push(role);
        }
      });
    }
  }

  getManagerList(users: ApplicationUser[]) {
    users.forEach((user) => {
      if (
        user.roleName == AppConstants.ChasmanovoRoles.manager &&
        user.isActive
      )
        this.managerList.push(user);
    });
    if (this.loggedInUser.roleName === AppConstants.ChasmanovoRoles.manager) {
      this.assignManager(this.loggedInUser.applicationUserId);
      this.assignedManager = this.loggedInUser;
    }
  }

  getUserToEdit() {
    this.isLoading = true;
    this.userService
      .getOrganizationUsers(
        this.userId,
        this.loggedInUser.applicationUserId,
        this.organizationId
      )
      .subscribe({
        next: (res) => {
          this.userToEdit = res[0];
          this.populateUserForm();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toastr.error('An unexpected error occurred.');
        },
      });
  }

  populateUserForm() {
    var formattedDate: string | null = null;

    if (this.userToEdit.dateOfBirth) {
      formattedDate = this.datePipe.transform(
        this.userToEdit.dateOfBirth,
        'yyyy-MM-dd'
      );
    }

    if (this.userToEdit) {
      this.userForm.patchValue({
        firstName: this.userToEdit.firstName,
        middleName: this.userToEdit.middleName,
        lastName: this.userToEdit.lastName,
        email: this.userToEdit.email,
        dateOfBirth: formattedDate,
        gender: this.userToEdit.gender,
        isMentor: this.userToEdit.isMentor,
        address1: this.userToEdit.address1,
        address2: this.userToEdit.address2,
        city: this.userToEdit.city,
        district: this.userToEdit.district,
        state: this.userToEdit.state,
        zip: this.userToEdit.zip,
        country: this.userToEdit.country,
        phoneNumber: this.userToEdit.phoneNumber,
        jobTitleId: this.userToEdit.jobTitleId,
        organisationTeamId: this.userToEdit.organizationTeamId,
        roleId: this.userToEdit.roleId,
        organizationId: this.userToEdit.organizationId,
        managerId: this.assignedManager?.applicationUserId,
        responsibility: this.userToEdit.responsibility,
      });

      this.selectedJobTitle = this.orgJobList.find(
        (job) => job.chasmaNOVOJobTitleId === this.userToEdit.jobTitleId
      )!;
      this.selectJobTitle(this.selectedJobTitle);

      this.userToEdit.userSkills.forEach((skillId) => {
        const selectedSkill = this.orgSkillList.find(
          (skill) => skill.chasmaNOVOSkillId === skillId
        );
        if (selectedSkill) {
          this.selectedSkills.push(selectedSkill);
          this.selectedSkillsControl.setValue(this.selectedSkills);
        }
      });
      this.getSelectedSkillsText();
      this.updateSelectedSkills();

      this.userToEdit.userInterests.forEach((interestId) => {
        const selectedInterest = this.orgInterestList.find(
          (interest) => interest.chasmaNOVOInterestId === interestId
        );
        if (selectedInterest) {
          this.selectedInterests.push(selectedInterest);
          this.selectedInterestsControl.setValue(this.selectedInterests);
        }
      });

      this.getSelectedInterestsText();
      this.updateSelectedInterests();

      const teamIndex = this.orgTeamList.findIndex(
        (team) => team.organizationTeamId === this.userToEdit.organizationTeamId
      )!;

      this.selectedTeam = this.orgTeamList[teamIndex];

      const roleIndex = this.roles.findIndex(
        (role) => role.roleId === this.userToEdit.roleId
      )!;

      this.selectedRole = this.roles[roleIndex];

      const managerIndex = this.managerList.findIndex(
        (user) => user.applicationUserId === this.userToEdit.managerId
      )!;

      this.assignedManager = this.managerList[managerIndex];

      this.selectedGender = this.userToEdit.gender;

      if (this.userToEdit.profileImagePath) {
        this.selectedImage = this.userToEdit.profileImagePath +=
          '?t=' + new Date().getTime(); // Cache busting;
      } else {
        this.selectedImage = this.userToEdit.profileImagePath;
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initUserMap(), 50);
  }

  async initUserMap() {
    if (!this.userMapRef || !isPlatformBrowser(this.platformId)) return;
    this.L = await import('leaflet');

    const iconRetinaUrl =
      'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
    const iconUrl =
      'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
    const shadowUrl =
      'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';
    const iconDefault = this.L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    this.L.Marker.prototype.options.icon = iconDefault;

    // default center (change if you want)
    const defaultLat = this.selectedLat ?? 20.5937;
    const defaultLng = this.selectedLng ?? 78.9629;

    this.map = this.L.map(this.userMapRef.nativeElement, {
      center: [defaultLat, defaultLng],
      zoom: 4,
      attributionControl: false,
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // if coordinates already present, place marker
    if (this.selectedLat != null && this.selectedLng != null) {
      this.placeMarker(this.selectedLat, this.selectedLng);
      this.map.setView([this.selectedLat, this.selectedLng], 12);
    }

    // click to place marker when pinning enabled
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.enablePinning) return;
      const { lat, lng } = e.latlng;
      this.placeMarker(lat, lng);
      this.selectedLat = lat;
      this.selectedLng = lng;

      // set form fields if present, otherwise patch value keys 'latitude'/'longitude'
      if (this.userForm && this.userForm.contains('latitude')) {
        this.userForm.get('latitude')!.setValue(lat.toString());
      } else {
        this.userForm.patchValue({ latitude: lat.toString() });
      }
      if (this.userForm && this.userForm.contains('longitude')) {
        this.userForm.get('longitude')!.setValue(lng.toString());
      } else {
        this.userForm.patchValue({ longitude: lng.toString() });
      }
    });
  }

  placeMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      // Create marker and keep a local strong reference so TS knows it's defined
      const marker = this.L.marker([lat, lng], { draggable: true }).addTo(
        this.map
      );
      this.marker = marker;
      // update coords when marker dragged
      marker.on('dragend', (ev: any) => {
        // Guard against undefined target (per TypeScript typings)
        const target = ev && (ev.target as any);
        if (!target || typeof target.getLatLng !== 'function') {
          return;
        }
        const pos = target.getLatLng();
        if (!pos) {
          return;
        }
        this.selectedLat = pos.lat;
        this.selectedLng = pos.lng;
        this.userForm.patchValue({
          latitude: pos.lat.toString(),
          longitude: pos.lng.toString(),
        });
      });
    }
  }

  // Optionally update map when getGPSLocation resolves
  getGPSLocation(): void {
    const form = this.userForm.value;
    const parts = [
      // form.address1,
      // form.address2,
      form.city,
      form.district,
      form.state,
      form.zip,
      form.country,
    ];
    const fullAddress = parts
      .filter((p) => p && p.trim().length > 0)
      .join(', ');

    if (fullAddress.length > 0) {
      this.isFetchingLocation = true;
      this.mapDataService.getCoordinates(fullAddress).subscribe({
        next: (res) => {
          this.isFetchingLocation = false;
          if (res && res.latitude && res.longitude) {
            this.updateMapLocation(Number(res.latitude), Number(res.longitude));
          } else {
            this.getBrowserLocation();
          }
        },
        error: () => {
          this.isFetchingLocation = false;
          // Fallback to browser location on error
          this.getBrowserLocation();
        },
      });
    } else {
      this.getBrowserLocation();
    }
  }

  searchLocation(): void {
    const address = this.locationSearchCtrl.value;
    if (address && address.trim().length > 0) {
      this.isFetchingLocation = true;
      this.mapDataService.getCoordinates(address).subscribe({
        next: (res) => {
          this.isFetchingLocation = false;
          if (res && res.latitude && res.longitude) {
            this.updateMapLocation(Number(res.latitude), Number(res.longitude));
          } else {
            this.toastr.warning('Location not found.');
          }
        },
        error: () => {
          this.isFetchingLocation = false;
          this.toastr.error('Error searching for location.');
        },
      });
    }
  }

  getBrowserLocation() {
    if (!navigator.geolocation) {
      this.toastr.error('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.updateMapLocation(lat, lng);
      },
      (err) => {
        console.error(err);
        this.toastr.warning(
          'Unable to get browser location. Please ensure location services are enabled.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  updateMapLocation(lat: number, lng: number) {
    this.selectedLat = lat;
    this.selectedLng = lng;
    this.userForm.patchValue({
      latitude: lat.toString(),
      longitude: lng.toString(),
    });

    if (this.map) {
      if (!this.marker) {
        this.placeMarker(lat, lng);
      } else {
        this.marker.setLatLng([lat, lng]);
      }
      this.map.setView([lat, lng], 14);
    }
  }

  selectJobTitle(jobTitle: JobTitle) {
    this.selectedJobTitle = this.orgJobList.find(
      (job) => job.chasmaNOVOJobTitleId === jobTitle.chasmaNOVOJobTitleId
    )!;
    // Update the form with the selected job title's ID
    this.userForm.patchValue({
      jobTitleId: this.selectedJobTitle.chasmaNOVOJobTitleId,
    });
    // Fetch skills related to the selected job title
    this.skillService
      .getAllJobSkills(
        this.selectedOrganization.organizationId,
        this.selectedJobTitle.chasmaNOVOJobTitleId
      )
      .subscribe({
        next: (res) => {
          this.orgSkillList = res;
          this.getOrganizationSkills(this.orgSkillList);
        },
      });
  }

  selectInterest(event: any) {
    this.selectedInterests = event.value;
    this.updateSelectedInterests();
  }

  selectSkill(event: any) {
    this.selectedSkills = event.value;
    this.updateSelectedSkills();
  }

  selectTeam(organisationTeamId: Team) {
    this.selectedTeam = this.orgTeamList.find(
      (team) =>
        team.organizationTeamId === organisationTeamId.organizationTeamId
    )!;
    this.userForm.patchValue({
      organisationTeamId: this.selectedTeam.organizationTeamId,
    });
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
    this.userForm.patchValue({
      gender: gender,
    });
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    if (this.selectRole.name !== AppConstants.ChasmanovoRoles.learner)
      this.assignedManager = undefined;
    this.userForm.patchValue({
      roleId: role.roleId,
    });
  }

  assignManager(managerId: string) {
    this.assignedManager = this.managerList.find(
      (user) => user.applicationUserId === managerId
    )!;
  }

  addUser() {
    if (this.userForm.valid) {
      this.userToEdit = {
        applicationUserId: this.isEditMode
          ? this.userToEdit.applicationUserId || this.userId
          : '',
        organizationId: this.selectedOrganization.organizationId,
        organizationName: this.selectedOrganization.name,
        isEmailVerified: true,
        firstName: this.userForm.get('firstName')!.value!,
        middleName: this.userForm.get('middleName')!.value!,
        lastName: this.userForm.get('lastName')!.value!,
        email: this.userForm.get('email')!.value!,
        userName: this.userForm.get('email')!.value!,
        profileImagePath: this.selectedImage,
        dateOfBirth: this.userForm.get('dateOfBirth')?.value!
          ? new Date(this.userForm.get('dateOfBirth')!.value!)
          : null,
        gender: this.userForm.get('gender')!.value! || this.selectedGender,
        isMentor: this.userForm.get('isMentor')!.value!,
        address1: this.userForm.get('address1')!.value!,
        address2: this.userForm.get('address2')!.value!,
        city: this.userForm.get('city')!.value!,
        district: this.userForm.get('district')!.value!,
        state: this.userForm.get('state')!.value!,
        zip: this.userForm.get('zip')!.value!,
        country: this.userForm.get('country')!.value!,
        phoneNumber: this.userForm.get('phoneNumber')!.value!,
        responsibility: this.userForm.get('responsibility')!.value!,
        latitude: this.userForm.get('latitude')!.value!,
        longitude: this.userForm.get('longitude')!.value!,

        jobTitleId:
          this.userForm.get('jobTitleId')!.value! ??
          this.selectedJobTitle.chasmaNOVOJobTitleId,
        organizationTeamId:
          this.userForm.get('organisationTeamId')!.value! ||
          this.selectedTeam?.organizationTeamId ||
          '',
        userInterests: this.userForm.get('organizationInterestIds')!.value!,
        userSkills: this.userForm.get('organizationSkillIds')!.value!,

        isActive: this.isEditMode ? this.userToEdit.isActive : true,
        managerId: this.assignedManager?.applicationUserId || '',
        roleId: this.selectedRole.roleId || this.userForm.get('roleId')!.value!,
        roleName: this.selectedRole.name,
      };
    }

    if (!this.isEditMode) {
      const addUserCommand = {
        organizationId: this.selectedOrganization.organizationId,
        firstName: this.userToEdit.firstName,
        middleName: this.userToEdit.middleName,
        lastName: this.userToEdit.lastName,
        email: this.userToEdit.email,
        userName: this.userToEdit.email,
        profileImagePath: this.userToEdit.profileImagePath,
        dateOfBirth: this.userToEdit.dateOfBirth,
        gender: this.userToEdit.gender,
        isMentor: this.userToEdit.isMentor,
        address1: this.userToEdit.address1,
        address2: this.userToEdit.address2,
        city: this.userToEdit.city,
        district: this.userToEdit.district,
        state: this.userToEdit.state,
        zip: this.userToEdit.zip,
        country: this.userToEdit.country,
        phoneNumber: this.userToEdit.phoneNumber,
        isActive: this.userToEdit.isActive,
        userInterests: this.userToEdit.userInterests,
        OrgJobTitleId: this.userToEdit.jobTitleId,
        teamId: this.userToEdit.organizationTeamId,
        UserSkills: null,
        managerId: this.userToEdit.managerId,
        roleId: this.userToEdit.roleId,
        responsibility: this.userToEdit.responsibility,
        latitude: this.userToEdit.latitude,
        longitude: this.userToEdit.longitude,
      };

      this.isLoading = true;
      this.userService.addOrganizationUser(addUserCommand).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.isLoading = false;
            this.toastr.success('User Created', '', {
              timeOut: 3000,
              closeButton: true,
            });

            this.location.back();
          } else {
            this.isLoading = false;
            this.toastr.error(res.message);
          }
        },
        error: (err: HttpErrorResponse) => {
          let errormsg = err.error['UsersOrganizations'] || err.error.error;
          this.toastr.error(errormsg);
          this.isLoading = false;
        },
      });
    } else {
      const updateUserCommand = {
        applicationUserId: this.userToEdit.applicationUserId,
        organizationId: this.userToEdit.organizationId,
        firstName: this.userToEdit.firstName,
        middleName: this.userToEdit.middleName,
        lastName: this.userToEdit.lastName,
        email: this.userToEdit.email,
        userName: this.userToEdit.email,
        profileImagePath: this.selectedImage,
        dateOfBirth: this.userToEdit.dateOfBirth,
        gender: this.userToEdit.gender,
        isMentor: this.userToEdit.isMentor,
        address1: this.userToEdit.address1,
        address2: this.userToEdit.address2,
        city: this.userToEdit.city,
        district: this.userToEdit.district,
        state: this.userToEdit.state,
        zip: this.userToEdit.zip,
        country: this.userToEdit.country,
        phoneNumber: this.userToEdit.phoneNumber,
        isActive: this.userToEdit.isActive,
        jobTitleId: this.userToEdit.jobTitleId,
        teamId: this.userToEdit.organizationTeamId,
        userInterests: this.userToEdit.userInterests,
        userSkills: this.userToEdit.userSkills,
        managerId: this.userToEdit.managerId,
        roleId: this.userToEdit.roleId,
        responsibility: this.userToEdit.responsibility,
        latitude: this.userToEdit.latitude,
        longitude: this.userToEdit.longitude,
      };

      this.isLoading = true;
      this.userService.updateOrganizationUser(updateUserCommand).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.isLoading = false;
            this.toastr.success('User Updated', '', {
              timeOut: 3000,
              closeButton: true,
            });

            // If LoggedIn user updated himself then update the loacal Storage
            if (
              updateUserCommand.applicationUserId ===
              this.loggedInUser.applicationUserId
            ) {
              localStorage.removeItem('loggedInUser');
              localStorage.setItem(
                'loggedInUser',
                JSON.stringify(this.userToEdit)
              );
            }

            this.location.back();
          } else {
            this.isLoading = false;
            this.toastr.error(res.message);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.toastr.error('An unexpected error occurred.');
        },
      });
    }
  }

  back() {
    this.location.back();
  }

  getSelectedSkillsText() {
    const selectedSkills = this.selectedSkillsControl.value;
    if (!selectedSkills || selectedSkills.length === 0) {
      this.selectedSkillsText = '--selectskill--';
    } else if (selectedSkills.length === 1) {
      this.selectedSkillsText = selectedSkills[0].name;
    } else {
      this.selectedSkillsText = `${selectedSkills[0].name} + ${
        selectedSkills.length - 1
      } more`;
    }
  }

  getSelectedInterestsText() {
    const selectedInterests = this.selectedInterestsControl.value;
    if (!selectedInterests || selectedInterests.length === 0) {
      this.selectedInterestText = '--selectInterest--';
    } else if (selectedInterests.length === 1) {
      this.selectedInterestText = selectedInterests[0].name;
    } else {
      this.selectedInterestText = `${selectedInterests[0].name} + ${
        selectedInterests.length - 1
      } more`;
    }
  }

  openUploadImageDialog() {
    const dialog = this.dialog.open(ImageUploadDialogComponent, {
      disableClose: true,
    });

    dialog.afterClosed().subscribe((imgString) => {
      if (imgString !== '' && imgString !== undefined) {
        this.selectedImage = imgString;
      }
    });
  }

  removeUploadedImage() {
    this.selectedImage = '';
  }

  checkAvatarPresence() {
    return (
      (this.selectedImage !== undefined && this.selectedImage !== '') ||
      this.userForm.get('firstName')!.value! !== '' ||
      this.userForm.get('lastName')!.value! !== ''
    );
  }

  resetPassword(email: string) {
    this.isLoading = true;
    const command: ForgotPasswordCommand = {
      email: email,
    };
    this.loginservice.forgotPassword(command).subscribe({
      next: (res) => {
        this.toastr.success('Reset Password mail sent successfully', '', {
          timeOut: 3000,
          closeButton: true,
        });
        this.isLoading = false;
        this.location.back();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('An unexpected error occurred.');
      },
    });
  }

  isNameValid(): boolean {
    const firstName = this.userForm.get('firstName')?.value || '';
    const lastName = this.userForm.get('lastName')?.value || '';
    const namePattern = /^[a-zA-Z]+$/;
    return namePattern.test(firstName) || namePattern.test(lastName);
  }

  getFullName(): string {
    let firstName = this.userForm.get('firstName')?.value || '';
    let lastName = this.userForm.get('lastName')?.value || '';

    if (!isNaN(Number(firstName))) firstName = '';
    if (!isNaN(Number(lastName))) lastName = '';
    return `${firstName} ${lastName}`;
  }

  updateSelectedInterests() {
    const selectedInterestIds: any = this.selectedInterests.map(
      (interest) => interest.chasmaNOVOInterestId
    );
    this.userForm.patchValue({
      organizationInterestIds: selectedInterestIds,
    });
  }

  updateSelectedSkills() {
    const selectedSkillIds: any = this.selectedSkills.map(
      (skill) => skill.chasmaNOVOSkillId
    );
    this.userForm.patchValue({
      organizationSkillIds: selectedSkillIds,
    });
  }
}
