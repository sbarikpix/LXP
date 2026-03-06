import exp from 'constants';
import {
  questionDetails,
  skillDetails,
} from '../services/assessment-services.service';

export interface ApplicationUser {
  applicationUserId: string;
  organizationId: string;
  organizationName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  userName: string;
  profileImagePath: string;
  dateOfBirth: Date | null;
  gender: string;
  address1: string;
  address2: string;
  city: string;
  district: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber: string;
  isActive: boolean;
  userInterests: string[];
  jobTitleId: string;
  organizationTeamId: string;
  userSkills: string[];
  managerId: string;
  roleId: string;
  roleName?: string;
  isEmailVerified: boolean;
  sKillPassport?: any;
  responsibility?: string;
  isMentor?: boolean;
  latitude?: string;
  longitude?: string;
}

export interface Interest {
  chasmaNOVOInterestId: string;
  name: string;
  description: string;
}

export interface JobTitle {
  chasmaNOVOJobTitleId: string;
  name: string;
  description: string;
  organizationTypeId: string;
  usersCount: number;
  organizationId: string;
}

export interface Organization {
  organizationId: string;
  name: string;
  url: string;
  email: string;
  imagePath: string;
  address1: string;
  address2: string;
  city: string;
  district: string;
  state: string;
  zip: string;
  country: string;
  phoneNumber: string;
  fax: string;
  isActive: boolean;
  updatedby: string;
  organizationTypeId: string;
  isGlobalOrg?: boolean;
}

export interface OrganizationType {
  organizationTypeId: string;
  organizationTypeName: string;
}

export interface Role {
  roleId: string;
  name: 'Admin' | 'Learner' | 'Manager';
}

export interface Skill {
  chasmaNOVOSkillId: string;
  name: string;
  description: string;
  chasmaNOVOJobSetId: string;
}

export interface SkillLevel {
  levelId: string;
  levelValue: string;
}

export interface Team {
  organizationTeamId: string;
  organizationId: string;
  name: string;
  description: string;
  updatedBy: string;
  usersCount: number;
  createdOn?: any;
}

export interface GetallOrgsquery {
  page: number;
  pagesize: number;
  filters?: any;
  sortField?: any;
  sortOrder?: any;
  tab?: string;
  loggedInUserId: string;
  organizationId?: string;
  skills?: UserSkillsModel[];
}

export interface GetallOrgUsersquery {
  page: number;
  pagesize: number;
  filters?: any;
  sortField?: any;
  sortOrder?: any;
  tab?: string;
  loggedInUserId: string;
  organizationId: string;
}

export interface OrganizationResponse {
  total: number;
  totalActive: number;
  totalInactive: number;
  organizations: Organization[];
}

export interface OrganizationUserResponse {
  total: number;
  totalActive: number;
  totalInactive: number;
  platformOrgsCount: number;
  platformUsersCount: number;
  platformLearningJourneys: number;
  orgusers: ApplicationUser[];
}

export interface GetallQuestions {
  userId: string;
  organaizationId: string;
}

export interface QuestionModel {
  questionId?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: string;
  levelId: string;
  skillId: string;
  marks: any;
  negativeMarks?: any;
  questiontypeId?: string;
  isActive?: any;
  orgId: string;
}

export interface QuestionResponseModel {
  total: number;
  questions: QuestionsList[];
}

export interface QuestionsList {
  question: string;
  questionType: string;
  questionTypeId: any;
  questionId: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: string;
  skillLevel: string;
  skillname: string;
  skillId: any;
  skillLevelId: any;
  marks: any;
  negativeMarks: any;
  isActive: any;
  selected?: boolean;
  organizationId?: string;
}

export interface QuestionTypeModel {
  questionTypeId: string;
  questionType: string;
}

export interface LevelModel {
  levelId: string;
  levelValue: string;
}

export interface UserSkillsModel {
  skillId: any;
  userId?: string;
  skillName?: string;
  skillLevelId: string;
  proficiencyValue?: any;
  gradient?: any;
  experience?: any;
  certificatePath?: any;
  sumTotalSkillId?: any;
  integrationId?: any;
  jobTitleName?: string;
}

export interface UpdateUserSkillModel {
  userId: string;
  skillId: string;
  organizationId: string;
  levelId: string;
  experience: any;
  certificate: any;
}

export interface UserModel {
  userId: string;
  fullName: string;
  userName: string;
  status: string;
  score: string;
  isTakenPreassessment?: any;
  skillsData: Skills[];
}
export interface SubmittedQuestions {
  userId: string;
  organizationId: string;
  skillId: string;
  skillLevelId: string;
  assignedBy: string;
  IPAddress: string;
  examQuestions: ExamQuestionsModel[];
}

export interface GetQuestionPaperResponse {
  userId: string;
  assessmentName?: string;
  organizationId?: string;
  assessmentType?: string;
  userAssignedAssessmentId?: string;
  skills: Skills[];
}

export interface Skills {
  skillId: string;
  skillName: string;
  skillLevelId: string;
  skillLevelName: string;
  examQuestions?: ExamQuestionsModel[];
}

export interface ExamQuestionsModel {
  questionId: string;
  questionType: string;
  questionTypeId: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  userAnswer?: any;
  correctAnswer: any;
  marks?: number;
  negativeMarks?: number;
}

export interface AssessmentResponse {
  obtainedMarks: any;
  totalMarks: any;
}

export interface ScheduleData {
  userId: string;
  examScheduleDate: any;
  scheduleduserId: string;
  assessmentName?: any;
  questionDetails?: questionDetails[];
  questionBanks: questionBank[];
  numberOfQuestions: number;
  skillDetails: skillDetails[];
}

export interface questionBank {
  questionBankId: string;
}

export interface UserSkillRating {
  userSkillRatingId: string;
  ratingValue: string;
  applicationUserId: string;
  chasmaNOVOSkillSetId: string;
}

export interface SelectedSkills {
  assessmentName?: string;
  selectedskills: UserSkillsModel[];
  questionIds: questionDetails[];
}

export interface SelectedSkillbank {
  assessmentName?: string;
  selectedskills: UserSkillsModel[];
  questionBankId: questionBank[];
}

export interface AddIntegration {
  integrationId?: string;
  integrationName: string;
  orgId: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  grantType: string;
  baseUrl: string;
  description?: string;
  iconPath?: string;
}

export interface GetScheduledAssessmentsResponseModel {
  userAssignedAssessmentId: string;
  assessmentName: string;
  managerId: string;
  managerName: string;
  managerImage: string;
  skillsData: GetScheduledAssessmentsSkills[];
  questionsData: questionDetails[];
  learnerId: string;
  learnerName: string;
  assignedDate: any;
  isCompleted: any;
  completedData: any;
}

export interface UserAssignedContent {
  userAssignedContentId?: any;
  assignedToUserId?: any;
  assignedToUserName?: any;
  assignedUserId?: any;
  assignedUserName?: any;
  assignedUserImage?: any;
  chasmaNOVOSKillId?: any;
  chasmaNOVOSkillName?: any;
  contentTitle?: any;
  createdOn?: any;
  isRead?: any;
  levelId?: any;
  levelName?: any;
  updatedOn?: any;
}

export interface GetScheduledAssessmentsSkills {
  skillId: string;
  skillName: string;
  levelId: string;
  levelName: string;
}

export interface GetAllCoursesResponse {
  activityId: string;
  activityName: string;
  activityDescription: string;
  registered: string;
  cbtLaunchMtd: string;
  cbtPath: string;
  startDate: string;
  activityImageUrl: string;
  activityType: string;
  activityTypeId: number;
  activityCode: string;
  leMtd: number;
  isCourseDownloaded: boolean;
  maxAttemptsPerParent: number;
  maxAttempts: number;
  minPctGrd: number;
  maxTriesLeft: number;
  maxAttemptsLeft: number;
  status: number;
  dateAssigned: string;
  exactDueDate: string;
  endDate: string;
  childActivity: boolean;
  xapiEnabled: number;
  isFavorite: boolean;
  moocProviderId: string;
  isActive: number;
  isMobileEnabled: number;
  isAssigned: number;
  optionalText1: string;
  optionalInteger1: number;
  createdDate: string;
  lastUpdatedDate: string;
  authorId: number;
  launchUrl: string;
  userContentId: any;
  applicationUserId: any;
  organizationId: any;
  title: any;
  thumbnail: any;
  description: any;
  contentPath: any;
  chasmaNOVOSkillId: any;
  levelId: any;
  createdOn: any;
}

export interface UserDataModel {
  fullname: string;
  email: string;
  mobile: string;
  jobtitle: string;
  gender: string;
  dateofbirth: any;
  skills: UserSkillsModel[];
}

//User badge response model

export interface badgeCriteria {
  badgeCriteriaId: string;
  organizationId: string;
  organizationName: string;
  chasmaNOVOJobTitleName: string;
  levelValue: string;
  badgeName: string;
  badgeDescription: string;
  badgeImage: string;
  createdOn: string;
}

export interface badgesdata {
  badgeId: string;
  name: string;
  organizationId: string;
  applicationUserId: string;
  description: string;
  organizationName: string;
  levelId: string;
  levelName: string;
  badgeUrl: string;
  isActive: string;
  createdOn: string;
  updatedOn: string;
}

export interface userPoinResponses {
  applicationUserId?: string;
  userRank: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  points: string;
}

export interface UserBadge {
  userBadgeId: string;
  badgeId: string;
  name: string;
  description: string;
  badgeUrl: string;
  isActive: any;
  isLinkedIn: any;
  userName?: any;
  skillId: string;
  skillName: string;
  jobtitleName: string;
  levelId: string;
  levelName: string;
  createdOn: string;
  updatedOn: string;
  organizationName: string;
  userId?: string;
}

export interface UserContentCommand {
  userId: string;
  userContentId?: any;
  organizationId: string;
  title: string;
  description: string;
  skillId?: string;
  levelId?: string;
  file?: any;
  webURL?: any;
  thumbnail?: any;
}

export interface UserContentbySkillCommand {
  userId: string;
  // chasmaNovoSkills: skillslevels[];
  skillId: string;
  skillLevelId: string;
}

// export interface skillslevels {
//   skillId: string;
//   skillLevelId: string;
// }

export interface learningJourneyResponse {
  userLearningJourneyId?: any;
  learningJourneyId: any;
  learningJourneyTitle: any;
  learningImage: any;
  description: any;
  userId?: any;
  assignedUserId?: any;
  assignedUserImage?: any;
  assignedUserName?: any;
  assignedToUserName?: any;
  isAssigned?: any;
  isRead?: any;
  isCompleted?: any;
  chasmaNOVOJobTitleId: any;
  chasmaNOVOJobTitleName: any;
  organizationId: any;
  organizationName: any;
  isActive: any;
  createdOn: any;
  updatedOn: any;
  unlocked?: any;
}

export interface learningJourneyByIdResponse {
  userLearningJourneyId?: any;
  learningJourneyTitle: any;
  learningJourneyDescription: any;
  learningJourneyImage: any;
  learningJourneyJobTitleId: any;
  learningJourneyModuleId: any;
  learningJourneyModuleTitle: any;
  skillId: any;
  skillName: any;
  isCompleted?: any;
  createdOn: any;
  getLearningJourneySubModuleResponses: GetLearningJourneySubModuleResponse[];
  progress: any;
  totalModules?: any;
}

export interface GetLearningJourneySubModuleResponse {
  userLearningJourneyModuleId: any;
  learningJourneySubModuleId: any;
  learningJourneySubModuleName: any;
  levelId: any;
  levelName: any;
  createdOn: any;
  updatedOn: any;
  isCompleted: any;
}

export interface GetResumeDetailsResponse {
  userFullName: any;
  email: any;
  profileImage: any;
  city: any;
  district: any;
  country: any;
  state: any;
  mobile: any;
  address: any;
  jobTitleId: any;
  jobTitle: any;
  badges: Badge[];
  userSkills: UserSkills[];
  certificateId: any;
  certificate: any;
}

export interface UserSkills {
  skillId: any;
  skillName: any;
}
export interface Badge {
  badgeId: any;
  badgeName: any;
  description: any;
  badgeURL: any;
  levelId: any;
  levelName: any;
  badgeSkillId: any;
  badgeSkillName: any;
}

export interface Groups {
  groupId: any;
  groupName: any;
  description: any;
  isActive: boolean;
  createdBy: any;
  creatorName: any;
  createdOn: any;
  updatedOn: any;
  totalUsers: number;
}

export interface UpdateGroup {
  groupId?: string;
  groupName: string;
  description: string;
  isActive?: boolean;
  organizationId?: string;
  ruleMappings?: GroupRuleMappingUpdate[];
}

export interface GroupRuleMappingUpdate {
  groupRuleId?: string;
  groupRuleMappingId?: string;
  operator?: string;
  targetsOperator?: string;
  targetedValues?: string[];
  ruleType?: string;
  targetedRuleName?: string;
}

export interface UserOrgDeatils {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface GroupCommand {
  groupName: string;
  description: string;
  createdBy: string;
  ruleMappings: GroupRuleMappingDto[];
  applicationUsers?: UserOrgDeatils[];
}

export interface GroupRuleMappingDto {
  groupRuleId?: string;
  groupRuleMappingId?: string;
  operator?: string;
  targetsOperator?: string;
  targetedValues?: TargetValueDto[];
  ruleType?: string;
  targetedRuleName?: string;
  levelId?: string;
  organizationId?: string;
}

export interface TargetValueDto {
  targetValueId: string;
  value: string;
}

export interface GroupRules {
  groupRuleId: any;
  groupRuleName: any;
}

export interface GroupUsers {
  GroupUserId: string;
  GroupId: string;
  ApplicationUserId: string;
  AddedOn: string;
}

export interface QuestionBankModel {
  questionBankId?: string;
  title: string;
  chasmaNOVOSkillId?: string;
  skillName: string;
  levelId?: string;
  levelName?: string;
  totalQuestions?: number;
  organizationId: string;
}

export interface NotificationCommandModel {
  title: string;
  body: string;
  imageUrl?: string;
  data?: any;
}
