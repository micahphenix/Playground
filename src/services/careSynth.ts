// ─────────────────────────────────────────────────────────────────────────────
// Grass Guru — Care Synthesizer
//
// Deterministic, predictable care recommendations for the six known issue
// types.  Calculates the per-lawn "total" amount from sq_ft so the user
// sees an actionable number instead of a generic rate.
//
// The "Other" type falls back to a Claude call (see askGuru.ts) — this
// module exposes only the canned synthesis path.
// ─────────────────────────────────────────────────────────────────────────────

import { CareCard } from '../data/issueModel';
import { IssueTypeLabel } from '../data/seed';

interface LawnContext {
  sqft: number;
  grassType: string;
  zone: string;
}

interface RatePer1000 {
  /** Display rate, e.g. "3.2 oz per 1,000 sq ft" */
  display: string;
  /** Numeric value per 1,000 sq ft (used to compute total) */
  per1000: number;
  /** Unit label, e.g. "oz" */
  unit: string;
}

/** Compute a friendly total like "~9.6 oz total for your 3,000 sq ft lawn". */
function calcTotal(sqft: number, rate: RatePer1000): string {
  const total = (sqft / 1000) * rate.per1000;
  const rounded = total >= 10 ? Math.round(total) : Math.round(total * 10) / 10;
  return `~${rounded} ${rate.unit} total for your ${sqft.toLocaleString()} sq ft lawn`;
}

/** Build a CareCard for a given issue type using the user's lawn context. */
export function synthCare(type: IssueTypeLabel, lawn: LawnContext, userDescription?: string): CareCard {
  const sqft = lawn.sqft;

  switch (type) {
    case 'Brown Patch': {
      const rate: RatePer1000 = { display: '3.2 oz per 1,000 sq ft', per1000: 3.2, unit: 'oz' };
      return {
        title: 'Brown Patch Detected',
        recommendation:
          'Brown patch is a common fungal disease in tall fescue when nighttime temps stay above 65°F with high humidity. The good news: caught early, contact fungicide knocks it back in a single application. Avoid watering in the evening until it clears.',
        product: 'Fungicide — contact-type (azoxystrobin or chlorothalonil)',
        rate: rate.display,
        total: calcTotal(sqft, rate),
        steps: [
          'Mow the affected area and bag the clippings — do not mulch back in.',
          'Mix the fungicide per label rate in a tank sprayer.',
          'Apply evenly across all visible patches plus a 3-foot buffer.',
          'Water lightly to move the product into the thatch layer.',
          'Hold off on watering for 24 hours after application.',
        ],
      };
    }

    case 'Fungus': {
      const rate: RatePer1000 = { display: '2.5 oz per 1,000 sq ft', per1000: 2.5, unit: 'oz' };
      return {
        title: 'Fungal Pressure',
        recommendation:
          'Fungal problems thrive in warm, wet conditions and weak turf. A broad-spectrum systemic fungicide will protect the lawn for 14–21 days. Stop late-evening watering until symptoms clear.',
        product: 'Broad-spectrum fungicide (propiconazole or azoxystrobin)',
        rate: rate.display,
        total: calcTotal(sqft, rate),
        steps: [
          'Identify the affected patches in early morning light.',
          'Mix the fungicide per label in a tank sprayer.',
          'Apply across affected areas plus a 3-foot buffer.',
          'Skip evening irrigation for the next week.',
          'Re-apply in 14–21 days if symptoms persist.',
        ],
      };
    }

    case 'Pests': {
      const rate: RatePer1000 = { display: '0.5 lb per 1,000 sq ft', per1000: 0.5, unit: 'lb' };
      return {
        title: 'Insect Damage',
        recommendation:
          'Most lawn pests show as irregular dead patches that pull up easily. A granular insecticide with bifenthrin handles surface feeders; for grubs, time treatment to early-summer egg hatch. Water in immediately for best contact.',
        product: 'Granular insecticide (bifenthrin)',
        rate: rate.display,
        total: calcTotal(sqft, rate),
        steps: [
          'Pull up a damaged tuft to confirm the pest type.',
          'Apply granules evenly with a broadcast spreader.',
          'Water in with ¼ inch of irrigation right after application.',
          'Keep pets and kids off the lawn until dry.',
          'Re-scout in 10–14 days; re-treat if activity continues.',
        ],
      };
    }

    case 'Weeds': {
      const rate: RatePer1000 = { display: '0.75 oz per gallon, spot-spray only', per1000: 0.5, unit: 'oz' };
      return {
        title: 'Broadleaf Weed Pressure',
        recommendation:
          'A few flowering broadleaves in spring are normal — spot-treating with a selective herbicide clears them without harming your turf. Pick a calm, dry day above 60°F so the herbicide stays where you put it.',
        product: 'Selective broadleaf herbicide (2,4-D + dicamba blend)',
        rate: rate.display,
        total: 'A pint covers most home lawns easily',
        steps: [
          'Wait for a calm, dry day above 60°F.',
          'Mix herbicide per label in a small hand sprayer.',
          'Spray each weed until just wet — no need to drench.',
          'Do not mow for 48 hours after application.',
        ],
      };
    }

    case 'Bare Spot': {
      const rate: RatePer1000 = { display: '6 lb of seed per 1,000 sq ft', per1000: 6, unit: 'lb' };
      return {
        title: 'Bare Spot Recovery',
        recommendation:
          'Bare spots fill in quickest when you loosen the soil first and keep the surface consistently moist for two weeks. Match the seed to the rest of your lawn so the new growth blends.',
        product: `${lawn.grassType} seed (or matching blend)`,
        rate: rate.display,
        total: calcTotal(sqft, rate),
        steps: [
          'Rake the bare area to loosen the top inch of soil.',
          'Spread seed evenly at the recommended rate.',
          'Cover lightly with peat moss or topsoil — no more than ¼ inch.',
          'Water 2–3 times daily until seedlings reach 1 inch.',
          'Hold off on the first mow until new grass is 3 inches tall.',
        ],
      };
    }

    case 'Drainage': {
      return {
        title: 'Drainage Trouble',
        recommendation:
          'Soggy lawn after rain usually means compacted soil or low spots. Core aeration plus a thin topdressing of compost will improve drainage over the next season; persistent puddles may need a small French drain.',
        product: 'Core aerator rental + ½ yd³ screened compost',
        rate: '⅛ inch topdressing across the affected area',
        total: `For your ${sqft.toLocaleString()} sq ft lawn, ~${Math.max(1, Math.round(sqft / 4000))} cu yd of compost`,
        steps: [
          'Mark the wettest areas while they are still saturated.',
          'Wait until the soil is dry enough to walk without sinking.',
          'Core-aerate the marked zones in two passes.',
          'Spread a thin layer of compost and drag it into the holes.',
          'Re-evaluate after the next heavy rain; consider drain tile if puddling persists.',
        ],
      };
    }

    case 'Other':
    default: {
      // Fallback for unhandled types when the AI call isn't available.
      return {
        title: 'Unknown Issue',
        recommendation: userDescription
          ? `Based on what you wrote — "${userDescription}" — start with a careful visual inspection in morning light. If you can, take a few close-up photos and bring them to your local extension office for a definitive diagnosis.`
          : 'Without a clearer description, the safest move is a careful visual inspection in morning light and a photo for your local extension office to confirm.',
        product: 'No specific product yet — diagnosis required first',
        rate: '—',
        total: '—',
        steps: [
          'Photograph the affected area in good light.',
          'Note when you first saw the problem and any recent weather changes.',
          'Check whether new growth nearby looks healthy or affected.',
          'Send the photos to your local extension service for a free diagnosis.',
        ],
      };
    }
  }
}
