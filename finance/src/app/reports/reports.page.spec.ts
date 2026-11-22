import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainService } from '../services/main-service';
import { ReportsPage } from './reports.page';

describe('ReportsPage', () => {
  let component: ReportsPage;
  let fixture: ComponentFixture<ReportsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [MainService, provideHttpClient()],
    }).compileComponents();
    fixture = TestBed.createComponent(ReportsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the financial workbook export', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Generate Excel report');
    expect(fixture.nativeElement.textContent).toContain('transactions');
  });
});
