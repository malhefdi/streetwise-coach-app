// data/principles/principles.base.ts
// --------------------------------------------
//  StreetWise Core Principles — Base Reference
// --------------------------------------------

export interface Principle {
    id: number;
    name: string;
  }
  
  /**
   * 🧠 CORE PRINCIPLES
   * These represent the fundamental biomechanical, tactical, and psychological
   * laws underlying all StreetWise curriculum materials (GC2, BBS1-4, etc.).
   * This file acts as a canonical registry to ensure consistent tagging,
   * analytics, and AI reference across all datasets.
   */
  export const PRINCIPLES: Principle[] = [
    { id: 1, name: "Connection" },
    { id: 2, name: "Detachment" },
    { id: 3, name: "Distance" },
    { id: 4, name: "Pyramid" },
    { id: 5, name: "Creation" },
    { id: 6, name: "Acceptance" },
    { id: 7, name: "Velocity" },
    { id: 8, name: "Clock" },
    { id: 9, name: "River" },
    { id: 10, name: "Frame" },
    { id: 11, name: "Kuzushi" },
    { id: 12, name: "Reconnaissance" },
    { id: 13, name: "Prevention" },
    { id: 14, name: "Tension" },
    { id: 15, name: "Fork" },
    { id: 16, name: "Posture" },
    { id: 17, name: "False Surrender" },
    { id: 18, name: "Depletion" },
    { id: 19, name: "Isolation" },
    { id: 20, name: "Sacrifice" },
    { id: 21, name: "Momentum" },
    { id: 22, name: "Pivot" },
    { id: 23, name: "Tagalong" },
    { id: 24, name: "Overload" },
    { id: 25, name: "Anchor" },
    { id: 26, name: "Ratchet" },
    { id: 27, name: "Buoyancy" },
    { id: 28, name: "Head Control" },
    { id: 29, name: "Redirection" },
    { id: 30, name: "Mobility" },
    { id: 31, name: "Centerline" },
    { id: 32, name: "Grandmaster" },
  ] as const;
  
  export type PrincipleName = (typeof PRINCIPLES)[number]["name"];