const BASE = '/images/cocktails/'

/**
 * Maps cocktail names to pixel art image filenames.
 * Cocktails sharing the same glass, color, and garnish use the same image.
 */
const COCKTAIL_IMAGE_MAP: Record<string, string> = {
  // === SEASONAL (TEA) → coupe-tea-lemon ===
  'EARL GREY GIN FIZZ': 'coupe-tea-lemon',
  'EARL GREY GIN SOUR': 'coupe-tea-lemon',
  'BOLERO GIN FIZZ': 'coupe-tea-lemon',
  'BOLERO GIN SOUR': 'coupe-tea-lemon',
  'CASSIS OOLONG': 'coupe-tea-lemon',
  'Strawberry Basil Margarita': 'coupe-tea-lemon',
  'STRAWBERRY BASIL MARGARITA': 'coupe-tea-lemon',

  // === REFRESHING ===
  'GIN & TONIC': 'highball-clear-lemon',
  'GIN FIZZ': 'highball-clear-lemon',
  'TOM COLLINS': 'highball-clear-lemon',
  'GIN RICKEY': 'highball-clear-lemon',
  'VODKA SODA': 'highball-clear-lemon',
  'VODKA TONIC': 'highball-clear-lemon',
  'MOSCOW MULE': 'highball-amber-lime',
  "DARK 'N' STORMY": 'highball-amber-lime',
  'WHISKY HIGHBALL': 'highball-amber-lime',
  'CUBA LIBRE': 'highball-cola-lime',
  'PALOMA': 'highball-orange-orange',
  'AMERICANO': 'rocks-red-orange',
  'CAMPARI SPRITZ': 'highball-orange-orange',
  'LIMONCELLO SPRITZ': 'highball-orange-orange',
  'APEROL SPRITZ': 'highball-orange-orange',
  'HUGO SPRITZ': 'highball-orange-orange',
  'GIN BASIL SMASH': 'highball-green-basil',
  'MOJITO': 'highball-green-basil',
  'SPUMONI': 'highball-red-lime',
  'FRENCH 75': 'flute-gold-lemon',
  'SHANDY': 'highball-amber-lime',
  'MICHELADA': 'highball-red-lime',

  // === SWEET / CREAMY ===
  'RUM MILK PUNCH': 'mug-white-nutmeg',
  'BOURBON MILK PUNCH': 'mug-white-nutmeg',
  'DISARONNO MILK': 'mug-white-nutmeg',
  'GARIBALDI': 'highball-sunrise-orange',
  'PINEAPPLE SCREWDRIVER': 'highball-sunrise-orange',
  'ESPRESSO MARTINI': 'coupe-brown-coffee',
  'BANANA DAIQUIRI': 'coupe-amber-lemon',
  'BANANA BREAD': 'coupe-amber-lemon',
  'GRASSHOPPER': 'mug-white-nutmeg',
  'ALEXANDER': 'mug-white-nutmeg',
  'CHOCOLATE SQUIRREL': 'mug-white-nutmeg',
  'IRISH COFFEE': 'mug-brown-cream',
  'WHITE RUSSIAN': 'mug-white-nutmeg',
  'MUDSLIDE': 'mug-white-nutmeg',
  'BRANDY ALEXANDER': 'mug-white-nutmeg',
  'AMARETTO SOUR': 'coupe-amber-lemon',
  'FRANGELICO COFFEE': 'mug-brown-cream',
  'TOASTED ALMOND': 'mug-white-nutmeg',
  'GOLDEN CADILLAC': 'mug-white-nutmeg',
  'PINK SQUIRREL': 'mug-white-nutmeg',

  // === COMPLEX / BOOZY ===
  'OLD FASHIONED': 'rocks-amber-orange',
  'RUM OLD FASHIONED': 'rocks-amber-orange',
  'GIMLET': 'coupe-clear-lemon',
  'DAIQUIRI': 'coupe-clear-lemon',
  "BEE'S KNEES": 'coupe-clear-lemon',
  'DRY MARTINI': 'martini-clear-olive',
  'NEGRONI': 'rocks-red-orange',
  'COLD BREW NEGRONI': 'rocks-red-orange',
  'MEZCAL NEGRONI': 'rocks-red-orange',
  'ESPRESSO NEGRONI': 'rocks-red-orange',
  'BOULEVARDIER': 'rocks-red-orange',
  'MANHATTAN': 'rocks-amber-cherry',
  'BLACK MANHATTAN': 'rocks-amber-cherry',
  'FERNET MANHATTAN': 'rocks-amber-cherry',
  'WHISKY SOUR': 'coupe-amber-lemon',
  'PENICILLIN': 'coupe-amber-lemon',
  'RUSTY NAIL': 'rocks-amber-orange',
  'GOD FATHER': 'rocks-amber-orange',
  'GOD MOTHER': 'rocks-amber-orange',
  'BLACK RUSSIAN': 'coupe-brown-coffee',
  'MARGARITA': 'rocks-amber-lime',
  'COSMOPOLITAN': 'coupe-pink-cherry',
  'WHITE LADY': 'coupe-clear-lemon',
  'PARISIAN': 'coupe-pink-cherry',
  'HANKY PANKY': 'coupe-red-cherry',
  'OLD PAL': 'rocks-amber-lime',
  'ROSITA': 'rocks-amber-lime',
  'END OF THE ROAD': 'coupe-green-lime',
  'BLOODY MARY': 'highball-red-celery',
  'BLOODY CAESAR': 'highball-red-celery',
  'EL DIABLO': 'rocks-amber-lime',
  'SAZERAC': 'rocks-amber-orange',
  'VIEUX CARRE': 'rocks-amber-cherry',
  'LAST WORD': 'coupe-green-lime',
  'CORPSE REVIVER #2': 'coupe-clear-lemon',
  'PAPER PLANE': 'coupe-amber-lemon',
  'NAKED AND FAMOUS': 'coupe-green-lime',
  'BLOOD AND SAND': 'coupe-red-cherry',
  'ROB ROY': 'rocks-amber-cherry',
  'BOBBY BURNS': 'rocks-amber-cherry',
  'SIDECAR': 'coupe-amber-lemon',
  'BETWEEN THE SHEETS': 'coupe-amber-lemon',
  'AVIATION': 'coupe-pink-cherry',
  'CASINO': 'coupe-clear-lemon',
  'BRAMBLE': 'coupe-red-cherry',
  'CLOVER CLUB': 'coupe-pink-cherry',
  'VESPER MARTINI': 'martini-clear-olive',
  'BIJOU': 'coupe-green-lime',
  'MARTINEZ': 'martini-clear-olive',
  'TORONTO': 'rocks-amber-orange',
  'MONTE CARLO': 'rocks-amber-orange',
  'TIPPERARY': 'coupe-green-lime',
  'FINAL WARD': 'coupe-green-lime',
  'TRINIDAD SOUR': 'coupe-red-cherry',
  'JUNGLE BIRD': 'hurricane-orange-cherry',
  'BROWN DERBY': 'coupe-amber-lemon',
  'HEMINGWAY DAIQUIRI': 'coupe-clear-lemon',
  'NAVY GROG': 'hurricane-orange-cherry',
  'ZOMBIE': 'hurricane-orange-cherry',

  // === TROPICAL / LONG ===
  'LONG ISLAND ICED TEA': 'highball-cola-lime',
  'BLUE HAWAIIAN': 'hurricane-blue-cherry',
  'PINA COLADA': 'hurricane-yellow-pineapple',
  'PAINKILLER': 'hurricane-yellow-pineapple',
  'MADRAS': 'highball-sunrise-orange',
  'BAY BREEZE': 'highball-sunrise-orange',
  'SUNRISE': 'highball-sunrise-orange',
  'FERNET CON COCA': 'highball-cola-lime',
  'MAI TAI': 'hurricane-orange-cherry',
  'HURRICANE': 'hurricane-orange-cherry',
  'SINGAPORE SLING': 'hurricane-orange-cherry',
  "PLANTER'S PUNCH": 'hurricane-orange-cherry',
  'SCORPION': 'hurricane-orange-cherry',
  'BAHAMA MAMA': 'hurricane-orange-cherry',
  'SEX ON THE BEACH': 'highball-sunrise-orange',
  'RUM RUNNER': 'hurricane-orange-cherry',
  'CARIBBEAN PUNCH': 'hurricane-orange-cherry',

  // === SHOTS & SHOOTER ===
  'FERNET BRANCA': 'shot-amber-none',
  'HARD START': 'shot-amber-none',
  'PUNT E MES': 'shot-amber-none',
  'CAMPARI': 'shot-amber-none',
  'B-52': 'shot-amber-none',
  'KAMIKAZE': 'shot-amber-none',
  'LEMON DROP SHOT': 'shot-amber-none',
  'JAGERBOMB': 'shot-amber-none',
}

/** Category fallback images */
const CATEGORY_DEFAULTS: Record<string, string> = {
  seasonal: 'coupe-tea-lemon',
  refreshing: 'highball-clear-lemon',
  sweet: 'mug-white-nutmeg',
  complex: 'rocks-amber-orange',
  tropical: 'hurricane-orange-cherry',
  shots: 'shot-amber-none',
}

/**
 * Get the pixel art image URL for a cocktail.
 * Priority: cocktail.image_url (DB override) > name mapping > category default > null
 */
export function getCocktailImageUrl(cocktail: {
  name: string
  category?: string
  image_url?: string
}): string | null {
  if (cocktail.image_url) return cocktail.image_url

  const mapped = COCKTAIL_IMAGE_MAP[cocktail.name]
  if (mapped) return `${BASE}${mapped}.svg`

  // Try uppercase match
  const upper = COCKTAIL_IMAGE_MAP[cocktail.name.toUpperCase()]
  if (upper) return `${BASE}${upper}.svg`

  // Category fallback
  if (cocktail.category) {
    const cat = CATEGORY_DEFAULTS[cocktail.category]
    if (cat) return `${BASE}${cat}.svg`
  }

  return null
}
