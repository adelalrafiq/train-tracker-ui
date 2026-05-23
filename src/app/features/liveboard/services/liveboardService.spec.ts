import { TestBed } from '@angular/core/testing';

import { LiveboardService } from './liveboardService';

describe('LiveboardService', () => {
  let service: LiveboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
