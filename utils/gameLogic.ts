
import { HitType } from '../types';

export const advanceRunners = (bases: [boolean, boolean, boolean], hitType: HitType): { newBases: [boolean, boolean, boolean], runsScored: number } => {
  let hitValue: number;
  switch (hitType) {
    case HitType.Single:
      hitValue = 1;
      break;
    case HitType.Double:
      hitValue = 2;
      break;
    case HitType.Triple:
      hitValue = 3;
      break;
    case HitType.Homerun:
      hitValue = 4;
      break;
    default:
      hitValue = 0;
  }

  let runsScored = 0;
  const newBases: [boolean, boolean, boolean] = [false, false, false];

  // Combine runners on bases and the batter at home plate
  const runners = [...bases, true]; // [1st, 2nd, 3rd, home(batter)]

  for (let i = 3; i >= 0; i--) {
    if (runners[i]) {
      const newPosition = i + hitValue;
      if (newPosition >= 3) {
        // Runner scores
        runsScored++;
      } else {
        // Runner advances to a new base
        newBases[newPosition] = true;
      }
    }
  }

  return { newBases, runsScored };
};
