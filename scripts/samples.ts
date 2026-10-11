import type { Classification } from "@/lib/ai/classify-lead";

// 20 fake inquiries with the result we expect. Rerun after every prompt change:
//   npm run test:ai
export type Sample = {
  name: string;
  message: string;
  expect: {
    intent: Classification["intent"];
    urgency?: Classification["urgency"];
    held: boolean; // waits for owner approval
    language?: "tagalog";
  };
};

export const samples: Sample[] = [
  // Routine bookings: sent right away
  { name: "Carla Lim", message: "Can I book a cleaning next Tuesday?", expect: { intent: "booking", urgency: "low", held: false } },
  { name: "Mark Villanueva", message: "Hi! I'd like to schedule a check-up for my two kids this Saturday morning if possible.", expect: { intent: "booking", urgency: "low", held: false } },
  { name: "Grace Tan", message: "Do you have any slots for whitening next week? Afternoons work best for me.", expect: { intent: "booking", urgency: "low", held: false } },
  { name: "Rico Bautista", message: "I need to reschedule my filling appointment from Thursday to Friday please.", expect: { intent: "booking", urgency: "low", held: false } },

  // Pricing: sent right away, no price promises
  { name: "Ben Torres", message: "How much are braces?", expect: { intent: "pricing", urgency: "low", held: false } },
  { name: "Joy Ramos", message: "What's the price range for teeth whitening? Just canvassing for now.", expect: { intent: "pricing", urgency: "low", held: false } },
  { name: "Allan Cruz", message: "How much is a regular cleaning, and do you accept HMO cards?", expect: { intent: "pricing", urgency: "low", held: false } },

  // General questions: sent right away
  { name: "Paolo Reyes", message: "Is there parking near the clinic? I'll be coming from La Trinidad.", expect: { intent: "question", urgency: "low", held: false } },
  { name: "Nina Garcia", message: "Are you open on holidays like All Saints' Day?", expect: { intent: "question", urgency: "low", held: false } },

  // Emergencies: always held
  { name: "Maria Santos", message: "My tooth is broken and bleeding since last night. Can someone see me today?", expect: { intent: "emergency", urgency: "high", held: true } },
  { name: "Leo Fernandez", message: "My son fell off his bike and chipped his front tooth, he's crying a lot. Please help.", expect: { intent: "emergency", urgency: "high", held: true } },
  { name: "Ana Dizon", message: "My cheek has been swelling up since this morning and the pain is getting worse.", expect: { intent: "emergency", urgency: "high", held: true } },

  // Unhappy patients: held
  { name: "Jun dela Cruz", message: "Nobody called me back yesterday! I've been waiting two days.", expect: { intent: "question", urgency: "medium", held: true } },
  { name: "Tess Aquino", message: "Very disappointed. My filling fell out a week after the visit and I paid full price.", expect: { intent: "question", held: true } },

  // Other languages: reply in the same language
  { name: "Liza Mendoza", message: "Pwede po ba bukas ng umaga? Magpapalinis lang po ako ng ngipin.", expect: { intent: "booking", urgency: "low", held: false, language: "tagalog" } },
  { name: "Ramon Pascual", message: "Magkano po ang pasta? Salamat po.", expect: { intent: "pricing", urgency: "low", held: false, language: "tagalog" } },
  { name: "Elena Soriano", message: "Masakit po talaga ang ngipin ko, hindi ako makatulog. Pwede po ba ngayon?", expect: { intent: "emergency", urgency: "high", held: true, language: "tagalog" } },

  // Unclear: low confidence, held
  { name: "K", message: "hello?? is this the right place", expect: { intent: "question", held: true } },

  // Spam: no reply sent
  { name: "SEO Pros", message: "Buy cheap SEO services now! Rank #1 on Google in 7 days, guaranteed.", expect: { intent: "spam", held: false } },
  { name: "Crypto Wins", message: "Earn $5,000 a week from home!!! Click the link to claim your bonus.", expect: { intent: "spam", held: false } },
];
