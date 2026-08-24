export type NflConference = "afc" | "nfc";
export type NflDivision = "east" | "north" | "south" | "west";

/**
 * Single-drawdown scope for the draw pool: the whole league, one conference,
 * or one division. A combined value ("afc_east") removes any
 * conference/division conflict two separate dropdowns would allow.
 */
export type NflScopeFilter =
  | "all"
  | NflConference
  | `${NflConference}_${NflDivision}`;

export interface NflTeam {
  /** Full display name, e.g. "Kansas City Chiefs". */
  name: string;
  city: string;
  nickname: string;
  /** Common short code, e.g. "KC". */
  abbr: string;
  conference: NflConference;
  division: NflDivision;
}

/**
 * The 32 current NFL clubs, grouped by conference and division.
 * Verified against nfl.com/teams ahead of the 2026 season. Review once a
 * year before kickoff — club renames and relocations are rare but possible
 * (most recent: Washington Commanders, 2022).
 */
export const NFL_TEAMS: NflTeam[] = [
  // AFC East
  { name: "Buffalo Bills", city: "Buffalo", nickname: "Bills", abbr: "BUF", conference: "afc", division: "east" },
  { name: "Miami Dolphins", city: "Miami", nickname: "Dolphins", abbr: "MIA", conference: "afc", division: "east" },
  { name: "New England Patriots", city: "New England", nickname: "Patriots", abbr: "NE", conference: "afc", division: "east" },
  { name: "New York Jets", city: "New York", nickname: "Jets", abbr: "NYJ", conference: "afc", division: "east" },
  // AFC North
  { name: "Baltimore Ravens", city: "Baltimore", nickname: "Ravens", abbr: "BAL", conference: "afc", division: "north" },
  { name: "Cincinnati Bengals", city: "Cincinnati", nickname: "Bengals", abbr: "CIN", conference: "afc", division: "north" },
  { name: "Cleveland Browns", city: "Cleveland", nickname: "Browns", abbr: "CLE", conference: "afc", division: "north" },
  { name: "Pittsburgh Steelers", city: "Pittsburgh", nickname: "Steelers", abbr: "PIT", conference: "afc", division: "north" },
  // AFC South
  { name: "Houston Texans", city: "Houston", nickname: "Texans", abbr: "HOU", conference: "afc", division: "south" },
  { name: "Indianapolis Colts", city: "Indianapolis", nickname: "Colts", abbr: "IND", conference: "afc", division: "south" },
  { name: "Jacksonville Jaguars", city: "Jacksonville", nickname: "Jaguars", abbr: "JAX", conference: "afc", division: "south" },
  { name: "Tennessee Titans", city: "Tennessee", nickname: "Titans", abbr: "TEN", conference: "afc", division: "south" },
  // AFC West
  { name: "Denver Broncos", city: "Denver", nickname: "Broncos", abbr: "DEN", conference: "afc", division: "west" },
  { name: "Kansas City Chiefs", city: "Kansas City", nickname: "Chiefs", abbr: "KC", conference: "afc", division: "west" },
  { name: "Las Vegas Raiders", city: "Las Vegas", nickname: "Raiders", abbr: "LV", conference: "afc", division: "west" },
  { name: "Los Angeles Chargers", city: "Los Angeles", nickname: "Chargers", abbr: "LAC", conference: "afc", division: "west" },
  // NFC East
  { name: "Dallas Cowboys", city: "Dallas", nickname: "Cowboys", abbr: "DAL", conference: "nfc", division: "east" },
  { name: "New York Giants", city: "New York", nickname: "Giants", abbr: "NYG", conference: "nfc", division: "east" },
  { name: "Philadelphia Eagles", city: "Philadelphia", nickname: "Eagles", abbr: "PHI", conference: "nfc", division: "east" },
  { name: "Washington Commanders", city: "Washington", nickname: "Commanders", abbr: "WAS", conference: "nfc", division: "east" },
  // NFC North
  { name: "Chicago Bears", city: "Chicago", nickname: "Bears", abbr: "CHI", conference: "nfc", division: "north" },
  { name: "Detroit Lions", city: "Detroit", nickname: "Lions", abbr: "DET", conference: "nfc", division: "north" },
  { name: "Green Bay Packers", city: "Green Bay", nickname: "Packers", abbr: "GB", conference: "nfc", division: "north" },
  { name: "Minnesota Vikings", city: "Minnesota", nickname: "Vikings", abbr: "MIN", conference: "nfc", division: "north" },
  // NFC South
  { name: "Atlanta Falcons", city: "Atlanta", nickname: "Falcons", abbr: "ATL", conference: "nfc", division: "south" },
  { name: "Carolina Panthers", city: "Carolina", nickname: "Panthers", abbr: "CAR", conference: "nfc", division: "south" },
  { name: "New Orleans Saints", city: "New Orleans", nickname: "Saints", abbr: "NO", conference: "nfc", division: "south" },
  { name: "Tampa Bay Buccaneers", city: "Tampa Bay", nickname: "Buccaneers", abbr: "TB", conference: "nfc", division: "south" },
  // NFC West
  { name: "Arizona Cardinals", city: "Arizona", nickname: "Cardinals", abbr: "ARI", conference: "nfc", division: "west" },
  { name: "Los Angeles Rams", city: "Los Angeles", nickname: "Rams", abbr: "LAR", conference: "nfc", division: "west" },
  { name: "San Francisco 49ers", city: "San Francisco", nickname: "49ers", abbr: "SF", conference: "nfc", division: "west" },
  { name: "Seattle Seahawks", city: "Seattle", nickname: "Seahawks", abbr: "SEA", conference: "nfc", division: "west" },
];

/**
 * Uniform random integer in [0, maxExclusive) backed by
 * crypto.getRandomValues. Uses rejection sampling so the result carries no
 * modulo bias — the draw stays provably fair for every pool size.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0]!;
  } while (value >= limit);
  return value % maxExclusive;
}

/**
 * Fisher-Yates shuffle over a copy of the input. Cryptographically seeded,
 * never mutates the source array.
 */
export function shuffleNflItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const a = shuffled[i]!;
    const b = shuffled[j]!;
    shuffled[i] = b;
    shuffled[j] = a;
  }
  return shuffled;
}

export function filterNflTeamsByScope(
  teams: readonly NflTeam[],
  scope: NflScopeFilter
): NflTeam[] {
  if (scope === "all") return [...teams];
  if (scope === "afc" || scope === "nfc") {
    return teams.filter((team) => team.conference === scope);
  }
  const [scopeConference, scopeDivision] = scope.split("_") as [
    NflConference,
    NflDivision,
  ];
  return teams.filter(
    (team) =>
      team.conference === scopeConference && team.division === scopeDivision
  );
}
