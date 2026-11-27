// "Uhodni hráče" (guess the player) — a small library of well-known Czech & Slovak hockey players.
// Only public, long-settled career facts. Each player becomes 5 clues, hardest first (5 → 1 point).
// The avatar is a generic cartoon skater in the player's best-known jersey colours — no likeness.
// club = catalog code of the bracelet we link at the end ("Nos jeho klub"), if the shop has one.

export const PLAYERS = {
  jagr: {
    name: "Jaromír Jágr", nation: "CZ", pos: "útočník (pravé křídlo)", num: 68, born: 1972, from: "Kladno",
    career: ["Kladno", "Pittsburgh", "Washington", "NY Rangers", "Omsk", "Philadelphia", "Dallas", "Boston", "New Jersey", "Florida", "Calgary", "Kladno"],
    win: "2× Stanley Cup (1991, 1992) a zlato z Nagana 1998", fact: "V NHL hrál ještě ve 45 letech",
    colors: ["#111111", "#FCB514"], club: "KLA",
  },
  hasek: {
    name: "Dominik Hašek", nation: "CZ", pos: "brankář", num: 39, born: 1965, from: "Pardubice",
    career: ["Pardubice", "Jihlava", "Chicago", "Buffalo", "Detroit", "Ottawa", "Detroit", "Pardubice", "Spartak Moskva"],
    win: "zlato z Nagana 1998 a 2× Hart Trophy", fact: "Přezdívka Dominátor",
    colors: ["#002654", "#FCB514"], club: "PCE",
  },
  pastrnak: {
    name: "David Pastrňák", nation: "CZ", pos: "útočník (pravé křídlo)", num: 88, born: 1996, from: "Havířov",
    career: ["Havířov", "Södertälje", "Boston"],
    win: "mistr světa 2024", fact: "Bostonský střelec s přezdívkou Pasta",
    colors: ["#111111", "#FFB81C"], club: null,
  },
  cervenka: {
    name: "Roman Červenka", nation: "CZ", pos: "útočník", num: 10, born: 1985, from: "Praha",
    career: ["Slavia Praha", "Omsk", "Calgary", "Fribourg", "Rapperswil", "Pardubice"],
    win: "kapitán mistrů světa 2024", fact: "Kapitán zlatého týmu z Prahy",
    colors: ["#C8102E", "#FFFFFF"], club: "PCE",
  },
  elias: {
    name: "Patrik Eliáš", nation: "CZ", pos: "útočník (levé křídlo)", num: 26, born: 1976, from: "Třebíč",
    career: ["Kladno", "New Jersey"],
    win: "2× Stanley Cup (2000, 2003)", fact: "Celou kariéru v NHL odehrál za jeden klub",
    colors: ["#CE1126", "#111111"], club: "KLA",
  },
  hejduk: {
    name: "Milan Hejduk", nation: "CZ", pos: "útočník (pravé křídlo)", num: 23, born: 1976, from: "Ústí nad Labem",
    career: ["Pardubice", "Colorado"],
    win: "Stanley Cup 2001 a zlato z Nagana 1998", fact: "V roce 2003 nejlepší střelec NHL",
    colors: ["#6F263D", "#236192"], club: "PCE",
  },
  plekanec: {
    name: "Tomáš Plekanec", nation: "CZ", pos: "útočník (centr)", num: 14, born: 1982, from: "Kladno",
    career: ["Kladno", "Montreal", "Toronto", "Montreal", "Kladno"],
    win: "přes 1000 zápasů v NHL", fact: "Proslavil ho rolák pod dresem",
    colors: ["#AF1E2D", "#192168"], club: "KLA",
  },
  krejci: {
    name: "David Krejčí", nation: "CZ", pos: "útočník (centr)", num: 46, born: 1986, from: "Šternberk",
    career: ["Olomouc", "Gatineau", "Boston", "Olomouc", "Boston"],
    win: "Stanley Cup 2011", fact: "Mezi dvěma štacemi v Bostonu hrál doma v Olomouci",
    colors: ["#111111", "#FFB81C"], club: null,
  },
  chara: {
    name: "Zdeno Chára", nation: "SK", pos: "obránce", num: 33, born: 1977, from: "Trenčín",
    career: ["Trenčín", "Prince George", "NY Islanders", "Ottawa", "Boston", "Washington", "NY Islanders"],
    win: "Stanley Cup 2011 jako kapitán", fact: "Nejvyšší hráč v historii NHL (206 cm)",
    colors: ["#111111", "#FFB81C"], club: "TRE",
  },
  hossa: {
    name: "Marián Hossa", nation: "SK", pos: "útočník (pravé křídlo)", num: 81, born: 1979, from: "Stará Ľubovňa",
    career: ["Dukla Trenčín", "Portland", "Ottawa", "Atlanta", "Pittsburgh", "Detroit", "Chicago"],
    win: "3× Stanley Cup (2010, 2013, 2015)", fact: "Člen Síně slávy NHL",
    colors: ["#CF0A2C", "#111111"], club: "TRE",
  },
};

const NATION = { CZ: "Česko", SK: "Slovensko" };
const FLAG = { CZ: "🇨🇿", SK: "🇸🇰" };
export const nationOf = (p) => NATION[p.nation] || p.nation;
export const flagOf = (p) => FLAG[p.nation] || "🏳️";

// 5 clues, hardest first → each clue = { text: label, sub: value, icon, say }
export function playerClues(p) {
  const c = p.career, path = c.length > 6 ? [...c.slice(0, 3), "…", ...c.slice(-2)].join(" → ") + ` (${c.length} štací)` : c.join(" → ");
  return [
    { icon: "pos", text: "POZICE A NÁROD", sub: `${p.pos} · ${nationOf(p)}`, say: `Nápověda jedna. ${cap(p.pos.replace(/\s*\(.*\)/, ""))}, ${nationOf(p)}.` },
    { icon: "born", text: "NAROZEN", sub: `${p.born} · ${p.from}`, say: `Dvojka. Narodil se v roce ${p.born}.` },
    { icon: "career", text: "KARIÉRA", sub: path, say: `Trojka. Kariéra: ${p.career.slice(0, 4).join(", ")}${p.career.length > 4 ? " a dál" : ""}.` },
    { icon: "trophy", text: "ÚSPĚCH", sub: p.win, say: `Čtyřka. ${cap(p.win)}.` },
    { icon: "num", text: "ČÍSLO DRESU", sub: `#${p.num}`, say: `A poslední nápověda: číslo ${p.num}.` },
  ];
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const CUSTOM_PLAYER = {
  name: "Jméno Hráče", nation: "CZ", pos: "útočník", num: 9, born: 2000, from: "Město",
  career: ["Klub 1", "Klub 2", "Klub 3"], win: "největší úspěch", fact: "zajímavost", colors: ["#E30613", "#FFFFFF"], club: null,
};
