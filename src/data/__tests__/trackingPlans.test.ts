import {
  TRACKING_PLANS,
  trackingPlanFor,
  activeTrackingPlan,
  selectedGoalIds,
  mergedChecklist,
  mergedPatternsToWatch,
} from '../trackingPlans';
import type { GoalId } from '../types';

describe('tracking plans', () => {
  const ids: GoalId[] = ['muscle', 'ride', 'recover', 'weightloss', 'tone', 'other'];

  it('has a complete, well-formed plan for every goal', () => {
    for (const id of ids) {
      const plan = TRACKING_PLANS[id];
      expect(plan.goalId).toBe(id);
      expect(plan.rings.protein_g).toBeGreaterThan(0);
      expect(plan.rings.calories).toBeGreaterThan(0);
      expect(plan.checklist.length).toBeGreaterThan(0);
      expect(plan.patternsToWatch.length).toBeGreaterThan(0);
      expect(plan.briefingEmphasis).toBeTruthy();
    }
  });

  it('keeps the validated muscle ring targets', () => {
    expect(TRACKING_PLANS.muscle.rings).toEqual({ protein_g: 185, calories: 2600 });
  });

  it('only the specific-challenge (ride) plan is date-relevant', () => {
    expect(TRACKING_PLANS.ride.rideDateRelevant).toBe(true);
    expect(TRACKING_PLANS.muscle.rideDateRelevant).toBeFalsy();
    expect(TRACKING_PLANS.recover.rideDateRelevant).toBeFalsy();
    expect(TRACKING_PLANS.weightloss.rideDateRelevant).toBeFalsy();
    expect(TRACKING_PLANS.tone.rideDateRelevant).toBeFalsy();
    expect(TRACKING_PLANS.other.rideDateRelevant).toBeFalsy();
  });

  it('selectors resolve the active goal', () => {
    expect(trackingPlanFor('ride').goalId).toBe('ride');
    expect(activeTrackingPlan({ activeGoal: 'recover' }).goalId).toBe('recover');
  });

  it('every checklist item has a label', () => {
    for (const id of ids) {
      for (const item of TRACKING_PLANS[id].checklist) {
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('selectedGoalIds keeps primary first and de-dupes', () => {
    expect(selectedGoalIds({ activeGoal: 'muscle', secondaryGoals: ['ride', 'muscle'] })).toEqual([
      'muscle',
      'ride',
    ]);
    expect(selectedGoalIds({ activeGoal: 'tone', secondaryGoals: [] })).toEqual(['tone']);
  });

  it('merged checklist + patterns union across selected goals without dupes', () => {
    const sel = { activeGoal: 'muscle' as GoalId, secondaryGoals: ['recover' as GoalId] };
    const labels = mergedChecklist(sel).map(i => i.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain('2 upper lifts'); // primary (muscle) first
    expect(labels).toContain('1 mobility session'); // secondary (recover)

    const patterns = mergedPatternsToWatch(sel);
    expect(new Set(patterns).size).toBe(patterns.length);
  });
});
