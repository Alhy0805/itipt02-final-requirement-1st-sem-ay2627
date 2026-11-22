import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, vi } from 'vitest';
import { SavingGoalsPage } from './saving-goals.page';
import { MainService } from '../services/main-service';

describe('SavingGoalsPage', () => {
  let component: SavingGoalsPage;
  let fixture: ComponentFixture<SavingGoalsPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MainService,
          useValue: {
            getUserId: vi.fn(() => 1),
            getLocalStorageData: vi.fn(() => null),
            getSavingGoals: vi.fn(async () => []),
            getResources: vi.fn(() => of({ goal_contributions: [] })),
            createSavingGoal: vi.fn(async (goal) => ({ goal_id: 2, ...goal })),
            updateSavingGoal: vi.fn(async (goalId, goal) => ({ goal_id: goalId, ...goal })),
            deleteSavingGoal: vi.fn(async () => undefined),
            createGoalContribution: vi.fn(async (goalId, contribution) => ({
              contribution_id: 3,
              goal_id: goalId,
              ...contribution,
            })),
            updateSavingGoalCache: vi.fn(),
          },
        },
      ],
    });
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

  it('only deletes a goal and its contributions after confirmation', async () => {
    const goal = { goal_id: 1, goal_name: 'Emergency fund', target_amount: 5000 };
    component.goals = [goal];
    component.contributions = [{ goal_id: 1, amount: 100 }];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await component.deleteGoal(goal);

    expect(component.goals).toEqual([goal]);
    expect(component.contributions).toEqual([{ goal_id: 1, amount: 100 }]);

    confirm.mockReturnValue(true);
    await component.deleteGoal(goal);

    expect(component.goals).toEqual([]);
    expect(component.contributions).toEqual([]);
  });

  it('updates a goal only after edit confirmation', async () => {
    const goal = { goal_id: 1, goal_name: 'Emergency fund', target_amount: 5000, target_date: '2027-01-01' };
    component.goals = [goal];
    component.editGoal(goal);
    component.newGoal.goal_name = 'Travel fund';
    component.newGoal.target_amount = 7000;
    component.newGoal.target_date = '2027-06-01';
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await component.addGoal();

    expect(goal).toEqual({
      goal_id: 1,
      goal_name: 'Emergency fund',
      target_amount: 5000,
      target_date: '2027-01-01',
    });

    confirm.mockReturnValue(true);
    await component.addGoal();

    expect(component.goals).toEqual([
      { goal_id: 1, goal_name: 'Travel fund', target_amount: 7000, target_date: '2027-06-01' },
    ]);
    expect(component.editingGoalId).toBeNull();
  });

  it('adds a contribution to the selected goal and refreshes the cached totals', async () => {
    const goal = { goal_id: 4, goal_name: 'Travel fund', target_amount: 3000 };
    const contribution = {
      contribution_id: 3,
      goal_id: 4,
      amount: 250,
      contribution_date: '2026-11-22',
      notes: 'Monthly savings',
    };
    const service = TestBed.inject(MainService);
    vi.mocked(service.createGoalContribution).mockResolvedValue(contribution);
    component.goals = [goal];
    component.beginContribution(goal);
    component.newContribution = {
      amount: 250,
      contribution_date: '2026-11-22',
      notes: ' Monthly savings ',
    };

    await component.addContribution(goal);

    expect(service.createGoalContribution).toHaveBeenCalledWith(4, {
      amount: 250,
      contribution_date: '2026-11-22',
      notes: 'Monthly savings',
    });
    expect(component.contributions).toEqual([contribution]);
    expect(component.getSavedAmount(goal)).toBe(250);
    expect(service.updateSavingGoalCache).toHaveBeenCalledWith([goal], [contribution]);
    expect(component.contributingGoalId).toBeNull();
  });

  it('rejects a non-positive contribution without calling the service', async () => {
    const goal = { goal_id: 4, goal_name: 'Travel fund', target_amount: 3000 };
    const service = TestBed.inject(MainService);
    component.newContribution.amount = 0;

    await component.addContribution(goal);

    expect(service.createGoalContribution).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Enter a contribution amount greater than zero.');
  });
});
