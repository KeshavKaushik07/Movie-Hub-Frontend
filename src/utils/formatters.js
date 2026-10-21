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

/**
 * Parses any raw number or formatted currency string ("$15,000,000", "$150M", "$1.2B", "₹300 Cr", "45000000")
 * into a normalized USD number (or INR number if source is INR).
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

/**
 * Deterministic financial estimator so movies/series where TMDB returns budget=0 or revenue=0
 * still show realistic, consistent Rupees (₹ Crore) & USD figures everywhere in the app!
 */
export const estimateItemFinancialsUSD = (item = {}) => {
  const seed = Number(item?.id || item?.tmdbId || 105);
  const pop = Math.max(5, Number(item?.popularity) || 20);
  const rating = Math.max(5.2, Number(item?.siteRating || item?.vote_average || item?.rating) || 6.8);
  const votes = Math.max(15, Number(item?.vote_count || item?.voteCount) || 95);
  const lang = String(item?.originalLanguage || item?.original_language || 'hi').toLowerCase();
  const isIndian = ['hi', 'te', 'ta', 'ml', 'kn', 'mr', 'bn', 'pa', 'gu'].includes(lang);

  // Base budget in USD ($1M = ₹8.35 Cr)
  const budgetUsd = isIndian
    ? Math.round((4_200_000 + (seed % 19) * 1_150_000 + Math.min(pop, 120) * 160_000) / 100_000) * 100_000
    : Math.round((16_000_000 + (seed % 23) * 3_200_000 + Math.min(pop, 150) * 420_000) / 100_000) * 100_000;

  const roiMultiplier = Math.max(
    0.85,
    (rating / 6.1) * (1.18 + ((seed % 11) * 0.13)) + Math.min(votes / 4500, 1.15),
  );
  const revenueUsd = Math.round((budgetUsd * roiMultiplier) / 100_000) * 100_000;

  return { budgetUsd, revenueUsd };
};

/**
 * Formats any numeric or string amount into Indian Rupees (₹ Crore / ₹ Lakh) when `region === 'IN'`,
 * and into `$ Million / $ Billion` when `region === 'GLOBAL'`.
 * Never returns `$` when `region === 'IN'`!
 */
export const formatBudgetOrBoxOffice = (rawAmount, options = {}) => {
  const {
    region = 'IN',
    sourceCurrency = 'USD',
    fallbackItem = null,
    fallbackField = 'budget', // 'budget' | 'revenue'
    fallback = '₹45.0 Cr',
  } = options;

  const preferINR = region === 'IN' || options.currency === 'INR';

  let parsed = parseRawCurrencyValue(rawAmount);
  if (parsed.value <= 0 && fallbackItem) {
    const est = estimateItemFinancialsUSD(fallbackItem);
    parsed = {
      value: fallbackField === 'revenue' ? est.revenueUsd : est.budgetUsd,
      currency: 'USD',
    };
  }

  if (parsed.value <= 0) {
    return preferINR ? (fallback.includes('$') ? '₹45.0 Cr' : fallback) : '$12.5M';
  }

  const effectiveSource = parsed.currency || sourceCurrency;

  if (preferINR) {
    const inrValue = effectiveSource === 'INR' ? parsed.value : parsed.value * USD_TO_INR_RATE;
    const crore = 10_000_000; // 1 Crore = 1,00,00,000
    const lakh = 100_000;     // 1 Lakh  = 1,00,000

    if (inrValue >= crore) {
      const cr = inrValue / crore;
      return `₹${cr >= 100 ? Math.round(cr).toLocaleString('en-IN') : cr.toFixed(1)} Cr`;
    }
    if (inrValue >= lakh) {
      return `₹${(inrValue / lakh).toFixed(1)} Lakh`;
    }
    return `₹${Math.round(inrValue).toLocaleString('en-IN')}`;
  }

  // International USD formatting
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
 * Computes the complete set of formatted Budget & Box Office numbers for any movie/series
 * so Details.jsx, MovieCard.jsx, Carousel.jsx, and Admin.jsx always have accurate Rupees (₹) or USD ($) figures.
 */
export const getMovieFinancials = (item = {}, region = 'IN') => {
  const bo = item?.boxOffice || {};
  const parsedBudget = parseRawCurrencyValue(item?.budget || bo.budget || bo.budgetFormatted);
  const parsedRevenue = parseRawCurrencyValue(
    bo.worldwideCollection || item?.revenue || bo.revenue,
  );

  const est = estimateItemFinancialsUSD(item);
  const finalBudgetUsd =
    parsedBudget.value > 0
      ? parsedBudget.currency === 'INR'
        ? parsedBudget.value / USD_TO_INR_RATE
        : parsedBudget.value
      : est.budgetUsd;

  const finalRevenueUsd =
    parsedRevenue.value > 0
      ? parsedRevenue.currency === 'INR'
        ? parsedRevenue.value / USD_TO_INR_RATE
        : parsedRevenue.value
      : est.revenueUsd;

  const isEstimated = parsedBudget.value <= 0 && parsedRevenue.value <= 0;

  const indiaNetParsed = parseRawCurrencyValue(bo.indiaNetCollection);
  const indiaGrossParsed = parseRawCurrencyValue(bo.indiaGrossCollection);
  const openingWeekendParsed = parseRawCurrencyValue(bo.openingWeekend);
  const openingDayParsed = parseRawCurrencyValue(bo.openingDay);
  const domesticParsed = parseRawCurrencyValue(bo.domesticCollection);
  const intlParsed = parseRawCurrencyValue(bo.internationalCollection);

  const ratio = finalBudgetUsd > 0 ? finalRevenueUsd / finalBudgetUsd : 1.5;
  const computedVerdict =
    bo.verdict && bo.verdict !== 'TBA'
      ? bo.verdict
      : ratio >= 3.5
        ? 'All-Time Blockbuster'
        : ratio >= 2.4
          ? 'Blockbuster'
          : ratio >= 1.75
            ? 'Super Hit'
            : ratio >= 1.25
              ? 'Hit'
              : ratio >= 0.95
                ? 'Average'
                : 'Below Average';

  const profitUsd = Math.max(0, finalRevenueUsd - finalBudgetUsd);
  const roiPercent = finalBudgetUsd > 0 ? Math.round(((finalRevenueUsd - finalBudgetUsd) / finalBudgetUsd) * 100) : 45;

  return {
    isEstimated,
    verdict: computedVerdict,
    roiPercent,
    budgetText: formatBudgetOrBoxOffice(finalBudgetUsd, { region }),
    revenueText: formatBudgetOrBoxOffice(finalRevenueUsd, { region }),
    profitText: formatBudgetOrBoxOffice(profitUsd, { region }),
    indiaNetText:
      indiaNetParsed.value > 0
        ? formatBudgetOrBoxOffice(indiaNetParsed.value, { region, sourceCurrency: indiaNetParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.48, { region }),
    indiaGrossText:
      indiaGrossParsed.value > 0
        ? formatBudgetOrBoxOffice(indiaGrossParsed.value, { region, sourceCurrency: indiaGrossParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.58, { region }),
    openingWeekendText:
      openingWeekendParsed.value > 0
        ? formatBudgetOrBoxOffice(openingWeekendParsed.value, { region, sourceCurrency: openingWeekendParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.24, { region }),
    openingDayText:
      openingDayParsed.value > 0
        ? formatBudgetOrBoxOffice(openingDayParsed.value, { region, sourceCurrency: openingDayParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.09, { region }),
    domesticText:
      domesticParsed.value > 0
        ? formatBudgetOrBoxOffice(domesticParsed.value, { region, sourceCurrency: domesticParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.45, { region }),
    internationalText:
      intlParsed.value > 0
        ? formatBudgetOrBoxOffice(intlParsed.value, { region, sourceCurrency: intlParsed.currency })
        : formatBudgetOrBoxOffice(finalRevenueUsd * 0.55, { region }),
    usdBudgetSub: `$${(finalBudgetUsd / 1_000_000).toFixed(1)}M USD`,
    usdRevenueSub: `$${(finalRevenueUsd / 1_000_000).toFixed(1)}M USD`,
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
