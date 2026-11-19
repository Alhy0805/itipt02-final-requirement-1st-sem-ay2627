import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MainService } from './main-service';

describe('MainService', () => {
  let service: MainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainService);
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets the total from current account balances', async () => {
    localStorage.setItem('finance-user', JSON.stringify({ user_id: 42 }));
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ balance: '125.00' }, { balance: '500.00' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(service.getTotalBalance()).resolves.toBe(625);

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/accounts/42');
  });
});
