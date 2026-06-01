// ── BADGE DEFINITIONS ──
// Shared between App.jsx, LbTab.jsx, ProfileTab, etc.

export const BADGE_DEFS = {
  first_checkin: {
    label: "First Check-In",
    icon: "🌅",
    color: "#6EE7B7",
    desc: "Completed your very first daily check-in",
    rarity: "common",
  },
  first_log: {
    label: "Activity Starter",
    icon: "📝",
    color: "#93C5FD",
    desc: "Logged your first challenge activity",
    rarity: "common",
  },
  streak_3: {
    label: "On a Roll",
    icon: "🔥",
    color: "#FB923C",
    desc: "3-day check-in streak",
    rarity: "common",
  },
  streak_7: {
    label: "Week Warrior",
    icon: "🔥🔥",
    color: "#FB923C",
    desc: "7-day check-in streak",
    rarity: "rare",
  },
  streak_14: {
    label: "Two Week Titan",
    icon: "💪",
    color: "#F9A8D4",
    desc: "14-day check-in streak",
    rarity: "rare",
  },
  streak_30: {
    label: "Month Master",
    icon: "⭐",
    color: "#C4B5FD",
    desc: "30-day check-in streak — elite!",
    rarity: "legendary",
  },
  challenge_complete: {
    label: "Challenge Crusher",
    icon: "🏆",
    color: "#FCD34D",
    desc: "Hit 100% on a challenge goal",
    rarity: "rare",
  },
  hydration_hero: {
    label: "Hydration Hero",
    icon: "💧",
    color: "#93C5FD",
    desc: "Met your daily water goal 5 days running",
    rarity: "rare",
  },
  posture_check: {
    label: "Posture Pro",
    icon: "🪑",
    color: "#C4B5FD",
    desc: "Completed your ergonomics assessment",
    rarity: "common",
  },
  top_of_board: {
    label: "Top of the Board",
    icon: "🥇",
    color: "#FCD34D",
    desc: "Reached #1 on the weekly leaderboard",
    rarity: "legendary",
  },
  perfect_week: {
    label: "Perfect Week",
    icon: "📅",
    color: "#6EE7B7",
    desc: "Checked in every single day for a week",
    rarity: "rare",
  },
  early_bird: {
    label: "Early Bird",
    icon: "🌄",
    color: "#FCD34D",
    desc: "Completed a check-in before 8am",
    rarity: "common",
  },
  night_owl: {
    label: "Night Owl",
    icon: "🦉",
    color: "#6366F1",
    desc: "Completed a check-in after 9pm",
    rarity: "common",
  },
  team_player: {
    label: "Team Player",
    icon: "🤝",
    color: "#6EE7B7",
    desc: "Part of an active team",
    rarity: "common",
  },
};

export const RARITY_COLORS = {
  common: "#888",
  rare: "#93C5FD",
  legendary: "#FCD34D",
};

export const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  legendary: "Legendary",
};
