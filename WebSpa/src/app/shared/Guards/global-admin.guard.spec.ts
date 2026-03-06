import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { globalAdminGuard } from './global-admin.guard';

describe('globalAdminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => globalAdminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
