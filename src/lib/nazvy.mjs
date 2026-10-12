// Normalizace názvů subjektů pro porovnávání (deduplikace kandidátů, hledání investora mezi společníky).
export const PRAVNI_FORMY = /[\s,]+(s\.?\s?r\.?\s?o\.?|a\.?\s?s\.?|se|sicav|b\.?\s?v\.?|u\.?\s?a\.?|scsp|ltd\.?|limited|gmbh|inc\.?|llc|co[oö]peratief|k\.?\s?s\.?)$/i;
export const OBECNA_SLOVA = new Set(["capital", "ventures", "venture", "vc", "investments", "investment", "invest", "partners", "partner", "equity", "fund", "funds", "group", "advisory", "management", "holding", "private"]);

export const bezDiakritiky = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
export function slova(nazev) {
  // Přívěsky za pomlčkou („– Čestný člen“) a závorky nejsou součástí názvu.
  let s = bezDiakritiky(nazev).toLowerCase().replace(/\s[–—-]\s.*$/, "").replace(/\(.*?\)/g, " ").trim();
  while (PRAVNI_FORMY.test(s)) s = s.replace(PRAVNI_FORMY, "").trim();
  return s.replace(/&/g, " and ").split(/[^a-z0-9]+/).filter(Boolean);
}
export const klicPresny = (nazev) => slova(nazev).join("");
export const klicVolny = (nazev) => slova(nazev).filter((w) => !OBECNA_SLOVA.has(w)).join("");
