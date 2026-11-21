import { TestBed } from '@angular/core/testing';
import { ApiHTTPClient } from './api-httpclient';

describe('ApiHTTPClient', () => {
  let service: ApiHTTPClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiHTTPClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
