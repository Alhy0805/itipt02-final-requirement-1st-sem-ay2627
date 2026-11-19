import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceTestPage } from './service-test.page';

describe('ServiceTestPage', () => {
  let component: ServiceTestPage;
  let fixture: ComponentFixture<ServiceTestPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceTestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
