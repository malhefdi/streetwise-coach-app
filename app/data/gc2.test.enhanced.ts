// GC2 Enhanced Test Drills Data - Sprint-based organization
// Each drill is organized into sprint groups representing continuous technique demonstrations
// followed by rest periods, reflecting realistic test execution

import type { EnhancedTestDrill } from '@/app/types/test-drill.types';

export const gc2TestDrillsEnhanced: EnhancedTestDrill[] = [
  // Drill 1: Mount Techniques
  {
    drillNumber: 1,
    title: "Mount Techniques",
    timeLimitMinutes: 5,
    description: "Demonstrate all the techniques in the order listed below in under five minutes. Introduce yourself and your testing partner, indicate the testing date, and announce the name of the drill before you begin.",
    sprintGroups: [
      {
        groupNumber: 1,
        groupTitle: "Trap & Roll Escape (L1)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l1-s1"], lessonNumber: 1, sliceTitle: "Standard Variation", combination: "+ Base Get-Up" },
          { ids: ["gc2-l1-s2", "gc2-l2-s2"], lessonNumber: 1, sliceTitle: "Punch Block Variation", combination: "+ Americana Armlock - Standard Variation (L2)" },
          { ids: ["gc2-l1-s3", "gc2-l2-s3"], lessonNumber: 1, sliceTitle: "Headlock Variation", combination: "+ Americana Armlock - Neck-Hug Variation (L2)" },
        ]
      },
      {
        groupNumber: 2,
        groupTitle: "Elbow Escape (L12)",
        estimatedTimeMinutes: 1.25,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l12-s1"], lessonNumber: 12, sliceTitle: "Standard Elbow Escape" },
          { ids: ["gc2-l12-s2"], lessonNumber: 12, sliceTitle: "Hook Removal" },
          { ids: ["gc2-l12-s3"], lessonNumber: 12, sliceTitle: "Fish Hook" },
          { ids: ["gc2-l12-s4"], lessonNumber: 12, sliceTitle: "Heel Drag" },
        ]
      },
      {
        groupNumber: 3,
        groupTitle: "Positional Control (L3)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l3-s2"], lessonNumber: 3, sliceTitle: "Anchor & Base" },
          { ids: ["gc2-l3-s3"], lessonNumber: 3, sliceTitle: "Low Swim" },
          { ids: ["gc2-l3-s4"], lessonNumber: 3, sliceTitle: "High Swim" },
        ]
      },
      {
        groupNumber: 4,
        groupTitle: "Take the Back (L4)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l4-s1", "gc2-l5-s2"], lessonNumber: 4, sliceTitle: "Take the Back", combination: "+ Rear Naked Choke - Strong Side Variation (L5)" },
          { ids: ["gc2-l4-s2"], lessonNumber: 4, sliceTitle: "Remount Technique" },
        ]
      },
      {
        groupNumber: 5,
        groupTitle: "Headlock Counters (L16)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l16-s2"], lessonNumber: 16, sliceTitle: "Prevent the Get-Up" },
          { ids: ["gc2-l16-s3", "gc2-l5-s3"], lessonNumber: 16, sliceTitle: "Back Mount Finish", combination: "+ Rear Naked Choke - Weak Side Variation (L5)" },
          { ids: ["gc2-l16-s4"], lessonNumber: 16, sliceTitle: "Armbar Finish" },
        ]
      },
      {
        groupNumber: 6,
        groupTitle: "Armbar (L9)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l9-s2"], lessonNumber: 9, sliceTitle: "Standard Variation" },
          { ids: ["gc2-l9-s3"], lessonNumber: 9, sliceTitle: "Side Variation" },
        ]
      },
      {
        groupNumber: 7,
        groupTitle: "Twisting Arm Control (L35)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0,
        techniques: [
          { ids: ["gc2-l35-s2", "gc2-l4-s2"], lessonNumber: 35, sliceTitle: "Back Mount Finish", combination: "+ Remount Technique (L4)" },
          { ids: ["gc2-l35-s3"], lessonNumber: 35, sliceTitle: "Armbar Finish" },
        ]
      }
    ]
  },

  // Drill 2: Guard Techniques
  {
    drillNumber: 2,
    title: "Guard Techniques",
    timeLimitMinutes: 5,
    description: "Demonstrate all the techniques in the order listed below in under five minutes. Introduce yourself and your testing partner, indicate the testing date, and announce the name of the drill before you begin.",
    sprintGroups: [
      {
        groupNumber: 1,
        groupTitle: "Punch Block Series - Stages 1-5 (L8 & L27)",
        estimatedTimeMinutes: 1.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l8-s1"], lessonNumber: 8, sliceTitle: "Stage 1" },
          { ids: ["gc2-l8-s2"], lessonNumber: 8, sliceTitle: "Stage 2" },
          { ids: ["gc2-l8-s3"], lessonNumber: 8, sliceTitle: "Stage 3" },
          { ids: ["gc2-l8-s4"], lessonNumber: 8, sliceTitle: "Stage 4" },
          { ids: ["gc2-l27-s1"], lessonNumber: 27, sliceTitle: "Stage 5", combination: "+ Rollover Technique (L27)" },
        ]
      },
      {
        groupNumber: 2,
        groupTitle: "Elevator Sweep (L11)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l11-s1"], lessonNumber: 11, sliceTitle: "Standard Variation" },
          { ids: ["gc2-l11-s2"], lessonNumber: 11, sliceTitle: "Headlock Variation" },
        ]
      },
      {
        groupNumber: 3,
        groupTitle: "Double Ankle Sweep (L20)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l20-s1"], lessonNumber: 20, sliceTitle: "Knee Thrust Variation" },
          { ids: ["gc2-l20-s2"], lessonNumber: 20, sliceTitle: "Kick Variation" },
        ]
      },
      {
        groupNumber: 4,
        groupTitle: "Hook Sweep (L28)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l28-s1"], lessonNumber: 28, sliceTitle: "Hook Sweep" },
        ]
      },
      {
        groupNumber: 5,
        groupTitle: "Triangle Choke (L10)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l10-s2"], lessonNumber: 10, sliceTitle: "Stage 1.5 Variation" },
          { ids: ["gc2-l10-s3"], lessonNumber: 10, sliceTitle: "Giant Killer Variation" },
        ]
      },
      {
        groupNumber: 6,
        groupTitle: "Armbar (L19)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l19-s1"], lessonNumber: 19, sliceTitle: "Low Variation" },
          { ids: ["gc2-l19-s2"], lessonNumber: 19, sliceTitle: "High Variation" },
          { ids: ["gc2-l19-s3"], lessonNumber: 19, sliceTitle: "Triangle Transition" },
        ]
      },
      {
        groupNumber: 7,
        groupTitle: "Kimura Armlock (L25)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l25-s1"], lessonNumber: 25, sliceTitle: "Rider Variation" },
          { ids: ["gc2-l25-s2"], lessonNumber: 25, sliceTitle: "Forced Variation" },
        ]
      },
      {
        groupNumber: 8,
        groupTitle: "Take the Back (L31)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l31-s1"], lessonNumber: 31, sliceTitle: "Head & Arm Control" },
        ]
      },
      {
        groupNumber: 9,
        groupTitle: "Double Underhook Pass (L36)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0,
        techniques: [
          { ids: ["gc2-l36-s1"], lessonNumber: 36, sliceTitle: "Open Guard Variation" },
          { ids: ["gc2-l36-s2"], lessonNumber: 36, sliceTitle: "Closed Guard Variation" },
        ]
      }
    ]
  },

  // Drill 3: Side Mount Techniques
  {
    drillNumber: 3,
    title: "Side Mount Techniques",
    timeLimitMinutes: 5,
    description: "Demonstrate all the techniques in the order listed below in under five minutes. Introduce yourself and your testing partner, indicate the testing date, and announce the name of the drill before you begin.",
    sprintGroups: [
      {
        groupNumber: 1,
        groupTitle: "Positional Control (L13)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l13-s1"], lessonNumber: 13, sliceTitle: "Roll Prevention" },
          { ids: ["gc2-l13-s2"], lessonNumber: 13, sliceTitle: "Modified Side Mount" },
          { ids: ["gc2-l13-s3"], lessonNumber: 13, sliceTitle: "Guard Prevention" },
          { ids: ["gc2-l13-s4"], lessonNumber: 13, sliceTitle: "Mount Transition" },
        ]
      },
      {
        groupNumber: 2,
        groupTitle: "Shrimp Escape (L24)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l24-s1"], lessonNumber: 24, sliceTitle: "Block & Shoot Variation" },
          { ids: ["gc2-l24-s2"], lessonNumber: 24, sliceTitle: "Shrimp & Shoot Variation" },
          { ids: ["gc2-l24-s3"], lessonNumber: 24, sliceTitle: "Rider Variation" },
        ]
      },
      {
        groupNumber: 3,
        groupTitle: "Elbow Escape (L33)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l33-s1"], lessonNumber: 33, sliceTitle: "Knee Drive Variation" },
          { ids: ["gc2-l33-s2"], lessonNumber: 33, sliceTitle: "High Step Variation" },
        ]
      },
      {
        groupNumber: 4,
        groupTitle: "Headlock Escape 1 (L18)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l18-s1"], lessonNumber: 18, sliceTitle: "Standard Frame Escape", combination: "+ Scissor Follow-Up" },
          { ids: ["gc2-l18-s2"], lessonNumber: 18, sliceTitle: "Super Lock Variation" },
        ]
      },
      {
        groupNumber: 5,
        groupTitle: "Headlock Escape 2 (L22)",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0,
        techniques: [
          { ids: ["gc2-l22-s1"], lessonNumber: 22, sliceTitle: "Standard Leg Hook Escape" },
          { ids: ["gc2-l22-s2"], lessonNumber: 22, sliceTitle: "Super Base Variation" },
          { ids: ["gc2-l22-s3"], lessonNumber: 22, sliceTitle: "Punch Block Variation" },
        ]
      }
    ]
  },

  // Drill 4: Standing Techniques
  {
    drillNumber: 4,
    title: "Standing Techniques",
    timeLimitMinutes: 5,
    description: "Demonstrate all the techniques in the order listed below in under five minutes. Introduce yourself and your testing partner, indicate the testing date, and announce the name of the drill before you begin.",
    sprintGroups: [
      {
        groupNumber: 1,
        groupTitle: "Establish the Clinch",
        estimatedTimeMinutes: 1,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l7-s1", "gc2-l6-s1"], lessonNumber: 7, sliceTitle: "Close the Distance", combination: "+ Leg Hook Takedown (L6)" },
          { ids: ["gc2-l15-s1", "gc2-l14-s1"], lessonNumber: 15, sliceTitle: "Surprise Entry", combination: "+ Body Fold Takedown (L14)" },
        ]
      },
      {
        groupNumber: 2,
        groupTitle: "Haymaker Punch Defense (L30) + Rear Takedown (L29)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l30-s1", "gc2-l29-s1"], lessonNumber: 30, sliceTitle: "Haymaker Punch Defense", combination: "+ Rear Takedown (L29)" },
        ]
      },
      {
        groupNumber: 3,
        groupTitle: "Double Leg Takedown (L17)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l17-s1"], lessonNumber: 17, sliceTitle: "Aggressive Opponent" },
          { ids: ["gc2-l17-s2"], lessonNumber: 17, sliceTitle: "Conservative Opponent" },
        ]
      },
      {
        groupNumber: 4,
        groupTitle: "Pull Guard (L21)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l21-s1"], lessonNumber: 21, sliceTitle: "Pull Guard" },
        ]
      },
      {
        groupNumber: 5,
        groupTitle: "Guillotine Choke (L23)",
        estimatedTimeMinutes: 0.75,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l23-s1"], lessonNumber: 23, sliceTitle: "Standing Variation" },
          { ids: ["gc2-l23-s2"], lessonNumber: 23, sliceTitle: "Guard Pull Variation" },
        ]
      },
      {
        groupNumber: 6,
        groupTitle: "Standing Armbar (L34)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l34-s1"], lessonNumber: 34, sliceTitle: "Basic Application" },
        ]
      },
      {
        groupNumber: 7,
        groupTitle: "Standing Headlock Defense (L26)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0.25,
        techniques: [
          { ids: ["gc2-l26-s1"], lessonNumber: 26, sliceTitle: "Standard Variation" },
        ]
      },
      {
        groupNumber: 8,
        groupTitle: "Guillotine Defense (L32)",
        estimatedTimeMinutes: 0.5,
        restTimeMinutes: 0,
        techniques: [
          { ids: ["gc2-l32-s1"], lessonNumber: 32, sliceTitle: "Standard Variation" },
        ]
      }
    ]
  },

  // Drill 5: Freestyle Fight Simulation
  {
    drillNumber: 5,
    title: "Freestyle Fight Simulation",
    timeLimitMinutes: 5,
    description: "Demonstrate as many different Gracie Combatives techniques as possible in response to indicators presented by your partner. Focus is on reflexes and realistic bad guy behaviors. Remain silent except for necessary transitions. Minimum Time: 5 Minutes, Maximum Time: 6 Minutes.",
    isFreestyle: true,
    specialRequirements: "Partner must provide realistic indicators and moderate resistance. Student must demonstrate appropriate technique selection based on partner's actions. Evaluator focuses on details, conviction, and reflexes.",
    sprintGroups: [] // Freestyle drill doesn't use sprint groups
  }
];

// Export helper function to get enhanced test drills for GC2
export const getGC2TestDrillsEnhanced = (): EnhancedTestDrill[] => {
  return gc2TestDrillsEnhanced;
};
