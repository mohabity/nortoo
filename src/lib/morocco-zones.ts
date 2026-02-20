/**
 * Morocco Zones Dictionary
 * Maps normalized city names to known quartier/neighborhood names.
 * Used by the address parser for zone extraction.
 *
 * All zone names are lowercase, accent-stripped for matching.
 * The parser normalizes input before comparing.
 */

// ═══════════════════════════════════════════════════════════
// KNOWN ZONES — per-city quartier lists
// ═══════════════════════════════════════════════════════════

export const KNOWN_ZONES: Record<string, string[]> = {
  casablanca: [
    "maarif", "maarif extension", "bourgogne", "gauthier", "racine",
    "oasis", "palmier", "anfa", "anfa superieur", "californie",
    "ain diab", "sidi maarouf", "hay hassani", "bernoussi",
    "sidi moumen", "sbata", "hay mohammadi", "ain sebaa",
    "belvedere", "derb sultan", "habous", "centre ville",
    "bouskoura", "ain chock", "oulfa", "hay el baraka",
    "lissasfa", "al fida", "mers sultan", "ben msik",
    "sidi bernoussi", "moulay rachid", "medina", "roches noires",
    "2 mars", "gironde", "nouaceur", "dar bouazza",
    "sidi othmane", "hay ennahda", "hay el fath", "cil",
    "tit mellil",
  ],
  rabat: [
    "agdal", "hay riad", "hassan", "ocean", "souissi",
    "youssoufia", "yacoub el mansour", "takaddoum", "akkari",
    "medina", "les orangers", "aviation", "diour jamaa",
    "hay nahda", "hay el fath", "temara", "mabella",
    "el kamra",
  ],
  marrakech: [
    "gueliz", "hivernage", "semlalia", "amerchich", "targa",
    "palmeraie", "massira", "daoudiate", "sidi youssef ben ali",
    "medina", "bab doukkala", "route de fes", "hay hassani",
    "mhamid", "annakhil", "izdihar", "el mohammadi", "azli",
    "menara",
  ],
  tanger: [
    "iberia", "marshan", "malabata", "tanja balia", "medina",
    "val fleuri", "californie", "moujahidine", "souani",
    "boukhalef", "hay benkirane", "beni makada", "mesnana",
    "el irfane", "dradeb", "gzenaya", "hay el amal",
    "moghogha",
  ],
  fes: [
    "ville nouvelle", "medina", "saiss", "narjiss", "mont fleuri",
    "route imouzzer", "ain kadous", "route sefrou", "bensouda",
    "hay saada", "dhar mahraz", "zouagha", "aouinate hajjaj",
    "atlas",
  ],
  agadir: [
    "talborjt", "hay mohammadi", "dakhla", "anza", "founty",
    "sonaba", "hay salam", "tikiouine", "bensergao",
    "cite el houda", "hay hassani", "nouveau talborjt",
    "agadir oufella", "les amicales", "illigh", "charaf",
    "cite suisse", "secteur touristique",
  ],
  oujda: [
    "hay quods", "lazaret", "medina", "hay andalous",
    "sidi yahia", "hay nahda", "hay salam", "el irfane",
    "hay massira", "centre ville",
  ],
  meknes: [
    "hamria", "ville nouvelle", "medina", "hay salam",
    "marjane", "ouislane", "hay mohammadi", "agdal",
    "zitoune", "bassatine", "wislane", "toulal",
  ],
  kenitra: [
    "bir rami", "hay salam", "saknia", "hay el wahda",
    "ouled oujih", "medina", "maamora", "ville haute",
    "hay el amal", "hay essalam", "mehdia",
  ],
  tetouan: [
    "medina", "martil", "saniat rmel", "hay moulay rachid",
    "sania", "boukhalef", "mdiq", "azla", "ensanche",
    "samsa", "dersa", "hay al amal",
  ],
  sale: [
    "tabriquet", "hay salam", "hay moulay ismail", "bettana",
    "hay karima", "medina", "sidi moussa", "laayayda",
  ],
  temara: [
    "harhoura", "hay el fath", "centre ville", "wifaq",
    "massira", "hay nahda",
  ],
};

// ═══════════════════════════════════════════════════════════
// POSTAL CODE → CITY — first 2 digits mapping
// ═══════════════════════════════════════════════════════════

export const POSTAL_CODE_TO_CITY: Record<string, string> = {
  "20": "casablanca",
  "21": "casablanca", // Greater Casa
  "10": "rabat",
  "11": "sale",
  "12": "sale",
  "13": "temara",
  "40": "marrakech",
  "90": "tanger",
  "30": "fes",
  "80": "agadir",
  "60": "oujda",
  "50": "meknes",
  "14": "kenitra",
  "93": "tetouan",
  "24": "el jadida",
  "23": "beni mellal",
  "15": "sidi kacem",
  "16": "sidi slimane",
  "35": "taza",
  "45": "ouarzazate",
  "52": "errachidia",
  "25": "khouribga",
  "26": "settat",
  "28": "mohammedia",
  "46": "safi",
  "62": "nador",
  "81": "tiznit",
  "82": "guelmim",
  "85": "tan-tan",
  "70": "laayoune",
  "73": "dakhla",
};

// ═══════════════════════════════════════════════════════════
// ZONE ALIASES — common misspellings / variants
// ═══════════════════════════════════════════════════════════

export const ZONE_ALIASES: Record<string, string> = {
  // Casablanca
  "maarif ext": "maarif extension",
  "maarif extension": "maarif extension",
  "ma3rif": "maarif",
  "anfa sup": "anfa superieur",
  "ain diab extension": "ain diab",
  "sidi maarouf 2": "sidi maarouf",
  "hay hassani 2": "hay hassani",
  "derb soltan": "derb sultan",
  "drb sultan": "derb sultan",
  "sidi moumen 1": "sidi moumen",
  "sidi moumen 2": "sidi moumen",
  "ain sebaâ": "ain sebaa",
  "ain sba3": "ain sebaa",
  "hay mohammedi": "hay mohammadi",
  "2mars": "2 mars",
  "deux mars": "2 mars",
  "bouskoura ville verte": "bouskoura",
  // Rabat
  "quartier agdal": "agdal",
  "hay ryad": "hay riad",
  "ycm": "yacoub el mansour",
  "yacoub mansour": "yacoub el mansour",
  // Marrakech
  "gueliz centre": "gueliz",
  "centre gueliz": "gueliz",
  "syba": "sidi youssef ben ali",
  // Tanger
  "bni makada": "beni makada",
  "beni makada": "beni makada",
  // Fès
  "vn fes": "ville nouvelle",
  "vn": "ville nouvelle",
  // Meknès
  "ouislane": "ouislane",
  "wislane": "wislane",
};

// ═══════════════════════════════════════════════════════════
// ZONE PREFIX PATTERNS — detect quartier from address patterns
// ═══════════════════════════════════════════════════════════

export const ZONE_PREFIXES = [
  "hay", "quartier", "qrt", "cite", "residence", "res",
  "lotissement", "lot", "douar", "derb",
] as const;
