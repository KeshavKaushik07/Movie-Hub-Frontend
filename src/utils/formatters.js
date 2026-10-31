import {
  TMDB,
  toGenreSlug,
  resolveGenreId,
  resolveGenreName,
  getOttSlug,
  resolveOttKey,
  getOttPath,
  toBrowseTypeSlug,
  fromBrowseTypeSlug,
  getBrowsePath,
} from '../config/constants';

export {
  toGenreSlug,
  resolveGenreId,
  resolveGenreName,
  getOttSlug,
  resolveOttKey,
  getOttPath,
  toBrowseTypeSlug,
  fromBrowseTypeSlug,
  getBrowsePath,
};

export const USD_TO_INR_RATE = 83.5;

export const detectDefaultRegion = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const langs = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language || '',
    ].join(' ');
    if (
      tz.includes('Kolkata') ||
      tz.includes('Calcutta') ||
      tz.includes('Asia/Colombo') ||
      /-IN\b/i.test(langs) ||
      /\b(hi|te|ta|ml|kn|mr|bn|gu|pa)\b/i.test(langs)
    ) {
      return 'IN';
    }
  } catch {
    /* ignore */
  }
  return 'IN';
};

const SLUG_CACHE_KEY = 'movieshub_slug_lookup_v9';
const PERSON_SLUG_CACHE_KEY = 'movieshub_person_slug_lookup_v2';
const inMemorySlugMap = new Map();
const inMemoryPersonSlugMap = new Map();

export const toSlug = (str = '') =>
  String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'title';

export const registerSlugMapping = (slugOrItem, maybeItem = null) => {
  const item = maybeItem || (typeof slugOrItem === 'object' ? slugOrItem : null);
  const slug =
    typeof slugOrItem === 'string'
      ? slugOrItem.toLowerCase().trim()
      : toSlug(item?.slug || item?.title || item?.name || '');
  if (!slug || (!item?.id && !item?.tmdbId)) return;

  const isWeb = Boolean(
    item.isWebSeries || item.subType === 'webseries' || item.type === 'webseries' || item.type === 'web-series',
  );
  const baseType =
    isWeb || item.type === 'tv' || item.media_type === 'tv' || item.type === 'tv-show' || item.type === 'tv-shows'
      ? 'tv'
      : 'movie';

  const entry = {
    id: item.id || item.tmdbId,
    type: baseType,
    subType: isWeb ? 'webseries' : baseType,
    isWebSeries: isWeb,
    title: item.title || item.name || '',
  };
  inMemorySlugMap.set(slug, entry);
  try {
    const raw = sessionStorage.getItem(SLUG_CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[slug] = entry;
    sessionStorage.setItem(SLUG_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
};

export const resolveSlugMapping = (slug) => {
  if (!slug) return null;
  const clean = decodeURIComponent(String(slug)).toLowerCase().trim();
  if (inMemorySlugMap.has(clean)) return inMemorySlugMap.get(clean);
  try {
    const raw = sessionStorage.getItem(SLUG_CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj?.[clean]) return obj[clean];
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const registerPersonSlugMapping = (slug, id, gender = null) => {
  if (!slug || !id) return;
  const key = String(slug).toLowerCase().trim();
  const entry = { id: Number(id), gender };
  inMemoryPersonSlugMap.set(key, entry);
  try {
    const raw = sessionStorage.getItem(PERSON_SLUG_CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[key] = entry;
    sessionStorage.setItem(PERSON_SLUG_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
};

export const resolvePersonSlugMapping = (slug) => {
  if (!slug) return null;
  const key = decodeURIComponent(String(slug)).toLowerCase().trim();
  if (inMemoryPersonSlugMap.has(key)) return inMemoryPersonSlugMap.get(key);
  try {
    const raw = sessionStorage.getItem(PERSON_SLUG_CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj?.[key]) return obj[key];
    }
  } catch {
    /* ignore */
  }
  return null;
};

const PERSON_GENDER_STORAGE_KEY = 'movieshub_person_gender_v2';
const personGenderMemory = new Map();

// Hydrate remembered person genders from localStorage on startup
try {
  const raw = localStorage.getItem(PERSON_GENDER_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (v === 1 || v === 2) personGenderMemory.set(k, v);
      }
    }
  }
} catch {
  /* ignore */
}

const rememberPersonGender = (nameKey, genderNum) => {
  if (!nameKey || (genderNum !== 1 && genderNum !== 2)) return;
  personGenderMemory.set(nameKey, genderNum);
  try {
    const raw = localStorage.getItem(PERSON_GENDER_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (obj[nameKey] !== genderNum) {
      obj[nameKey] = genderNum;
      localStorage.setItem(PERSON_GENDER_STORAGE_KEY, JSON.stringify(obj));
    }
  } catch {
    /* ignore */
  }
};

const KNOWN_FEMALE_NAMES = new Set([
  // Indian (Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood)
  'deepika', 'alia', 'samantha', 'rashmika', 'katrina', 'kareena', 'priyanka', 'anushka',
  'shraddha', 'kriti', 'kiara', 'taapsee', 'vidya', 'kangana', 'nayanthara', 'trisha',
  'pooja', 'tamannaah', 'tamanna', 'kajal', 'madhuri', 'sridevi', 'rekha',
  'kajol', 'rani', 'aishwarya', 'janhvi', 'sara', 'ananya', 'suhana', 'triptii', 'tripti',
  'mrunal', 'wamiqa', 'sobhita', 'radhika', 'tabu', 'hema', 'jaya', 'shabana', 'smita',
  'konkona', 'bipasha', 'sonam', 'sonakshi', 'parineeti', 'disha', 'jacqueline', 'nora',
  'yami', 'bhumi', 'richa', 'huma', 'nimrat', 'shefali', 'tillotama', 'neena', 'ratna',
  'supriya', 'revathi', 'ramya', 'soundarya', 'keerthy', 'krithi', 'sreeleela', 'meenakshi',
  'nazriya', 'manju', 'parvathy', 'kalyani', 'nikhila', 'mamitha', 'anaswara', 'rukmini',
  'jyothika', 'simran', 'asin', 'genelia', 'ileana', 'hansika', 'shruti', 'raashi',
  'rakul', 'lavanya', 'nivetha', 'anupama', 'malavika', 'andrea', 'amala', 'sneha',
  'bhavana', 'kavya', 'navya', 'priyamani', 'swathi', 'nithya', 'archana', 'aditi',
  'diana', 'vaani', 'fatima', 'sanya', 'zaira', 'sharvari', 'medha', 'pratibha',
  'nitanshi', 'chhaya', 'mona', 'rasika', 'shweta', 'sayani', 'kritika',
  'gauahar', 'karisma', 'twinkle', 'raveena', 'urmila', 'manisha', 'juhi', 'preity',
  'shilpa', 'lara', 'celina', 'esha', 'amrita', 'ameesha', 'gracy', 'dia', 'soha',
  'neha', 'kalki', 'nimisha', 'darshana', 'grace', 'bindu', 'waheeda', 'nargis',
  'mumtaz', 'zeenat', 'parveen', 'neetu', 'dimple', 'poonam', 'padmini',
  'savitri', 'jamuna', 'sarada', 'suhasini', 'nadhiya', 'bhanupriya', 'radha', 'ambika',
  'khushbu', 'roja', 'devayani', 'rambha', 'laila', 'sadha', 'gopika',
  // Global, Hollywood, British, European, Voice Actresses & International
  'hynden', 'zendaya', 'margot', 'scarlett', 'emma', 'jennifer', 'angelina', 'natalie', 'anne',
  'emily', 'florence', 'sydney', 'ana', 'gal', 'elizabeth', 'brie', 'cate', 'kate',
  'meryl', 'viola', 'sandra', 'julia', 'nicole', 'charlize', 'amy', 'jessica', 'rachel',
  'amanda', 'lily', 'jenna', 'millie', 'sadie', 'anya', 'daisy', 'saoirse', 'rebecca',
  'hayley', 'vanessa', 'salma', 'penelope', 'eva', 'marion', 'lea', 'winona', 'uma',
  'cameron', 'drew', 'halle', 'gwyneth', 'reese', 'renée', 'renee', 'hilary', 'keira',
  'rosamund', 'carey', 'felicity', 'claire', 'olivia', 'gemma', 'tilda', 'helena',
  'maggie', 'judi', 'helen', 'julianne', 'sigourney', 'jodie', 'michelle',
  'awkwafina', 'constance', 'sonoya', 'karen', 'pom', 'zoe', 'zoë', 'letitia',
  'lupita', 'danai', 'tessa', 'hailee', 'chloë', 'chloe', 'sophie', 'maisie', 'emilia',
  'lena', 'gwendoline', 'natalia', 'maya', 'gillian', 'kaley',
  'courteney', 'lisa', 'sarah', 'ellen', 'kristen', 'dakota', 'elle', 'kirsten',
  'blake', 'leighton', 'nina', 'candice', 'kat', 'phoebe', 'freya', 'billie',
  'tara', 'grey', 'cree', 'ashley', 'laura', 'bailey', 'tricia', 'janet', 'wendy',
  'nancy', 'pamela', 'kathleen', 'susan', 'linda', 'barbara', 'patricia', 'deborah',
  'cynthia', 'ashly', 'cherami', 'erica', 'kira', 'cristina', 'stephanie', 'melissa',
  'megan', 'brittany', 'kayla', 'amber', 'danielle', 'chelsea', 'heather', 'tiffany',
  'kimberly', 'christina', 'crystal', 'erin', 'allison', 'alexandra', 'victoria',
  'brooke', 'katherine', 'catherine', 'christine', 'marie', 'julie', 'joyce', 'virginia',
  'kelly', 'lauren', 'joan', 'evelyn', 'judith', 'cheryl', 'hannah', 'martha', 'gloria',
  'teresa', 'ann', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'alice',
  'judy', 'sophia', 'denise', 'doris', 'marilyn', 'beverly', 'isabella', 'theresa',
  'charlotte', 'alexis', 'lori', 'betty', 'donna', 'carol', 'ruth', 'sharon', 'shirley',
  'angela', 'brenda', 'anna', 'debra', 'carolyn', 'diane', 'mildred', 'rose', 'kathy',
  'tammy', 'irene', 'jane', 'louise', 'wanda', 'bonnie', 'ruby', 'lois', 'tina', 'phyllis',
  'norma', 'paula', 'annie', 'lillian', 'peggy', 'gladys', 'rita', 'dawn', 'connie',
  'edna', 'carmen', 'rosa', 'cindy', 'edith', 'sherry', 'sylvia', 'josephine', 'thelma',
  'shannon', 'sheila', 'ethel', 'elaine', 'marjorie', 'carrie', 'monica', 'esther',
  'pauline', 'juanita', 'anita', 'rhonda', 'hazel', 'debbie', 'april', 'lucille',
  'joanne', 'eleanor', 'valerie', 'alicia', 'suzanne', 'michele', 'gail', 'bertha',
  'darlene', 'veronica', 'jill', 'geraldine', 'cathy', 'joann', 'lorraine', 'lynn',
  'sally', 'regina', 'beatrice', 'dolores', 'bernice', 'audrey', 'yvonne', 'annette',
  'june', 'marion', 'stacy', 'ida', 'vivian', 'roberta', 'holly', 'melanie', 'loretta',
  'yolanda', 'jeanette', 'laurie', 'katie', 'alma', 'sue', 'elsie', 'beth', 'jeanne',
  'vicki', 'carla', 'rosemary', 'eileen', 'terri', 'gertrude', 'lucy', 'tonya', 'ella',
  'stacey', 'wilma', 'gina', 'kristin', 'agnes', 'vera', 'charlene', 'bessie', 'delores',
  'melinda', 'pearl', 'arlene', 'maureen', 'colleen', 'tamara', 'joy', 'georgia', 'lillie',
  'claudia', 'marcia', 'tanya', 'nellie', 'minnie', 'marlene', 'heidi', 'glenda', 'lydia',
  'courtney', 'marian', 'stella', 'caroline', 'dora', 'vickie', 'mattie', 'maxine', 'irma',
  'mabel', 'marsha', 'myrtle', 'christy', 'deanna', 'patsy', 'hilda', 'gwendolyn', 'jennie',
  'margie', 'cassandra', 'leah', 'penny', 'kay', 'priscilla', 'naomi', 'carole', 'brandy',
  'olga', 'dianne', 'tracey', 'leona', 'jenny', 'felicia', 'sonia', 'miriam', 'velma',
  'becky', 'violet', 'kristina', 'toni', 'misty', 'mae', 'shelly', 'ramona', 'sherri',
  'erika', 'lindsey', 'lindsay', 'geneva', 'guadalupe', 'belinda', 'margarita', 'sheryl',
  'cora', 'faye', 'ada', 'natasha', 'sabrina', 'isabel', 'marguerite', 'hattie', 'harriet',
  'molly', 'cecilia', 'kristi', 'brandi', 'blanche', 'sandy', 'rosie', 'joanna', 'iris',
  'eunice', 'angie', 'inez', 'lynda', 'madeline', 'amelia', 'alberta', 'genevieve',
  'monique', 'jodi', 'janie', 'sonya', 'kristine', 'candace', 'fannie', 'maryann', 'opal',
  'alison', 'yvette', 'melody', 'luz', 'susie', 'flora', 'shelley', 'kristy', 'mamie',
  'lula', 'lola', 'verna', 'beulah', 'antoinette', 'juana', 'jeannette', 'pam', 'kelli',
  'whitney', 'bridget', 'karla', 'celia', 'latoya', 'patty', 'shelia', 'gayle', 'della',
  'vicky', 'lynne', 'sheri', 'marianne', 'kara', 'jacquelyn', 'erma', 'blanca', 'myra',
  'leticia', 'krista', 'roxanne', 'angelica', 'robyn', 'adrienne', 'rosalie', 'bethany',
  'bernadette', 'traci', 'jody', 'kendra', 'jasmine', 'nichole', 'rachael', 'mable',
  'ernestine', 'muriel', 'marcella', 'elena', 'krystal', 'nadine', 'kari', 'estelle',
  'dianna', 'paulette', 'lora', 'doreen', 'rosemarie', 'desiree', 'antonia', 'hope',
  'ginger', 'janis', 'betsy', 'christie', 'freda', 'mercedes', 'meredith', 'lynette',
  'teri', 'ebony', 'leigh', 'meghan', 'eloise', 'rochelle', 'gretchen', 'cecelia',
  'raquel', 'henrietta', 'alyssa', 'jana', 'kelley', 'gwen', 'laverne', 'olive', 'tasha',
  'silvia', 'elvira', 'delia', 'patti', 'lorena', 'kellie', 'sonja', 'lila', 'lana',
  'darla', 'may', 'mindy', 'essie', 'mandy', 'lorene', 'elsa', 'josefina', 'jeannie',
  'miranda', 'dixie', 'lucia', 'marta', 'faith', 'lela', 'johanna', 'shari', 'camille',
  'tami', 'shawna', 'elisa', 'eboni', 'melba', 'ora', 'nettie', 'tabitha', 'winifred',
  'kristie', 'marina', 'selena', 'ariana', 'camila', 'dua', 'taylor', 'beyonce', 'rihanna',
  'adele', 'celine', 'shakira', 'madonna', 'cher', 'barbra', 'dolly', 'rebel', 'isla',
  'rose', 'naomie', 'thandiwe', 'gugu', 'lashana', 'michaela', 'simone', 'charithra',
  'nicola', 'claudia', 'phoebe', 'adjoa', 'golda', 'ruth', 'fiona', 'imelda', 'lesley',
  'olivia', 'gillian', 'keeley', 'suranne', 'jodie', 'vicky', 'morfydd', 'aisling',
  'saoirse', 'kerry', 'evanna', 'jessica', 'holliday', 'lily', 'vanessa', 'hera',
  'sylvia', 'noomi', 'alicia', 'rebecca', 'ingrid', 'greta', 'liv', 'bibi', 'astrid',
  'zarah', 'marlene', 'romy', 'hanna', 'nina', 'paula', 'sandra', 'diane', 'franka',
  'martina', 'sibylle', 'karoline', 'jella', 'leonie', 'luise', 'mala', 'helena',
  'penélope', 'paz', 'rossy', 'carmen', 'blanca', 'úrsula', 'ursula', 'ester', 'najwa',
  'alba', 'itziar', 'belén', 'belen', 'maribel', 'elena', 'aitana', 'milena', 'laia',
  'monica', 'sophia', 'claudia', 'gina', 'ornella', 'asia', 'valeria', 'jasmine',
  'alba', 'matilda', 'sveva', 'miriam', 'cristiana', 'margherita', 'vittoria',
  'catherine', 'isabelle', 'juliette', 'marion', 'audrey', 'léa', 'lea', 'eva',
  'bérénice', 'berenice', 'mélanie', 'melanie', 'clémence', 'clemence', 'adèle',
  'virginie', 'fanny', 'brigitte', 'jeanne', 'simone', 'delphine', 'emmanuelle',
  'sophie', 'charlotte', 'camille', 'noémie', 'noemie', 'golshifteh', 'zar',
  'ho-yeon', 'hoyeon', 'ji-hyun', 'jihyun', 'hye-kyo', 'hyekyo', 'ye-jin', 'yejin',
  '태리', 'suzy', 'bae', 'iu', 'yoona', 'so-hee', 'sohee', 'go-eun', 'goeun',
  'do-yeon', 'doyeon', '여정', 'yuh-jung', 'min-hee', 'minhee', 'bo-young', 'boyoung',
  'shin-hye', 'shinhye', 'min-young', 'minyoung', 'se-jeong', 'sejeong', 'eun-bin', 'eunbin',
]);

const FEMALE_CHARACTER_PATTERNS = /\b(princess|queen|girl|woman|lady|mother|mom|mama|mum|sister|wife|daughter|bride|aunt|auntie|grandma|grandmother|nanny|goddess|witch|waitress|actress|hostess|stewardess|maid|nun|baroness|duchess|countess|empress|mrs\.?|ms\.?|miss|madam|madame|mademoiselle|senora|senorita|fraulein|frau|heroine|female|she|her|starfire|bubblegum|wonder woman|black widow|catwoman|supergirl|batgirl|harley quinn|lois lane|mary jane|gwen stacy|jean grey|mystique|scarlet witch|gamora|nebula|mantis|shuri|okoye|valkyrie|captain marvel|yelena|kate bishop|padme|ahsoka|hermione|ginny|bellatrix|galadriel|arwen|eowyn|katniss|cinderella|rapunzel|maleficent|cruella|ursula)\b/i;

/**
 * Formats an actor/actoress name with hyphens (-) instead of spaces (%20):
 * e.g. "Shiva Rajkumar" -> "Shiva-Rajkumar"
 */
export const formatPersonSlug = (name = '') =>
  String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\u00C0-\u024F-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'Artist';

/**
 * Converts a hyphenated URL param ("Shiva-Rajkumar") back into a normal name ("Shiva Rajkumar").
 */
export const parsePersonSlugToName = (slug = '') =>
  decodeURIComponent(String(slug || ''))
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Determines whether a person URL should use "/actor" (male) or "/actoress" (female)
 * for EVERY industry (Hollywood, Bollywood, Anime, Korean, European, etc.).
 * TMDB gender convention: 1 = female ("actoress"), 2 = male ("actor").
 */
export const resolvePersonRoleSegment = (personOrName, genderOverride = null) => {
  const obj =
    typeof personOrName === 'object' && personOrName !== null
      ? personOrName
      : { name: String(personOrName || '') };
  const rawName = parsePersonSlugToName(obj.name || '');
  const nameKey = rawName.toLowerCase();

  // 1. Check explicit gender value (1 = female -> actoress, 2 = male -> actor)
  const explicitGender = genderOverride ?? obj.gender;
  if (
    explicitGender === 1 ||
    explicitGender === '1' ||
    String(explicitGender).toLowerCase() === 'female' ||
    String(explicitGender).toLowerCase() === 'actoress' ||
    String(explicitGender).toLowerCase() === 'actress'
  ) {
    rememberPersonGender(nameKey, 1);
    return 'actoress';
  }
  if (
    explicitGender === 2 ||
    explicitGender === '2' ||
    String(explicitGender).toLowerCase() === 'male' ||
    String(explicitGender).toLowerCase() === 'actor'
  ) {
    rememberPersonGender(nameKey, 2);
    return 'actor';
  }

  // 2. Check biography pronouns & keywords ("she", "her", "actress" vs "he", "him", "his", "actor")
  const bio = String(obj.biography || '');
  if (bio) {
    const femMatches = (bio.match(/\b(she|her|hers|actress|heroine|women|woman|daughter|wife|mother|sister)\b/gi) || []).length;
    const maleMatches = (bio.match(/\b(he|him|his|actor|son|husband|father|brother)\b/gi) || []).length;
    if (femMatches > maleMatches) {
      rememberPersonGender(nameKey, 1);
      return 'actoress';
    }
    if (maleMatches > femMatches) {
      rememberPersonGender(nameKey, 2);
      return 'actor';
    }
  }

  // 3. Check persistent memory (from previous visits or Person page loads)
  const remembered = nameKey ? personGenderMemory.get(nameKey) : null;
  if (remembered === 1) return 'actoress';
  if (remembered === 2) return 'actor';

  // 4. Check character role name if available on a Cast card (e.g. "Starfire", "Princess Bubblegum", "Queen", "Mother")
  const charStr = String(obj.character || '');
  if (charStr && FEMALE_CHARACTER_PATTERNS.test(charStr)) {
    rememberPersonGender(nameKey, 1);
    return 'actoress';
  }
  const charFirstWord = charStr.toLowerCase().replace(/^\(voice\)|voice of/i, '').trim().split(/\s+/)[0]?.replace(/[^a-z]/g, '');
  if (charFirstWord && KNOWN_FEMALE_NAMES.has(charFirstWord)) {
    rememberPersonGender(nameKey, 1);
    return 'actoress';
  }

  // 5. Check person's first name against global + Indian female names dictionary
  const firstWord = nameKey.split(/\s+/)[0]?.replace(/[^a-z\u00C0-\u024F]/g, '');
  if (firstWord && KNOWN_FEMALE_NAMES.has(firstWord)) {
    rememberPersonGender(nameKey, 1);
    return 'actoress';
  }
  if (
    nameKey === 'sai pallavi' ||
    nameKey === 'sai tamhankar' ||
    nameKey === 'saiyami kher' ||
    nameKey === 'meena kumari'
  ) {
    rememberPersonGender(nameKey, 1);
    return 'actoress';
  }

  return 'actor';
};

export const getPersonPath = (
  personOrName,
  idOverride = null,
  genderOverride = null,
) => {
  const obj =
    typeof personOrName === 'object' && personOrName !== null
      ? personOrName
      : { name: String(personOrName || '') };
  const cleanName = parsePersonSlugToName(obj.name || '');
  const slug = formatPersonSlug(cleanName);
  const id = idOverride ?? obj.id ?? obj.tmdbId ?? null;
  const roleSegment = resolvePersonRoleSegment(obj, genderOverride);
  if (id) {
    registerPersonSlugMapping(slug, id, genderOverride ?? obj.gender ?? null);
  }
  return `/${roleSegment}/${slug}`;
};

/**
 * Resolves the singular URL route prefix for a title:
 * - Movie:      `movie`      -> `/movie/:slug`
 * - Web Series: `web-series` -> `/web-series/:slug`
 * - TV Show:    `tv-show`    -> `/tv-show/:slug`
 */
export const resolveSingularTitleSegment = (item = {}, typeOverride = null) => {
  const tOver = String(typeOverride || '').toLowerCase().trim();
  if (
    tOver === 'webseries' ||
    tOver === 'web-series' ||
    item?.isWebSeries ||
    item?.subType === 'webseries' ||
    item?.type === 'webseries' ||
    item?.type === 'web-series'
  ) {
    return 'web-series';
  }
  if (
    tOver === 'tv' ||
    tOver === 'tv-show' ||
    tOver === 'tv-shows' ||
    tOver === 'tv-series' ||
    item?.type === 'tv' ||
    item?.media_type === 'tv' ||
    item?.subType === 'tv' ||
    Boolean(item?.first_air_date && !item?.release_date)
  ) {
    return 'tv-show';
  }
  return 'movie';
};

/**
 * Generates clean, bot-friendly singular SEO URLs with NO `/detail` prefix:
 * - Movie:      `/movie/ranabaali#overview`
 * - Web Series: `/web-series/mirzapur#overview`
 * - TV Show:    `/tv-show/breaking-bad#overview`
 */
export const getTitlePath = (item = {}, typeOverride = null, hash = '') => {
  if (!item) return '/';
  const singularSegment = resolveSingularTitleSegment(item, typeOverride);
  const slug =
    item.slug ||
    toSlug(
      item.title ||
        item.name ||
        item.originalTitle ||
        `${singularSegment}-${item.id || item.tmdbId || 'title'}`,
    );

  if (item.id || item.tmdbId) {
    registerSlugMapping(slug, {
      ...item,
      type: singularSegment === 'movie' ? 'movie' : 'tv',
      subType: singularSegment === 'web-series' ? 'webseries' : singularSegment === 'tv-show' ? 'tv' : 'movie',
      isWebSeries: singularSegment === 'web-series',
    });
  }

  const hashSuffix = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `/${singularSegment}/${slug}${hashSuffix}`;
};

/**
 * Checks whether a movie or series has a release date strictly in the future (unreleased / upcoming).
 */
export const isUpcomingRelease = (item = {}) => {
  if (!item) return false;
  if (item.isUpcoming === true) return true;
  const rawDate = item.releaseDate || item.release_date || item.first_air_date;
  if (!rawDate) return false;
  const ms = new Date(rawDate).getTime();
  return Number.isFinite(ms) && ms > Date.now();
};

/**
 * Parses any raw number or formatted currency string into a normalized USD/INR number.
 */
export const parseRawCurrencyValue = (raw) => {
  if (raw === null || raw === undefined || raw === '') return { value: 0, currency: 'USD' };
  if (typeof raw === 'number') {
    return { value: Number.isFinite(raw) && raw > 0 ? raw : 0, currency: 'USD' };
  }

  const str = String(raw).trim();
  if (!str || /not disclosed|tba|n\/a|unknown|^-$|^0$/i.test(str)) {
    return { value: 0, currency: 'USD' };
  }

  const isInr = str.includes('₹') || /cr|crore|lakh|inr|rs/i.test(str);
  const numMatch = str.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch) return { value: 0, currency: 'USD' };

  let num = parseFloat(numMatch[1]);
  if (!Number.isFinite(num) || num <= 0) return { value: 0, currency: 'USD' };

  if (/\bb|\bbillion/i.test(str)) num *= 1_000_000_000;
  else if (/\bm|\bmillion/i.test(str)) num *= 1_000_000;
  else if (/\bk|\bthousand/i.test(str)) num *= 1_000;
  else if (/cr|crore/i.test(str)) num *= 10_000_000;
  else if (/lakh|lac/i.test(str)) num *= 100_000;

  return { value: num, currency: isInr ? 'INR' : 'USD' };
};

export const estimateItemFinancialsUSD = () => ({ budgetUsd: 0, revenueUsd: 0 });

/**
 * Formats a disclosed numeric or string amount into Indian Rupees (₹ Crore / ₹ Lakh) when `region === 'IN'`,
 * and into `$ Million / $ Billion` when `region === 'GLOBAL'`.
 * Returns `fallback` (default `''`) when the amount is 0 or undisclosed.
 */
export const formatBudgetOrBoxOffice = (rawAmount, options = {}) => {
  const {
    region = detectDefaultRegion(),
    sourceCurrency = 'USD',
    fallback = '',
  } = options;

  const preferINR = region === 'IN' || options.currency === 'INR';
  const parsed = parseRawCurrencyValue(rawAmount);

  if (parsed.value <= 0) {
    return fallback;
  }

  const effectiveSource = parsed.currency || sourceCurrency;

  if (preferINR) {
    const inrValue = effectiveSource === 'INR' ? parsed.value : parsed.value * USD_TO_INR_RATE;
    const crore = 10_000_000;
    const lakh = 100_000;

    if (inrValue >= crore) {
      const cr = inrValue / crore;
      return `₹${cr >= 100 ? Math.round(cr).toLocaleString('en-IN') : cr.toFixed(1)} Cr`;
    }
    if (inrValue >= lakh) {
      return `₹${(inrValue / lakh).toFixed(1)} Lakh`;
    }
    return `₹${Math.round(inrValue).toLocaleString('en-IN')}`;
  }

  const usdValue = effectiveSource === 'INR' ? parsed.value / USD_TO_INR_RATE : parsed.value;
  if (usdValue >= 1_000_000_000) {
    return `$${(usdValue / 1_000_000_000).toFixed(2)}B`;
  }
  if (usdValue >= 1_000_000) {
    return `$${(usdValue / 1_000_000).toFixed(1)}M`;
  }
  if (usdValue >= 1_000) {
    return `$${(usdValue / 1_000).toFixed(0)}K`;
  }
  return `$${Math.round(usdValue).toLocaleString('en-US')}`;
};

/**
 * Only returns genuinely disclosed Budget & Box Office numbers.
 * If a title is an unreleased Upcoming movie (`isUpcomingRelease(item)`),
 * box office collections and verdicts are suppressed so unreleased titles never show fake verdicts/gross.
 */
export const getMovieFinancials = (item = {}, region = detectDefaultRegion()) => {
  const bo = item?.boxOffice || {};
  const isBackendEstimated = Boolean(item?.financialEstimated);
  const unreleased = isUpcomingRelease(item);

  const parsedBudget = isBackendEstimated
    ? { value: 0, currency: 'USD' }
    : parseRawCurrencyValue(item?.budget || bo.budget || bo.budgetFormatted);
  const parsedRevenue =
    isBackendEstimated || unreleased
      ? { value: 0, currency: 'USD' }
      : parseRawCurrencyValue(bo.worldwideCollection || item?.revenue || bo.revenue);

  const finalBudgetUsd =
    parsedBudget.value > 0
      ? parsedBudget.currency === 'INR'
        ? parsedBudget.value / USD_TO_INR_RATE
        : parsedBudget.value
      : 0;

  const finalRevenueUsd =
    parsedRevenue.value > 0
      ? parsedRevenue.currency === 'INR'
        ? parsedRevenue.value / USD_TO_INR_RATE
        : parsedRevenue.value
      : 0;

  const indiaNetParsed = unreleased ? { value: 0, currency: 'INR' } : parseRawCurrencyValue(bo.indiaNetCollection);
  const indiaGrossParsed = unreleased ? { value: 0, currency: 'INR' } : parseRawCurrencyValue(bo.indiaGrossCollection);
  const openingWeekendParsed = unreleased ? { value: 0, currency: 'USD' } : parseRawCurrencyValue(bo.openingWeekend);
  const openingDayParsed = unreleased ? { value: 0, currency: 'USD' } : parseRawCurrencyValue(bo.openingDay);
  const domesticParsed = unreleased ? { value: 0, currency: 'USD' } : parseRawCurrencyValue(bo.domesticCollection);
  const intlParsed = unreleased ? { value: 0, currency: 'USD' } : parseRawCurrencyValue(bo.internationalCollection);

  const hasBudget = finalBudgetUsd > 0;
  const hasRevenue = !unreleased && finalRevenueUsd > 0;
  const hasFinancials =
    hasBudget ||
    hasRevenue ||
    indiaNetParsed.value > 0 ||
    indiaGrossParsed.value > 0 ||
    openingWeekendParsed.value > 0 ||
    openingDayParsed.value > 0 ||
    domesticParsed.value > 0 ||
    intlParsed.value > 0;

  let computedVerdict = '';
  if (!unreleased) {
    if (bo.verdict && bo.verdict !== 'TBA' && !isBackendEstimated && hasRevenue) {
      computedVerdict = bo.verdict;
    } else if (hasBudget && hasRevenue) {
      const ratio = finalRevenueUsd / finalBudgetUsd;
      computedVerdict =
        ratio >= 3.5
          ? 'All-Time Blockbuster'
          : ratio >= 2.4
            ? 'Blockbuster'
            : ratio >= 1.75
              ? 'Super Hit'
              : ratio >= 1.25
                ? 'Hit'
                : ratio >= 0.95
                  ? 'Average'
                  : 'Flop';
    }
  }

  const profitUsd =
    hasBudget && hasRevenue && finalRevenueUsd > finalBudgetUsd
      ? finalRevenueUsd - finalBudgetUsd
      : 0;
  const roiPercent =
    hasBudget && hasRevenue
      ? Math.round(((finalRevenueUsd - finalBudgetUsd) / finalBudgetUsd) * 100)
      : null;

  return {
    isEstimated: false,
    isUpcoming: unreleased,
    hasBudget,
    hasRevenue,
    hasFinancials,
    verdict: computedVerdict,
    roiPercent,
    budgetText: hasBudget ? formatBudgetOrBoxOffice(finalBudgetUsd, { region }) : '',
    revenueText: hasRevenue ? formatBudgetOrBoxOffice(finalRevenueUsd, { region }) : '',
    profitText: profitUsd > 0 ? formatBudgetOrBoxOffice(profitUsd, { region }) : '',
    indiaNetText:
      indiaNetParsed.value > 0
        ? formatBudgetOrBoxOffice(indiaNetParsed.value, {
            region,
            sourceCurrency: indiaNetParsed.currency,
          })
        : '',
    indiaGrossText:
      indiaGrossParsed.value > 0
        ? formatBudgetOrBoxOffice(indiaGrossParsed.value, {
            region,
            sourceCurrency: indiaGrossParsed.currency,
          })
        : '',
    openingWeekendText:
      openingWeekendParsed.value > 0
        ? formatBudgetOrBoxOffice(openingWeekendParsed.value, {
            region,
            sourceCurrency: openingWeekendParsed.currency,
          })
        : '',
    openingDayText:
      openingDayParsed.value > 0
        ? formatBudgetOrBoxOffice(openingDayParsed.value, {
            region,
            sourceCurrency: openingDayParsed.currency,
          })
        : '',
    domesticText:
      domesticParsed.value > 0
        ? formatBudgetOrBoxOffice(domesticParsed.value, {
            region,
            sourceCurrency: domesticParsed.currency,
          })
        : '',
    internationalText:
      intlParsed.value > 0
        ? formatBudgetOrBoxOffice(intlParsed.value, {
            region,
            sourceCurrency: intlParsed.currency,
          })
        : '',
    usdBudgetSub: hasBudget ? `$${(finalBudgetUsd / 1_000_000).toFixed(1)}M USD` : '',
    usdRevenueSub: hasRevenue ? `$${(finalRevenueUsd / 1_000_000).toFixed(1)}M USD` : '',
  };
};

export const createFallbackSvg = (label = 'Image Not Available', variant = 'poster') => {
  const safeText = String(label || 'Movies Hub')
    .replace(/[&<>"']/g, '')
    .slice(0, 28);

  if (variant === 'avatar') {
    const initials =
      safeText
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'MH';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <circle cx="100" cy="78" r="34" fill="#334155"/>
      <path d="M40 185 C40 138 160 138 160 185" fill="#334155"/>
      <text x="100" y="90" text-anchor="middle" fill="#f5b942" font-family="sans-serif" font-weight="700" font-size="26">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  if (variant === 'backdrop') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#090d16"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="640" cy="310" r="54" fill="none" stroke="#f5b942" stroke-width="3" opacity="0.5"/>
      <polygon points="628,288 628,332 666,310" fill="#f5b942" opacity="0.75"/>
      <text x="640" y="410" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="700" font-size="28">${safeText}</text>
      <text x="640" y="445" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="18">Movies Hub • Artwork Not Available</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#151c2c"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#pg)"/>
    <rect x="24" y="24" width="352" height="552" rx="18" fill="none" stroke="#334155" stroke-dasharray="6 6" stroke-width="2"/>
    <circle cx="200" cy="245" r="42" fill="#1e293b" stroke="#f5b942" stroke-width="2"/>
    <polygon points="190,226 190,264 222,245" fill="#f5b942"/>
    <text x="200" y="330" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-weight="700" font-size="18">${safeText}</text>
    <text x="200" y="358" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="13">Poster Not Available</text>
    <text x="200" y="540" text-anchor="middle" fill="#f5b942" font-family="sans-serif" font-weight="700" font-size="12" letter-spacing="2">MOVIES HUB</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const resolveImage = (
  path,
  size = 'w500',
  fallbackLabel = 'Movies Hub',
  variant = 'poster',
) => {
  if (!path) return createFallbackSvg(fallbackLabel, variant);
  if (
    String(path).startsWith('http://') ||
    String(path).startsWith('https://') ||
    String(path).startsWith('data:')
  ) {
    return path;
  }
  return `${TMDB.IMG}/${size}${path}`;
};
