export class AppConstants {
  public static DefaultError = {
    Error: 'Something went wrong, please try again',
    ConnectionError: 'Please check your connection and try again',
    UnknownError:
      'Something went wrong we keep track of these errors and our team will resolve it as soon as possible, meanwhile refresh the page and try again',
  };

  public static ChasmanovoRoles = {
    Global_admin: 'GlobalAdmin',
    admin: 'Admin',
    manager: 'Manager',
    learner: 'Learner',
  };
  public static LocalStorage = {
    IsLoggedIn: 'IsLoggedIn',
    Email: 'email',
    UserId: 'userid',
    UserName: 'username',
    APIToken: 'apitoken',
    NotificationDismissed: 'notificationDismissed',
    HorseSubscriptionIsCancelled: 'horseSubscriptionIsCancelled',
    ProfileImage: 'profileImagePath',
    organizationId: 'organizationId',
    organizationName: 'organizationName',
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    dateOfBirth: 'dateOfBirth',
    gender: 'gender',
    isMentor: 'isMentor',
    address1: 'address1',
    address2: 'address2',
    city: 'city',
    district: 'district',
    state: 'state',
    zip: 'zip',
    country: 'country',
    phoneNumber: 'phoneNumber',
    isActive: 'isActive',
    jobTitleId: 'jobTitleId',
    organizationTeamId: 'organizationTeamId',
    managerId: 'managerId',
    roleId: 'roleId',
    roleName: 'roleName',
    isEmailVerified: 'isEmailVerified',
    sKillPassport: 'sKillPassport',
    responsibility: 'responsibility',
  };
}
