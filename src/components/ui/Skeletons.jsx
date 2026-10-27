import React from 'react';

/**
 * ============================================================================
 * MOVIES HUB — STRUCTURAL REFLECTION / SHIMMER SKELETON LOADING LIBRARY
 * File: src/components/ui/Skeletons.jsx
 * ============================================================================
 * Every page (User & Admin) has its own tailored, mobile-responsive structural
 * skeleton with a smooth diagonal light reflection sweep (`.skeleton-shimmer`).
 */

export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      aria-hidden='true'
    />
  );
}

/**
 * 1. Standardized 2:3 Movie / Web Series / TV Show Card Skeleton
 * Supports both horizontal scroll rows (`compact = true` -> `w-36 sm:w-44 shrink-0`)
 * and responsive CSS Grids (`compact = false` -> `w-full`).
 */
export function MovieCardSkeleton({ compact = false }) {
  return (
    <div
      aria-hidden='true'
      className={`skeleton-shimmer-subtle flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] ${
        compact ? 'w-36 shrink-0 sm:w-44' : 'w-full'
      }`}
    >
      <div className='skeleton-shimmer relative aspect-2/3 w-full'>
        <div className='absolute top-2 left-2 h-4 w-12 rounded-md bg-white/10' />
        <div className='absolute top-2 right-2 h-4 w-10 rounded-full bg-white/10' />
      </div>
      <div className='space-y-2 p-2.5 sm:p-3'>
        <div className='skeleton-shimmer h-3.5 w-4/5 rounded-md' />
        <div className='flex items-center justify-between gap-2'>
          <div className='skeleton-shimmer h-2.5 w-10 rounded-md' />
          <div className='skeleton-shimmer h-2.5 w-14 rounded-md' />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Horizontal Carousel Row Skeleton (Matches `MovieRow.jsx`)
 */
export function MovieRowSkeleton({ cards = 7 }) {
  return (
    <section aria-hidden='true' className='mx-auto my-6 max-w-7xl px-4 sm:px-6'>
      <div className='mb-3.5 flex items-end justify-between gap-3'>
        <div className='space-y-2'>
          <div className='skeleton-shimmer h-5 w-48 rounded-lg sm:h-6 sm:w-64' />
          <div className='skeleton-shimmer h-3 w-64 rounded-md sm:w-80' />
        </div>
        <div className='skeleton-shimmer h-7 w-20 shrink-0 rounded-full' />
      </div>
      <div className='no-scrollbar flex gap-3.5 overflow-hidden pb-2 sm:gap-4'>
        {Array.from({ length: cards }).map((_, idx) => (
          <MovieCardSkeleton key={idx} compact />
        ))}
      </div>
    </section>
  );
}

/**
 * 3. Mood Explorer Horizontal Row Skeleton (Used inside `MoodExplorer.jsx`)
 */
export function MoodRowSkeleton({ cards = 6 }) {
  return (
    <div
      aria-hidden='true'
      className='no-scrollbar flex gap-3.5 overflow-hidden pb-2'
    >
      {Array.from({ length: cards }).map((_, idx) => (
        <MovieCardSkeleton key={idx} compact />
      ))}
    </div>
  );
}

/**
 * 4. HOME PAGE STRUCTURAL SKELETON (`Home.jsx`)
 * Mirrors: Hero Carousel -> Taste Strip -> Upcoming Row -> Genre Grid ->
 * Mood Explorer -> Top 10 Leaderboard -> Celebrity Row -> OTT & Industries -> Curated Rows & Blogs
 */
export function HomeSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading home feed' className='pb-12'>
      {/* 1. Hero Carousel Skeleton */}
      <section className='relative aspect-[16/10] max-h-[85vh] min-h-[340px] w-full overflow-hidden bg-[#070a10] sm:aspect-[16/8.5] lg:aspect-[16/7.2] lg:min-h-[580px] xl:min-h-[650px]'>
        <div className='skeleton-shimmer absolute inset-0 h-full w-full opacity-45' />
        <div
          style={{
            background:
              'linear-gradient(to top, rgba(7,10,16,0.96) 0%, rgba(7,10,16,0.55) 35%, rgba(7,10,16,0.15) 100%)',
          }}
          className='pointer-events-none absolute inset-0'
        />
        <div className='relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-end px-5 pb-4 sm:px-12 sm:pb-8 lg:px-20 lg:pb-12 xl:px-28'>
          <div className='max-w-md space-y-2.5 sm:max-w-lg sm:space-y-3.5 lg:max-w-xl'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='skeleton-shimmer h-5 w-28 rounded-full sm:h-6 sm:w-32' />
              <div className='skeleton-shimmer h-5 w-14 rounded-full sm:h-6' />
              <div className='skeleton-shimmer h-5 w-14 rounded-full sm:h-6' />
              <div className='skeleton-shimmer hidden h-6 w-32 rounded-full sm:block' />
            </div>
            <div className='skeleton-shimmer h-8 w-4/5 rounded-xl sm:h-11 lg:h-13' />
            <div className='skeleton-shimmer hidden h-3.5 w-2/5 rounded-md sm:block' />
            <div className='space-y-1.5'>
              <div className='skeleton-shimmer h-3 w-full rounded-md sm:h-3.5' />
              <div className='skeleton-shimmer h-3 w-4/5 rounded-md sm:h-3.5' />
            </div>
            <div className='flex items-center gap-3 pt-1.5 sm:pt-2'>
              <div className='skeleton-shimmer h-8 w-32 rounded-full sm:h-10 sm:w-44' />
              <div className='skeleton-shimmer h-8 w-28 rounded-full sm:h-10 sm:w-36' />
            </div>
          </div>

          <div className='mt-4 flex w-full items-center justify-between sm:mt-6'>
            <div className='flex items-center gap-1.5'>
              <div className='skeleton-shimmer h-1.5 w-7 rounded-full' />
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className='skeleton-shimmer h-1.5 w-2 rounded-full'
                />
              ))}
            </div>
            <div className='flex items-center gap-2'>
              <div className='skeleton-shimmer h-8 w-8 rounded-full sm:h-9 sm:w-9' />
              <div className='skeleton-shimmer h-8 w-8 rounded-full sm:h-9 sm:w-9' />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personalized Taste Strip Skeleton */}
      <section className='mx-auto mt-5 max-w-7xl px-4 sm:px-6'>
        <div className='skeleton-shimmer-subtle flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 sm:flex-row sm:items-center sm:p-4'>
          <div className='flex items-center gap-3'>
            <div className='skeleton-shimmer h-10 w-10 shrink-0 rounded-xl' />
            <div className='space-y-1.5'>
              <div className='skeleton-shimmer h-4 w-52 rounded-md sm:w-64' />
              <div className='skeleton-shimmer h-3 w-64 rounded-md sm:w-80' />
            </div>
          </div>
          <div className='skeleton-shimmer h-9 w-36 rounded-xl' />
        </div>
      </section>

      {/* 3. Upcoming Releases Row Skeleton */}
      <MovieRowSkeleton cards={7} />

      {/* 4. Browse by Genre Multi-Row Grid Skeleton */}
      <section className='mx-auto my-7 max-w-7xl px-4 sm:px-6'>
        <div className='mb-3.5 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='skeleton-shimmer h-8 w-8 rounded-xl' />
            <div className='space-y-1.5'>
              <div className='skeleton-shimmer h-5 w-40 rounded-lg' />
              <div className='skeleton-shimmer h-3 w-60 rounded-md' />
            </div>
          </div>
          <div className='skeleton-shimmer h-7 w-24 rounded-full' />
        </div>
        <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-6'>
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer-subtle flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0e131f] px-3 py-2.5'
            >
              <div className='skeleton-shimmer h-5 w-5 shrink-0 rounded-md' />
              <div className='skeleton-shimmer h-3.5 w-16 rounded-md' />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Watch by Mood Section Skeleton */}
      <section className='mx-auto my-8 max-w-7xl px-4 sm:px-6'>
        <div className='skeleton-shimmer-subtle rounded-3xl border border-white/10 bg-[#0e131f] p-4 shadow-xl sm:p-6'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2.5'>
              <div className='skeleton-shimmer h-9 w-9 rounded-xl' />
              <div className='space-y-1.5'>
                <div className='skeleton-shimmer h-5 w-48 rounded-lg' />
                <div className='skeleton-shimmer h-3 w-64 rounded-md' />
              </div>
            </div>
            <div className='skeleton-shimmer h-7 w-32 rounded-full' />
          </div>
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className='flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-3'
              >
                <div className='skeleton-shimmer h-7 w-7 shrink-0 rounded-lg' />
                <div className='min-w-0 flex-1 space-y-1.5'>
                  <div className='skeleton-shimmer h-3.5 w-24 rounded-md' />
                  <div className='skeleton-shimmer h-2.5 w-28 rounded-md' />
                </div>
              </div>
            ))}
          </div>
          <div className='mt-5'>
            <MoodRowSkeleton cards={6} />
          </div>
        </div>
      </section>

      {/* 6. Top 10 Today & Week Leaderboard Showcase Skeleton */}
      <section className='mx-auto my-8 max-w-7xl px-4 sm:px-6'>
        <div className='skeleton-shimmer-subtle rounded-3xl border border-white/10 bg-[#0e131f] p-5 shadow-2xl sm:p-7'>
          <div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex items-center gap-3'>
              <div className='skeleton-shimmer h-11 w-11 rounded-2xl' />
              <div className='space-y-1.5'>
                <div className='skeleton-shimmer h-6 w-56 rounded-lg sm:w-72' />
                <div className='skeleton-shimmer h-3 w-64 rounded-md' />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='skeleton-shimmer h-9 w-56 rounded-full' />
              <div className='skeleton-shimmer h-9 w-24 rounded-full' />
            </div>
          </div>
          <div className='no-scrollbar flex gap-5 overflow-hidden pb-2'>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className='flex w-60 shrink-0 items-end gap-2 sm:w-64'
              >
                <div className='skeleton-shimmer h-20 w-10 shrink-0 rounded-lg' />
                <div className='skeleton-shimmer aspect-[2/3] flex-1 rounded-2xl' />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Top Celebrities Row Skeleton */}
      <section className='mx-auto my-6 max-w-7xl px-4 sm:px-6'>
        <div className='mb-3.5 space-y-1.5'>
          <div className='skeleton-shimmer h-5 w-60 rounded-lg' />
          <div className='skeleton-shimmer h-3 w-72 rounded-md' />
        </div>
        <div className='no-scrollbar flex gap-3.5 overflow-hidden pb-2'>
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer-subtle flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] sm:w-44'
            >
              <div className='skeleton-shimmer aspect-[2/3] w-full' />
              <div className='flex flex-col items-center space-y-1.5 p-3'>
                <div className='skeleton-shimmer h-3.5 w-24 rounded-md' />
                <div className='skeleton-shimmer h-4 w-16 rounded-full' />
                <div className='skeleton-shimmer h-2.5 w-28 rounded-md' />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Curated Regional Rows Skeleton */}
      <MovieRowSkeleton cards={7} />
      <MovieRowSkeleton cards={7} />
    </div>
  );
}

/**
 * 5. BROWSE CATALOG GRID SKELETON (`Browse.jsx`)
 * Renders the 2/3/4/5/6-column responsive MovieCard grid + pagination bar.
 */
export function BrowseGridSkeleton({ count = 18 }) {
  return (
    <div aria-busy='true' aria-label='Loading catalog results'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
        {Array.from({ length: count }).map((_, idx) => (
          <MovieCardSkeleton key={idx} />
        ))}
      </div>
      <div className='mt-10 flex items-center justify-center gap-3'>
        <div className='skeleton-shimmer h-9 w-24 rounded-full' />
        <div className='skeleton-shimmer h-8 w-28 rounded-full' />
        <div className='skeleton-shimmer h-9 w-24 rounded-full' />
      </div>
    </div>
  );
}

/**
 * 6. OTT HUB GRID SKELETON (`OttHub.jsx`)
 * Renders the 2/3/4/6-column responsive MovieCard grid for OTT streaming catalog.
 */
export function OttGridSkeleton({ count = 12 }) {
  return (
    <div aria-busy='true' aria-label='Loading OTT streaming titles'>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {Array.from({ length: count }).map((_, idx) => (
          <MovieCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

/**
 * 7. MOVIE / WEB SERIES / TV SHOW DETAILS PAGE SKELETON (`Details.jsx`)
 * Mirrors: Full Hero Banner (Poster + Badges + Title + Genre Pills + Trailer/BoxOffice/Watchlist CTAs) ->
 * Sticky Hash Tab Bar -> 3-Col Overview & Where-to-Watch Grid + Right Credits Sidebar -> Cast Carousel
 */
export function DetailsSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading title details' className='pb-10'>
      {/* Hero Banner Skeleton */}
      <div className='relative min-h-[48vh] w-full overflow-hidden bg-[#070a10]'>
        <div className='skeleton-shimmer absolute inset-0 opacity-30' />
        <div
          style={{
            background:
              'linear-gradient(to top, rgba(7,10,16,0.98) 0%, rgba(7,10,16,0.82) 55%, rgba(7,10,16,0.45) 100%)',
          }}
          className='absolute inset-0'
        />
        <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-5 pb-8 sm:gap-7 sm:px-6 md:flex-row md:items-end'>
          {/* Poster Skeleton */}
          <div className='skeleton-shimmer aspect-[2/3] w-36 shrink-0 self-center rounded-2xl border border-white/15 shadow-2xl sm:w-52 md:self-end' />

          {/* Info Column Skeleton */}
          <div className='flex-1 space-y-3.5 text-center md:text-left'>
            <div className='flex items-center justify-between gap-2'>
              <div className='skeleton-shimmer h-7 w-20 rounded-full' />
              <div className='flex gap-2'>
                <div className='skeleton-shimmer h-7 w-28 rounded-full' />
              </div>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2 md:justify-start'>
              <div className='skeleton-shimmer h-5 w-14 rounded-full' />
              <div className='skeleton-shimmer h-5 w-24 rounded-full' />
              <div className='skeleton-shimmer h-5 w-14 rounded-full' />
              <div className='skeleton-shimmer h-5 w-16 rounded-full' />
              <div className='skeleton-shimmer h-5 w-24 rounded-full' />
            </div>

            <div className='skeleton-shimmer mx-auto h-9 w-3/4 rounded-xl sm:h-12 md:mx-0' />
            <div className='skeleton-shimmer mx-auto h-4 w-2/5 rounded-md md:mx-0' />

            <div className='flex flex-wrap justify-center gap-1.5 md:justify-start'>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className='skeleton-shimmer h-6 w-20 rounded-full'
                />
              ))}
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2.5 pt-2 md:justify-start'>
              <div className='skeleton-shimmer h-10 w-44 rounded-full' />
              <div className='skeleton-shimmer h-10 w-48 rounded-full' />
              <div className='skeleton-shimmer h-10 w-48 rounded-2xl' />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Tab Bar Skeleton */}
      <div className='border-b border-white/10 bg-[#070a10]/95'>
        <div className='no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-hidden px-3 py-3 sm:px-6'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer h-7 w-32 shrink-0 rounded-full'
            />
          ))}
        </div>
      </div>

      {/* Overview Content Grid + Credits Sidebar Skeleton */}
      <div className='mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8'>
        <div className='grid gap-6 md:grid-cols-3'>
          <div className='space-y-6 md:col-span-2'>
            {/* Synopsis Block */}
            <div className='space-y-2.5'>
              <div className='skeleton-shimmer h-6 w-48 rounded-lg' />
              <div className='skeleton-shimmer h-3.5 w-full rounded-md' />
              <div className='skeleton-shimmer h-3.5 w-11/12 rounded-md' />
              <div className='skeleton-shimmer h-3.5 w-4/5 rounded-md' />
            </div>

            {/* Where to Watch Card Skeleton */}
            <div className='skeleton-shimmer-subtle space-y-4 rounded-2xl border border-white/10 bg-[#0e131f] p-5'>
              <div className='flex items-center justify-between gap-2'>
                <div className='space-y-1.5'>
                  <div className='skeleton-shimmer h-5 w-52 rounded-lg' />
                  <div className='skeleton-shimmer h-3 w-64 rounded-md' />
                </div>
                <div className='skeleton-shimmer h-7 w-32 rounded-full' />
              </div>
              <div className='flex flex-wrap gap-2.5 pt-1'>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className='skeleton-shimmer h-10 w-32 rounded-xl'
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Credits Card Skeleton */}
          <div className='skeleton-shimmer-subtle space-y-3.5 rounded-2xl border border-white/10 bg-[#0e131f] p-5'>
            <div className='skeleton-shimmer h-5 w-44 rounded-lg' />
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between gap-2 border-b border-white/5 pb-2.5'
              >
                <div className='skeleton-shimmer h-3 w-24 rounded-md' />
                <div className='skeleton-shimmer h-3.5 w-28 rounded-md' />
              </div>
            ))}
          </div>
        </div>

        {/* Cast & Crew Carousel Skeleton */}
        <div className='space-y-3.5'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1.5'>
              <div className='skeleton-shimmer h-6 w-48 rounded-lg' />
              <div className='skeleton-shimmer h-3 w-64 rounded-md' />
            </div>
            <div className='flex gap-2'>
              <div className='skeleton-shimmer h-8 w-20 rounded-full' />
              <div className='skeleton-shimmer h-8 w-20 rounded-full' />
              <div className='skeleton-shimmer h-8 w-20 rounded-full' />
            </div>
          </div>
          <div className='no-scrollbar flex gap-3.5 overflow-hidden pb-2 sm:gap-4'>
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer-subtle flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] sm:w-44'
              >
                <div className='skeleton-shimmer aspect-[2/3] w-full' />
                <div className='space-y-1.5 p-2.5'>
                  <div className='skeleton-shimmer mx-auto h-3.5 w-24 rounded-md' />
                  <div className='skeleton-shimmer mx-auto h-2.5 w-20 rounded-md' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 8. SEASON EPISODES GUIDE SKELETON (`Details.jsx` -> `#seasons` tab)
 */
export function SeasonEpisodesSkeleton({ count = 6 }) {
  return (
    <div
      aria-busy='true'
      aria-label='Loading season episodes'
      className='grid gap-3.5 sm:grid-cols-2'
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='skeleton-shimmer-subtle flex gap-3.5 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5'
        >
          <div className='skeleton-shimmer h-24 w-36 shrink-0 rounded-xl' />
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='skeleton-shimmer h-4 w-3/4 rounded-md' />
              <div className='skeleton-shimmer h-4 w-10 shrink-0 rounded-md' />
            </div>
            <div className='flex gap-2'>
              <div className='skeleton-shimmer h-3 w-12 rounded-md' />
              <div className='skeleton-shimmer h-3 w-20 rounded-md' />
            </div>
            <div className='space-y-1.5 pt-0.5'>
              <div className='skeleton-shimmer h-2.5 w-full rounded-md' />
              <div className='skeleton-shimmer h-2.5 w-4/5 rounded-md' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 9. REVIEWS & COMMENTS SKELETON (`Reviews.jsx`)
 */
export function ReviewsSkeleton({ count = 3 }) {
  return (
    <div
      aria-busy='true'
      aria-label='Loading reviews and comments'
      className='space-y-3.5'
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='skeleton-shimmer-subtle space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 sm:p-5'
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5'>
              <div className='skeleton-shimmer h-9 w-9 shrink-0 rounded-full' />
              <div className='space-y-1.5'>
                <div className='skeleton-shimmer h-3.5 w-32 rounded-md' />
                <div className='skeleton-shimmer h-2.5 w-24 rounded-md' />
              </div>
            </div>
            <div className='skeleton-shimmer h-6 w-16 rounded-full' />
          </div>
          <div className='skeleton-shimmer h-4 w-2/5 rounded-md' />
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-3 w-full rounded-md' />
            <div className='skeleton-shimmer h-3 w-5/6 rounded-md' />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 10. ACTOR / ACTORESS PROFILE PAGE SKELETON (`Person.jsx`)
 * Mirrors: Back Button -> Portrait & Biography Hero Card -> Filter Tabs -> 6-Col Filmography Grid
 */
export function PersonSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading artist profile'
      className='mx-auto max-w-7xl px-4 py-8 sm:px-6'
    >
      <div className='skeleton-shimmer mb-6 h-8 w-24 rounded-full' />

      {/* Actor / Actoress Hero Card Skeleton */}
      <div className='skeleton-shimmer-subtle mb-8 flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:flex-row sm:items-start sm:p-8'>
        <div className='skeleton-shimmer aspect-[2/3] w-40 shrink-0 rounded-2xl sm:w-48' />
        <div className='w-full flex-1 space-y-3 text-center sm:text-left'>
          <div className='skeleton-shimmer mx-auto h-6 w-24 rounded-full sm:mx-0' />
          <div className='skeleton-shimmer mx-auto h-8 w-64 rounded-xl sm:mx-0 sm:h-10 sm:w-80' />
          <div className='flex flex-wrap items-center justify-center gap-4 pt-1 sm:justify-start'>
            <div className='skeleton-shimmer h-4 w-32 rounded-md' />
            <div className='skeleton-shimmer h-4 w-36 rounded-md' />
            <div className='skeleton-shimmer h-4 w-40 rounded-md' />
          </div>
          <div className='space-y-2 pt-3'>
            <div className='skeleton-shimmer h-3 w-full max-w-3xl rounded-md' />
            <div className='skeleton-shimmer h-3 w-11/12 max-w-3xl rounded-md' />
            <div className='skeleton-shimmer h-3 w-4/5 max-w-3xl rounded-md' />
            <div className='skeleton-shimmer h-3 w-2/3 max-w-3xl rounded-md' />
          </div>
        </div>
      </div>

      {/* Filter Tabs + Filmography Grid Skeleton */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div className='skeleton-shimmer h-7 w-56 rounded-lg' />
        <div className='flex flex-wrap gap-2'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className='skeleton-shimmer h-8 w-28 rounded-full' />
          ))}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
        {Array.from({ length: 12 }).map((_, idx) => (
          <MovieCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

/**
 * 11. EDITORIAL BLOGS LISTING SKELETON (`Blogs.jsx`)
 * Mirrors: 12-Col Featured Spotlight Article Card + 3-Col Remaining Articles Grid
 */
export function BlogsSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading editorial blogs'
      className='space-y-8'
    >
      {/* Featured Top Article Banner Skeleton */}
      <div className='skeleton-shimmer-subtle grid overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] shadow-2xl lg:grid-cols-12'>
        <div className='skeleton-shimmer aspect-video w-full lg:col-span-7 lg:aspect-auto lg:min-h-[340px]' />
        <div className='flex flex-col justify-between p-6 sm:p-8 lg:col-span-5'>
          <div className='space-y-3.5'>
            <div className='skeleton-shimmer h-6 w-48 rounded-lg' />
            <div className='skeleton-shimmer h-8 w-full rounded-xl sm:h-9' />
            <div className='skeleton-shimmer h-7 w-3/4 rounded-xl' />
            <div className='skeleton-shimmer h-4 w-2/3 rounded-md' />
            <div className='space-y-2 pt-1'>
              <div className='skeleton-shimmer h-3 w-full rounded-md' />
              <div className='skeleton-shimmer h-3 w-11/12 rounded-md' />
              <div className='skeleton-shimmer h-3 w-4/5 rounded-md' />
            </div>
          </div>
          <div className='mt-6 flex items-center justify-between border-t border-white/10 pt-4'>
            <div className='skeleton-shimmer h-3.5 w-40 rounded-md' />
            <div className='flex gap-3'>
              <div className='skeleton-shimmer h-3.5 w-10 rounded-md' />
              <div className='skeleton-shimmer h-3.5 w-10 rounded-md' />
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Blog Cards Grid Skeleton */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className='skeleton-shimmer-subtle flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0e131f]'
          >
            <div className='skeleton-shimmer aspect-video w-full' />
            <div className='flex flex-1 flex-col justify-between space-y-4 p-5'>
              <div className='space-y-2.5'>
                <div className='skeleton-shimmer h-5 w-11/12 rounded-lg' />
                <div className='skeleton-shimmer h-5 w-3/4 rounded-lg' />
                <div className='space-y-1.5 pt-1'>
                  <div className='skeleton-shimmer h-3 w-full rounded-md' />
                  <div className='skeleton-shimmer h-3 w-5/6 rounded-md' />
                  <div className='skeleton-shimmer h-3 w-2/3 rounded-md' />
                </div>
              </div>
              <div className='flex items-center justify-between border-t border-white/10 pt-3'>
                <div className='skeleton-shimmer h-3 w-24 rounded-md' />
                <div className='flex gap-2'>
                  <div className='skeleton-shimmer h-3 w-8 rounded-md' />
                  <div className='skeleton-shimmer h-3 w-8 rounded-md' />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 12. BLOG ARTICLE READER PAGE SKELETON (`BlogDetail.jsx`)
 * Mirrors: Full Hero Cover Image + Headline/Author Overlay -> 8-Col Rich Article Body & Stills -> 4-Col Linked Movie Spotlight Sidebar
 */
export function BlogDetailSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading blog article' className='pb-16'>
      {/* Hero Cover Skeleton */}
      <div className='relative h-[52vh] min-h-[360px] w-full overflow-hidden bg-[#070a10]'>
        <div className='skeleton-shimmer h-full w-full opacity-35' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#070a10] via-[#070a10]/65 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 mx-auto max-w-4xl space-y-3 px-4 pb-8 sm:px-6'>
          <div className='flex items-center justify-between'>
            <div className='skeleton-shimmer h-7 w-24 rounded-full' />
            <div className='skeleton-shimmer h-7 w-36 rounded-full' />
          </div>
          <div className='skeleton-shimmer h-5 w-24 rounded-full' />
          <div className='skeleton-shimmer h-9 w-11/12 rounded-xl sm:h-12' />
          <div className='skeleton-shimmer h-8 w-3/4 rounded-xl' />
          <div className='skeleton-shimmer h-4 w-2/3 rounded-md' />
          <div className='flex flex-wrap gap-4 pt-2'>
            <div className='skeleton-shimmer h-3.5 w-28 rounded-md' />
            <div className='skeleton-shimmer h-3.5 w-24 rounded-md' />
            <div className='skeleton-shimmer h-3.5 w-20 rounded-md' />
          </div>
        </div>
      </div>

      {/* Main Content + Linked Movie Sidebar */}
      <div className='mx-auto mt-8 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12'>
        <div className='space-y-6 lg:col-span-8'>
          <div className='space-y-3'>
            <div className='skeleton-shimmer h-4 w-full rounded-md' />
            <div className='skeleton-shimmer h-4 w-11/12 rounded-md' />
            <div className='skeleton-shimmer h-4 w-full rounded-md' />
            <div className='skeleton-shimmer h-4 w-4/5 rounded-md' />
          </div>
          <div className='skeleton-shimmer h-20 w-full rounded-2xl' />
          <div className='space-y-3'>
            <div className='skeleton-shimmer h-6 w-64 rounded-lg' />
            <div className='skeleton-shimmer h-4 w-full rounded-md' />
            <div className='skeleton-shimmer h-4 w-5/6 rounded-md' />
            <div className='skeleton-shimmer h-4 w-11/12 rounded-md' />
          </div>
          <div className='grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer aspect-video w-full rounded-2xl'
              />
            ))}
          </div>
        </div>

        <aside className='space-y-6 lg:col-span-4'>
          <div className='skeleton-shimmer-subtle space-y-4 rounded-3xl border border-white/10 bg-[#0e131f] p-5'>
            <div className='skeleton-shimmer h-3.5 w-48 rounded-md' />
            <div className='flex gap-4'>
              <div className='skeleton-shimmer h-36 w-24 shrink-0 rounded-xl' />
              <div className='flex flex-1 flex-col justify-between'>
                <div className='space-y-2'>
                  <div className='skeleton-shimmer h-5 w-full rounded-md' />
                  <div className='skeleton-shimmer h-3.5 w-16 rounded-md' />
                  <div className='skeleton-shimmer h-5 w-14 rounded-full' />
                </div>
                <div className='skeleton-shimmer h-8 w-full rounded-xl' />
              </div>
            </div>
          </div>

          <div className='skeleton-shimmer-subtle space-y-3 rounded-3xl border border-white/10 bg-[#0e131f] p-5'>
            <div className='skeleton-shimmer h-4 w-36 rounded-md' />
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className='flex gap-3 py-1'>
                <div className='skeleton-shimmer h-16 w-24 shrink-0 rounded-xl' />
                <div className='flex-1 space-y-2'>
                  <div className='skeleton-shimmer h-3.5 w-full rounded-md' />
                  <div className='skeleton-shimmer h-3.5 w-3/4 rounded-md' />
                  <div className='skeleton-shimmer h-2.5 w-16 rounded-md' />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * 13. COMMUNITY LOUNGES & CHAT SKELETONS (`Community.jsx`)
 */
export function CommunityRoomsListSkeleton({ count = 6 }) {
  return (
    <div
      aria-busy='true'
      aria-label='Loading chat rooms'
      className='space-y-2 p-1'
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='flex w-full items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 sm:gap-3 sm:p-3'
        >
          <div className='skeleton-shimmer h-10 w-10 shrink-0 rounded-2xl' />
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='skeleton-shimmer h-3.5 w-32 rounded-md' />
              <div className='skeleton-shimmer h-2.5 w-12 shrink-0 rounded-md' />
            </div>
            <div className='skeleton-shimmer h-2.5 w-4/5 rounded-md' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommunityMessagesSkeleton({ count = 5 }) {
  return (
    <div
      aria-busy='true'
      aria-label='Loading chat messages'
      className='space-y-3.5 py-2'
    >
      {Array.from({ length: count }).map((_, idx) => {
        const alignRight = idx % 2 === 1;
        return (
          <div
            key={idx}
            className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`skeleton-shimmer-subtle w-64 max-w-[82%] space-y-2 rounded-2xl border border-white/10 p-3 sm:w-80`}
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='skeleton-shimmer h-3 w-20 rounded-md' />
                <div className='skeleton-shimmer h-2.5 w-12 rounded-md' />
              </div>
              <div className='skeleton-shimmer h-3 w-full rounded-md' />
              <div className='skeleton-shimmer h-3 w-3/4 rounded-md' />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CommunityChatPaneSkeleton() {
  return (
    <div aria-busy='true' className='flex h-full flex-col justify-between'>
      <div className='flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-5'>
        <div className='flex items-center gap-3'>
          <div className='skeleton-shimmer h-9 w-9 rounded-2xl' />
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-4 w-40 rounded-md' />
            <div className='skeleton-shimmer h-2.5 w-56 rounded-md' />
          </div>
        </div>
        <div className='skeleton-shimmer h-6 w-16 rounded-full' />
      </div>
      <div className='flex-1 overflow-hidden p-4 sm:p-5'>
        <CommunityMessagesSkeleton count={5} />
      </div>
      <div className='border-t border-white/10 p-3'>
        <div className='flex items-center gap-2'>
          <div className='skeleton-shimmer h-9 w-9 shrink-0 rounded-full' />
          <div className='skeleton-shimmer h-9 flex-1 rounded-full' />
          <div className='skeleton-shimmer h-9 w-16 shrink-0 rounded-full' />
        </div>
      </div>
    </div>
  );
}

/**
 * 14. PROFILE & WATCHLIST SKELETONS (`Profile.jsx` & `ProtectedRoute.jsx`)
 */
export function WatchlistGridSkeleton({ count = 10 }) {
  return (
    <div
      aria-busy='true'
      className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5'
    >
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function ProfileReviewsSkeleton({ count = 4 }) {
  return (
    <div aria-busy='true' className='space-y-3'>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='skeleton-shimmer-subtle flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4'
        >
          <div className='flex-1 space-y-2 pr-4'>
            <div className='skeleton-shimmer h-4 w-48 rounded-md' />
            <div className='skeleton-shimmer h-3 w-3/4 rounded-md' />
          </div>
          <div className='skeleton-shimmer h-7 w-16 shrink-0 rounded-full' />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div
      aria-busy='true'
      className='mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6'
    >
      <div className='skeleton-shimmer-subtle flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-4'>
          <div className='skeleton-shimmer h-16 w-16 shrink-0 rounded-2xl' />
          <div className='space-y-2'>
            <div className='skeleton-shimmer h-6 w-40 rounded-lg' />
            <div className='skeleton-shimmer h-3.5 w-48 rounded-md' />
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <div className='skeleton-shimmer h-9 w-36 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-28 rounded-xl' />
        </div>
      </div>

      <div className='flex flex-wrap gap-2 border-b border-white/10 pb-3'>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className='skeleton-shimmer h-9 w-36 rounded-full' />
        ))}
      </div>

      <div className='skeleton-shimmer-subtle space-y-4 rounded-3xl border border-white/10 bg-[#0e131f] p-6'>
        <div className='skeleton-shimmer h-5 w-52 rounded-md' />
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='skeleton-shimmer h-10 w-full rounded-xl' />
          <div className='skeleton-shimmer h-10 w-full rounded-xl' />
        </div>
        <div className='flex flex-wrap gap-2 pt-2'>
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className='skeleton-shimmer h-7 w-20 rounded-full' />
          ))}
        </div>
        <div className='skeleton-shimmer h-10 w-44 rounded-full' />
      </div>
    </div>
  );
}

/**
 * 15. DYNAMIC SITEMAP PAGE SKELETON (`Sitemap.jsx`)
 */
export function SitemapSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading dynamic sitemap'
      className='mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'
    >
      <div className='skeleton-shimmer-subtle rounded-3xl border border-white/15 bg-[#0e131f] p-5 shadow-xl sm:p-7'>
        <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
          <div className='space-y-2.5'>
            <div className='skeleton-shimmer h-6 w-52 rounded-full' />
            <div className='skeleton-shimmer h-8 w-72 rounded-xl sm:h-9 sm:w-96' />
            <div className='skeleton-shimmer h-3.5 w-full max-w-xl rounded-md' />
          </div>
          <div className='flex flex-wrap gap-2'>
            <div className='skeleton-shimmer h-9 w-32 rounded-full' />
            <div className='skeleton-shimmer h-9 w-40 rounded-full' />
            <div className='skeleton-shimmer h-9 w-28 rounded-full' />
          </div>
        </div>

        <div className='mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className='rounded-2xl border border-white/10 bg-[#070a10]/60 p-3 space-y-2'
            >
              <div className='skeleton-shimmer h-3 w-24 rounded-md' />
              <div className='skeleton-shimmer h-6 w-16 rounded-md' />
            </div>
          ))}
        </div>

        <div className='mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center'>
          <div className='flex gap-2'>
            <div className='skeleton-shimmer h-9 w-48 rounded-xl' />
            <div className='skeleton-shimmer h-9 w-48 rounded-xl' />
          </div>
          <div className='skeleton-shimmer h-9 w-full rounded-xl sm:w-64' />
        </div>
      </div>

      <div className='skeleton-shimmer-subtle space-y-4 rounded-3xl border border-white/15 bg-[#0e131f] p-5'>
        <div className='skeleton-shimmer h-5 w-64 rounded-lg' />
        <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer h-11 w-full rounded-xl'
            />
          ))}
        </div>
      </div>

      <div className='skeleton-shimmer-subtle space-y-4 rounded-3xl border border-white/15 bg-[#0e131f] p-5'>
        <div className='skeleton-shimmer h-5 w-72 rounded-lg' />
        <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer h-14 w-full rounded-xl'
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * ADMIN STUDIO SECTION-SPECIFIC STRUCTURAL SKELETONS (`Admin.jsx`)
 * ============================================================================
 */

export function AdminTableSkeleton({
  rows = 6,
  cols = 6,
  hasThumbnail = true,
}) {
  return (
    <div aria-busy='true' className='admin-table-wrap'>
      <table className='admin-table'>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <th key={cIdx}>
                <div className='skeleton-shimmer h-3 w-20 rounded-md' />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              <td>
                <div className='flex items-center gap-2.5'>
                  {hasThumbnail && (
                    <div className='skeleton-shimmer h-11 w-8 shrink-0 rounded-md' />
                  )}
                  <div className='space-y-1.5'>
                    <div className='skeleton-shimmer h-3.5 w-36 rounded-md' />
                    <div className='skeleton-shimmer h-2.5 w-20 rounded-md' />
                  </div>
                </div>
              </td>
              {Array.from({ length: Math.max(1, cols - 2) }).map((__, mIdx) => (
                <td key={mIdx}>
                  <div className='skeleton-shimmer h-4 w-20 rounded-md' />
                </td>
              ))}
              <td className='text-right'>
                <div className='flex items-center justify-end gap-1.5'>
                  <div className='skeleton-shimmer h-8 w-16 rounded-lg' />
                  <div className='skeleton-shimmer h-8 w-16 rounded-lg' />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 16A. Admin Overview Section Skeleton (`OverviewSection.jsx`)
 */
export function AdminOverviewSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading admin overview'
      className='space-y-6'
    >
      {/* 8 KPI Cards Grid */}
      <div className='grid grid-cols-2 gap-3.5 sm:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className='skeleton-shimmer-subtle flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4 shadow-lg'
          >
            <div className='flex items-center justify-between'>
              <div className='skeleton-shimmer h-9 w-9 rounded-xl' />
              <div className='skeleton-shimmer h-4 w-4 rounded-md' />
            </div>
            <div className='mt-3 space-y-1.5'>
              <div className='skeleton-shimmer h-3 w-24 rounded-md' />
              <div className='skeleton-shimmer h-7 w-20 rounded-lg' />
              <div className='skeleton-shimmer h-2.5 w-32 rounded-md' />
            </div>
          </div>
        ))}
      </div>

      {/* 1-Lakh Crawler Progress Banner Skeleton */}
      <div className='skeleton-shimmer-subtle space-y-3.5 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='skeleton-shimmer h-10 w-10 rounded-xl' />
            <div className='space-y-1.5'>
              <div className='skeleton-shimmer h-4 w-64 rounded-md' />
              <div className='skeleton-shimmer h-3 w-48 rounded-md' />
            </div>
          </div>
          <div className='skeleton-shimmer h-9 w-40 rounded-xl' />
        </div>
        <div className='skeleton-shimmer h-2.5 w-full rounded-full' />
      </div>

      {/* Two Compact Overview Tables */}
      <div className='grid gap-5 lg:grid-cols-2'>
        <div className='space-y-2.5'>
          <div className='flex items-center justify-between'>
            <div className='skeleton-shimmer h-4 w-48 rounded-md' />
            <div className='skeleton-shimmer h-3.5 w-28 rounded-md' />
          </div>
          <AdminTableSkeleton rows={5} cols={4} hasThumbnail />
        </div>
        <div className='space-y-2.5'>
          <div className='flex items-center justify-between'>
            <div className='skeleton-shimmer h-4 w-48 rounded-md' />
            <div className='skeleton-shimmer h-3.5 w-28 rounded-md' />
          </div>
          <AdminTableSkeleton rows={5} cols={4} hasThumbnail={false} />
        </div>
      </div>
    </div>
  );
}

/**
 * 16B. Admin Featured Hero Carousel Section Skeleton (`FeaturedSection.jsx`)
 */
export function AdminFeaturedSkeleton() {
  return (
    <div aria-busy='true' className='space-y-6'>
      <div className='skeleton-shimmer-subtle space-y-4 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-5 w-64 rounded-lg' />
            <div className='skeleton-shimmer h-3 w-80 rounded-md' />
          </div>
          <div className='skeleton-shimmer h-7 w-48 rounded-xl' />
        </div>
        <div className='skeleton-shimmer h-16 w-full rounded-xl' />
        <div className='flex gap-2'>
          <div className='skeleton-shimmer h-9 flex-1 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-36 rounded-xl' />
        </div>
        <div className='grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-4'>
          <div className='skeleton-shimmer h-9 w-full rounded-xl' />
          <div className='skeleton-shimmer h-9 w-full rounded-xl' />
          <div className='skeleton-shimmer h-9 w-full rounded-xl' />
          <div className='skeleton-shimmer h-9 w-full rounded-xl' />
        </div>
      </div>
      <AdminTableSkeleton rows={6} cols={7} hasThumbnail />
    </div>
  );
}

/**
 * 16C. Admin Blog Studio Section Skeleton (`BlogStudioSection.jsx`)
 */
export function AdminBlogsSkeleton() {
  return (
    <div aria-busy='true' className='space-y-6'>
      <div className='skeleton-shimmer-subtle space-y-4 rounded-2xl border border-white/15 bg-[#0e131f] p-5 shadow-xl'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4'>
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-5 w-64 rounded-lg' />
            <div className='skeleton-shimmer h-3 w-80 rounded-md' />
          </div>
          <div className='flex gap-2'>
            <div className='skeleton-shimmer h-8 w-20 rounded-xl' />
            <div className='skeleton-shimmer h-8 w-24 rounded-xl' />
            <div className='skeleton-shimmer h-8 w-20 rounded-xl' />
          </div>
        </div>
        <div className='skeleton-shimmer h-20 w-full rounded-2xl' />
        <div className='grid gap-4 sm:grid-cols-3'>
          <div className='skeleton-shimmer h-10 sm:col-span-2 rounded-xl' />
          <div className='skeleton-shimmer h-10 rounded-xl' />
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <div className='skeleton-shimmer h-56 w-full rounded-2xl' />
          <div className='skeleton-shimmer h-56 w-full rounded-2xl' />
        </div>
      </div>
      <AdminTableSkeleton rows={5} cols={7} hasThumbnail />
    </div>
  );
}

/**
 * 16D. Admin Community Rooms Section Skeleton (`CommunitySection.jsx`)
 */
export function AdminCommunitySkeleton() {
  return (
    <div aria-busy='true' className='space-y-5'>
      <div className='skeleton-shimmer-subtle space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-4 w-56 rounded-md' />
            <div className='skeleton-shimmer h-3 w-72 rounded-md' />
          </div>
          <div className='skeleton-shimmer h-6 w-28 rounded-lg' />
        </div>
        <div className='grid gap-2.5 sm:grid-cols-12'>
          <div className='skeleton-shimmer h-9 sm:col-span-1 rounded-xl' />
          <div className='skeleton-shimmer h-9 sm:col-span-4 rounded-xl' />
          <div className='skeleton-shimmer h-9 sm:col-span-5 rounded-xl' />
          <div className='skeleton-shimmer h-9 sm:col-span-2 rounded-xl' />
        </div>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='skeleton-shimmer h-10 w-80 rounded-xl' />
        <div className='skeleton-shimmer h-9 w-64 rounded-xl' />
      </div>
      <AdminTableSkeleton rows={6} cols={6} hasThumbnail={false} />
    </div>
  );
}

/**
 * 16E. Admin Reviews & Critics Moderation Skeleton (`ReviewsModerationSection.jsx`)
 */
export function AdminReviewsSkeleton() {
  return (
    <div aria-busy='true' className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='skeleton-shimmer h-10 w-96 max-w-full rounded-xl' />
        <div className='flex gap-2'>
          <div className='skeleton-shimmer h-9 w-56 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-40 rounded-xl' />
        </div>
      </div>
      <AdminTableSkeleton rows={7} cols={6} hasThumbnail />
    </div>
  );
}

/**
 * 16F. Admin Users & Staff Management Skeleton (`UsersSection.jsx`)
 */
export function AdminUsersSkeleton() {
  return (
    <div aria-busy='true' className='space-y-5'>
      <div className='skeleton-shimmer-subtle space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg'>
        <div className='skeleton-shimmer h-4 w-52 rounded-md' />
        <div className='grid gap-2.5 sm:grid-cols-5'>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className='skeleton-shimmer h-9 w-full rounded-xl' />
          ))}
        </div>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='skeleton-shimmer h-10 w-80 max-w-full rounded-xl' />
        <div className='skeleton-shimmer h-9 w-64 rounded-xl' />
      </div>
      <AdminTableSkeleton rows={7} cols={6} hasThumbnail={false} />
    </div>
  );
}

/**
 * 16G. SuperAdmin Catalog & Box Office DB Skeleton (`CatalogSection.jsx`)
 */
export function AdminCatalogSkeleton() {
  return (
    <div aria-busy='true' className='space-y-5'>
      <div className='skeleton-shimmer-subtle flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 shadow-lg'>
        <div className='flex flex-1 flex-wrap items-center gap-2.5'>
          <div className='skeleton-shimmer h-9 min-w-[200px] flex-1 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-40 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-28 rounded-xl' />
        </div>
        <div className='skeleton-shimmer h-9 w-48 rounded-xl' />
      </div>
      <AdminTableSkeleton rows={8} cols={7} hasThumbnail />
    </div>
  );
}

/**
 * 16H. SuperAdmin 1-Lakh Crawler Control Skeleton (`CrawlerSection.jsx`)
 */
export function AdminCrawlerSkeleton() {
  return (
    <div
      aria-busy='true'
      className='skeleton-shimmer-subtle space-y-6 rounded-2xl border border-white/10 bg-[#0e131f] p-6 shadow-xl'
    >
      <div className='flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='skeleton-shimmer h-11 w-11 rounded-2xl' />
          <div className='space-y-1.5'>
            <div className='skeleton-shimmer h-5 w-72 rounded-lg' />
            <div className='skeleton-shimmer h-3.5 w-48 rounded-md' />
          </div>
        </div>
        <div className='flex gap-2'>
          <div className='skeleton-shimmer h-9 w-44 rounded-xl' />
          <div className='skeleton-shimmer h-9 w-36 rounded-xl' />
        </div>
      </div>
      <div className='grid gap-4 sm:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className='space-y-1.5'>
            <div className='skeleton-shimmer h-3 w-28 rounded-md' />
            <div className='skeleton-shimmer h-9 w-full rounded-xl' />
          </div>
        ))}
      </div>
      <div className='flex justify-end'>
        <div className='skeleton-shimmer h-10 w-44 rounded-xl' />
      </div>
    </div>
  );
}

/**
 * 16I. SuperAdmin TMDB API Keys Pool Skeleton (`ApiKeysSection.jsx`)
 */
export function AdminApiKeysSkeleton() {
  return (
    <div aria-busy='true' className='space-y-5'>
      <div className='skeleton-shimmer-subtle grid gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg sm:grid-cols-4'>
        <div className='skeleton-shimmer h-9 w-full rounded-xl' />
        <div className='skeleton-shimmer h-9 w-full rounded-xl sm:col-span-2' />
        <div className='skeleton-shimmer h-9 w-full rounded-xl' />
      </div>
      <AdminTableSkeleton rows={4} cols={6} hasThumbnail={false} />
    </div>
  );
}

/**
 * 16J. Full Admin Studio Shell Skeleton (Used when initializing `/admin/*` session)
 */
export function AdminShellSkeleton() {
  return (
    <div aria-busy='true' className='flex min-h-screen bg-[#070a10]'>
      <aside className='hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0e131f] p-4 lg:flex'>
        <div className='skeleton-shimmer mb-6 h-10 w-44 rounded-xl' />
        <div className='space-y-2'>
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className='skeleton-shimmer h-10 w-full rounded-xl'
            />
          ))}
        </div>
      </aside>
      <div className='flex min-w-0 flex-1 flex-col'>
        <div className='flex h-16 items-center justify-between border-b border-white/10 bg-[#0e131f] px-4 sm:px-6'>
          <div className='skeleton-shimmer h-6 w-48 rounded-lg' />
          <div className='flex gap-2'>
            <div className='skeleton-shimmer h-8 w-24 rounded-full' />
            <div className='skeleton-shimmer h-8 w-8 rounded-full' />
          </div>
        </div>
        <div className='p-4 sm:p-6'>
          <AdminOverviewSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 5B. FULL BROWSE PAGE STRUCTURAL SKELETON (`Browse.jsx` initial page load)
 * Mirrors: Title Header + Search Input + Format Tabs + 7-Dropdown Filter Card + Quick OTT Pills + 18-Card Grid
 */
export function BrowsePageSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading browse catalog page'
      className='mx-auto max-w-7xl px-4 py-8 sm:px-6'
    >
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-2'>
          <div className='skeleton-shimmer h-3.5 w-32 rounded-md' />
          <div className='skeleton-shimmer h-8 w-56 rounded-xl sm:h-9 sm:w-72' />
          <div className='skeleton-shimmer h-3 w-44 rounded-md' />
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <div className='skeleton-shimmer h-9 w-52 rounded-full sm:w-60' />
          <div className='skeleton-shimmer h-9 w-72 rounded-full' />
        </div>
      </div>

      {/* 7-Dropdown Filter Bar Card Skeleton */}
      <div className='skeleton-shimmer-subtle mb-6 rounded-3xl border border-white/10 bg-[#0e131f] p-4 shadow-xl sm:p-5'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7'>
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className='space-y-1.5'>
              <div className='skeleton-shimmer h-2.5 w-20 rounded-md' />
              <div className='skeleton-shimmer h-9 w-full rounded-xl' />
            </div>
          ))}
        </div>
        <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-3'>
          <div className='no-scrollbar flex gap-2 overflow-hidden'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer h-6 w-20 shrink-0 rounded-full'
              />
            ))}
          </div>
          <div className='skeleton-shimmer h-7 w-28 shrink-0 rounded-xl' />
        </div>
      </div>

      <BrowseGridSkeleton count={18} />
    </div>
  );
}

/**
 * 6B. FULL MASTER OTT HUB PAGE STRUCTURAL SKELETON (`OttHub.jsx` initial page load)
 * Mirrors: Master OTT Hero Card + Media Type Pills + 11 OTT Platform Selector Tiles + Genre/Sort Bar + 12-Card Grid
 */
export function OttHubPageSkeleton() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading Master OTT Hub'
      className='mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8'
    >
      <div className='skeleton-shimmer-subtle rounded-3xl border border-white/10 bg-[#0e131f] p-5 shadow-2xl sm:p-8'>
        <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
          <div className='space-y-2.5'>
            <div className='skeleton-shimmer h-6 w-48 rounded-full' />
            <div className='skeleton-shimmer h-8 w-72 rounded-xl sm:h-10 sm:w-96' />
            <div className='skeleton-shimmer h-3.5 w-full max-w-xl rounded-md' />
          </div>
          <div className='flex flex-wrap gap-2'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer h-9 w-28 rounded-full'
              />
            ))}
          </div>
        </div>

        <div className='mt-6'>
          <div className='skeleton-shimmer mb-2.5 h-3 w-36 rounded-md' />
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
            {Array.from({ length: 11 }).map((_, idx) => (
              <div
                key={idx}
                className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3'
              >
                <div className='skeleton-shimmer h-10 w-10 shrink-0 rounded-xl' />
                <div className='min-w-0 flex-1 space-y-1.5'>
                  <div className='skeleton-shimmer h-3.5 w-20 rounded-md' />
                  <div className='skeleton-shimmer h-2.5 w-16 rounded-md' />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4'>
          <div className='flex flex-wrap gap-1.5'>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer h-6 w-16 rounded-full'
              />
            ))}
          </div>
          <div className='flex gap-1.5'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className='skeleton-shimmer h-7 w-20 rounded-full'
              />
            ))}
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='skeleton-shimmer h-6 w-56 rounded-lg' />
          <div className='skeleton-shimmer h-4 w-28 rounded-md' />
        </div>
        <OttGridSkeleton count={12} />
      </div>
    </div>
  );
}
