import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { userOwnershipGuard } from './user-ownership.guard';

describe('userOwnershipGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => userOwnershipGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
