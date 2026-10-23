import { TMDB } from '../config/constants';

export const USD_TO_INR_RATE = 83.5;

export const detectDefaultRegion = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    if (
      tz.includes('Kolkata') ||
      tz.includes('Calcutta') ||
      tz.includes('Asia/Colombo') ||
      /-IN$/i.test(lang) ||
      /^hi|^te|^ta|^ml|^kn|^mr|^bn|^gu|^pa/i.test(lang)
    ) {
      return 'IN';
    }
  } catch {
    /* ignore */
  }
  return 'IN';
};

const SLUG_CACHE_KEY = 'movieshub_slug_lookup_v8';
const inMemorySlugMap = new Map();

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

  const entry = {
    id: item.id || item.tmdbId,
    type: item.subType === 'webseries' ? 'tv' : item.type || item.media_type || 'movie',
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

/**
 * Generates clean SEO URLs using ONLY the movie/series name slug (no numeric ID in URL!):
 * e.g. `/detail/movie/mirzapur` or `/detail/movie/pushpa-2-the-rule`
 */
export const getTitlePath = (item = {}, typeOverride = null, hash = '') => {
  if (!item) return '/';
  const rawType =
    typeOverride ||
    (item.isWebSeries || item.subType === 'webseries'
      ? 'webseries'
      : item.type || item.media_type || (item.first_air_date ? 'tv' : 'movie'));
  const routeType = rawType === 'webseries' ? 'webseries' : rawType === 'tv' ? 'tv' : 'movie';
  const slug = item.slug || toSlug(item.title || item.name || item.originalTitle || `${routeType}-${item.id || item.tmdbId || 'title'}`);

  if (item.id || item.tmdbId) {
    registerSlugMapping(slug, { ...item, type: routeType });
  }

  const hashSuffix = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `/detail/${routeType}/${slug}${hashSuffix}`;
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
    region = 'IN',
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
 * Requirement 1: Only returns genuinely disclosed Budget & Box Office numbers.
 * If neither budget nor box office collection is disclosed (`0` or missing),
 * `hasFinancials` is `false` so the Budget & Box Office tab is hidden!
 */
export const getMovieFinancials = (item = {}, region = 'IN') => {
  const bo = item?.boxOffice || {};
  const isBackendEstimated = Boolean(item?.financialEstimated);

  const parsedBudget = isBackendEstimated
    ? { value: 0, currency: 'USD' }
    : parseRawCurrencyValue(item?.budget || bo.budget || bo.budgetFormatted);
  const parsedRevenue = isBackendEstimated
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

  const indiaNetParsed = parseRawCurrencyValue(bo.indiaNetCollection);
  const indiaGrossParsed = parseRawCurrencyValue(bo.indiaGrossCollection);
  const openingWeekendParsed = parseRawCurrencyValue(bo.openingWeekend);
  const openingDayParsed = parseRawCurrencyValue(bo.openingDay);
  const domesticParsed = parseRawCurrencyValue(bo.domesticCollection);
  const intlParsed = parseRawCurrencyValue(bo.internationalCollection);

  const hasBudget = finalBudgetUsd > 0;
  const hasRevenue = finalRevenueUsd > 0;
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
  if (bo.verdict && bo.verdict !== 'TBA' && !isBackendEstimated && hasFinancials) {
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

  const profitUsd = hasBudget && hasRevenue && finalRevenueUsd > finalBudgetUsd ? finalRevenueUsd - finalBudgetUsd : 0;
  const roiPercent =
    hasBudget && hasRevenue
      ? Math.round(((finalRevenueUsd - finalBudgetUsd) / finalBudgetUsd) * 100)
      : null;

  return {
    isEstimated: false,
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
        ? formatBudgetOrBoxOffice(indiaNetParsed.value, { region, sourceCurrency: indiaNetParsed.currency })
        : '',
    indiaGrossText:
      indiaGrossParsed.value > 0
        ? formatBudgetOrBoxOffice(indiaGrossParsed.value, { region, sourceCurrency: indiaGrossParsed.currency })
        : '',
    openingWeekendText:
      openingWeekendParsed.value > 0
        ? formatBudgetOrBoxOffice(openingWeekendParsed.value, { region, sourceCurrency: openingWeekendParsed.currency })
        : '',
    openingDayText:
      openingDayParsed.value > 0
        ? formatBudgetOrBoxOffice(openingDayParsed.value, { region, sourceCurrency: openingDayParsed.currency })
        : '',
    domesticText:
      domesticParsed.value > 0
        ? formatBudgetOrBoxOffice(domesticParsed.value, { region, sourceCurrency: domesticParsed.currency })
        : '',
    internationalText:
      intlParsed.value > 0
        ? formatBudgetOrBoxOffice(intlParsed.value, { region, sourceCurrency: intlParsed.currency })
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

export const resolveImage = (path, size = 'w500', fallbackLabel = 'Movies Hub', variant = 'poster') => {
  if (!path) return createFallbackSvg(fallbackLabel, variant);
  if (String(path).startsWith('http://') || String(path).startsWith('https://') || String(path).startsWith('data:')) {
    return path;
  }
  return `${TMDB.IMG}/${size}${path}`;
};
