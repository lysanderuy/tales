export interface BuiltinSet {
  id: string;
  name: string;
  lines: string[];
}

export const ENCOURAGEMENT_SET_ID = "6f1a2b3c-0002-4000-8000-000000000002";
export const DAILY_VERSE_SET_ID = "6f1a2b3c-0003-4000-8000-000000000003";

export const BUILTIN_SETS: BuiltinSet[] = [
  {
    id: ENCOURAGEMENT_SET_ID,
    name: "Encouragement",
    lines: [
      "Small, steady hours add up.",
      "Rest is part of the work.",
      "You showed up, and that counts.",
      "A quiet hour is still an hour.",
      "Slow days are still days you studied.",
      "Not knowing something yet is where every topic starts.",
      "One topic at a time is a fine way to learn.",
      "Tired is a feeling, not a verdict.",
      "Today only needs today's effort.",
      "What you studied today stays with you.",
      "It is okay to start small.",
      "Some days feel heavy, and you are still moving.",
      "Understanding comes in layers, and each pass adds one.",
      "Your own speed is a fine speed.",
      "A short break can make the next hour easier.",
      "What you've learned so far is still yours.",
      "Nobody remembers everything the first time.",
      "Being curious is enough to begin.",
      "A hard topic is just one you haven't spent time with yet.",
      "Water, food and sleep help you learn too.",
      "You've been getting ready for a while now, and it shows.",
      "Good notes today are a kindness to tomorrow's you.",
      "It is fine to ask for help.",
      "One page read is one page more than before.",
      "Doubt visits everyone who is working toward something big.",
      "Being patient with yourself is part of the work.",
      "The work is quiet, and it still matters.",
      "You can pause and pick it up again whenever you're ready.",
      "Learning can feel slow right up until it clicks.",
      "Your effort today is real, even when it doesn't feel like much.",
      "Every topic was new once.",
      "Taking care of yourself is part of studying.",
      "Hard days pass, and what you learned stays.",
      "Feeling ready isn't needed to keep going.",
    ],
  },
];
