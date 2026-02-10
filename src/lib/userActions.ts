/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Shared IRC-style user actions used by ChatInput and MemberList
export const USER_ACTIONS = {
  funny: [
    { emoji: "🐟", action: "slaps", suffix: "around with a large trout" },
    { emoji: "🍕", action: "throws", suffix: "a slice of pizza at" },
    { emoji: "🎸", action: "serenades", suffix: "with an air guitar solo" },
    { emoji: "💨", action: "blows", suffix: "a raspberry at" },
    { emoji: "🤡", action: "does", suffix: "a silly dance for" },
    { emoji: "🎪", action: "juggles", suffix: "flaming torches for" },
    { emoji: "🦆", action: "releases", suffix: "a rubber duck army on" },
    { emoji: "🌮", action: "challenges", suffix: "to a taco eating contest" },
  ],
  nice: [
    { emoji: "🙌", action: "high-fives", suffix: "" },
    { emoji: "🤗", action: "gives", suffix: "a warm hug" },
    { emoji: "🎉", action: "celebrates", suffix: "with confetti" },
    { emoji: "⭐", action: "awards", suffix: "a gold star" },
    { emoji: "☕", action: "offers", suffix: "a cup of coffee" },
    { emoji: "🍪", action: "shares", suffix: "cookies with" },
    { emoji: "👏", action: "applauds", suffix: "enthusiastically" },
    { emoji: "💐", action: "gives", suffix: "a bouquet of flowers" },
  ],
};

export type UserAction = { emoji: string; action: string; suffix: string };
