// HealthKit adapter. The handoff makes HealthKit a priority for the native
// build (sleep, steps, workouts → overnight sync → morning briefing).
//
// Real wiring requires `react-native-health` and an Expo custom dev client —
// neither runs in Expo Go. For v0.1 we expose the interface and a mock so
// the screens and the coach can read realistic numbers. Swap MockHealthKit
// for a NativeHealthKit implementation when the dev client lands.

export interface DailyHealth {
  date: string; // YYYY-MM-DD
  sleepHrs: number | null;
  steps: number;
  activeKcal: number;
  workouts: { type: string; durationMin: number; kcal: number }[];
}

export interface SleepTrend {
  last7nightsAvg: number;
  nightsUnderSixInLast7: number;
}

export interface HealthKitAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getToday(): Promise<DailyHealth>;
  getSleepTrend(): Promise<SleepTrend>;
}

class MockHealthKit implements HealthKitAdapter {
  async isAvailable() {
    return false;
  }
  async requestPermissions() {
    return true;
  }
  async getToday(): Promise<DailyHealth> {
    return {
      date: new Date().toISOString().slice(0, 10),
      sleepHrs: 5.8,
      steps: 2840,
      activeKcal: 220,
      workouts: [],
    };
  }
  async getSleepTrend(): Promise<SleepTrend> {
    return { last7nightsAvg: 6.2, nightsUnderSixInLast7: 3 };
  }
}

export const HealthKit: HealthKitAdapter = new MockHealthKit();
