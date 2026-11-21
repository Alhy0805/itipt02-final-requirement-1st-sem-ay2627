import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { SavingGoalsPage } from './saving-goals.page';

describe('SavingGoalsPage', () => {
  let component: SavingGoalsPage;
  let fixture: ComponentFixture<SavingGoalsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SavingGoalsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-resources');
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('only deletes a goal and its contributions after confirmation', () => {
    const goal = { goal_id: 1, goal_name: 'Emergency fund', target_amount: 5000 };
    component.goals = [goal];
    component.contributions = [{ goal_id: 1, amount: 100 }];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteGoal(goal);

    expect(component.goals).toEqual([goal]);
    expect(component.contributions).toEqual([{ goal_id: 1, amount: 100 }]);

    confirm.mockReturnValue(true);
    component.deleteGoal(goal);

    expect(component.goals).toEqual([]);
    expect(component.contributions).toEqual([]);
  });

  it('updates a goal only after edit confirmation', () => {
    const goal = { goal_id: 1, goal_name: 'Emergency fund', target_amount: 5000, target_date: '2027-01-01' };
    component.goals = [goal];
    component.editGoal(goal);
    component.newGoal.goal_name = 'Travel fund';
    component.newGoal.target_amount = 7000;
    component.newGoal.target_date = '2027-06-01';
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.addGoal();

    expect(goal).toEqual({
      goal_id: 1,
      goal_name: 'Emergency fund',
      target_amount: 5000,
      target_date: '2027-01-01',
    });

    confirm.mockReturnValue(true);
    component.addGoal();

    expect(component.goals).toEqual([
      { goal_id: 1, goal_name: 'Travel fund', target_amount: 7000, target_date: '2027-06-01' },
    ]);
    expect(component.editingGoalId).toBeNull();
  });
});
