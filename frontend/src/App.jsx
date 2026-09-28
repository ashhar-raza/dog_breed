import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:7000/api/breeds';

const FIELDS = [
  { key: 'life',          label: 'Life Span',     unit: 'yrs', emoji: '⏳', type: 'range' },
  { key: 'male_weight',   label: 'Male Weight',   unit: 'kg',  emoji: '⚖️', type: 'range' },
  { key: 'female_weight', label: 'Female Weight', unit: 'kg',  emoji: '⚖️', type: 'range' },
  { key: 'male_height',   label: 'Male Height',   unit: 'cm',  emoji: '📏', type: 'range' },
  { key: 'female_height', label: 'Female Height', unit: 'cm',  emoji: '📏', type: 'range' },
];

// Allowed API patterns:
//  1. /api/breeds?field=X&min=Y&max=Z&page=P&limit=L  (field requires BOTH min AND max)
//  2. /api/breeds?page=P&limit=L
//  3. /api/breeds

// ─── Parse JSONAPI response ───────────────────────────────────────────────────
function parseResponse(raw) {
  // JSONAPI shape: { data: [...], meta: { pagination: { records } } }
  if (raw?.data && Array.isArray(raw.data)) {
    const breeds = raw.data.map((item) => ({ id: item.id, ...item.attributes }));
    const total  = raw.meta?.pagination?.records ?? breeds.length;
    return { breeds, total };
  }
  // Fallback: plain array
  if (Array.isArray(raw)) return { breeds: raw, total: raw.length };
  // Other shapes
  const list  = raw.breeds || raw.results || [];
  const total = raw.total  || raw.totalCount || list.length;
  return { breeds: list, total };
}

// Both min AND max must be present to use the field filter (API rule)
function buildUrl({ field, min, max, page, limit }) {
  const params = new URLSearchParams();
  const hasField = field && min !== '' && max !== '';
  if (hasField) {
    params.set('field', field);
    params.set('min', min);
    params.set('max', max);
  }
  params.set('page', page);
  params.set('limit', limit);
  return `${API_BASE}?${params.toString()}`;
}

function formatRange(min, max, unit) {
  return `${min}–${max} ${unit}`;
}

// ─── Trait dot meter (1-5) ────────────────────────────────────────────────────
function TraitDots({ value, max = 5 }) {
  return (
    <span className="trait-dots" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`dot ${i < value ? 'filled' : ''}`} />
      ))}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-row">
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 12 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton skeleton-line" style={{ width: '60%', height: 18 }} />
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 12 }} />
        </div>
      </div>
      <div className="skeleton skeleton-line" style={{ width: '100%', height: 48, borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Breed Card ───────────────────────────────────────────────────────────────
function BreedCard({ breed, index }) {
  const attr   = breed;                      // already flattened
  const images = attr.images || [];
  const img    = images[0];
  const traits = attr.traits || {};
  const life   = attr.life           || {};
  const mw     = attr.male_weight    || {};
  const fw     = attr.female_weight  || {};
  const mh     = attr.male_height    || {};
  const fh     = attr.female_height  || {};
  const origin = attr.origin         || {};
  const coat   = attr.coat           || {};
  const temps  = traits.temperament  || [];

  const [imgErr, setImgErr] = useState(false);

  return (
    <article
      className="breed-card"
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`Breed: ${attr.name}`}
    >
      {/* ── Top: image + name ── */}
      <div className="bc-top">
        <div className="bc-img-wrap">
          {img && !imgErr ? (
            <img
              src={img.medium || img.thumb || img.url}
              alt={attr.name}
              className="bc-img"
              onError={() => setImgErr(true)}
              loading="lazy"
            />
          ) : (
            <div className="bc-img-placeholder">🐕</div>
          )}
        </div>

        <div className="bc-title-block">
          <h2 className="breed-name">{attr.name}</h2>
          {origin.country && (
            <div className="breed-origin">📍 {origin.country}</div>
          )}
          <div className="bc-badges">
            <span className={`badge-hypo ${attr.hypoallergenic ? 'yes' : 'no'}`}>
              {attr.hypoallergenic ? '✓ Hypoallergenic' : 'Non-hypo'}
            </span>
            {coat.type && <span className="badge-coat">{coat.type} coat</span>}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {attr.description && (
        <p className="bc-desc">{attr.description}</p>
      )}

      {/* ── Stats grid ── */}
      <div className="bc-stats">
        {Object.keys(life).length > 0 && (
          <div className="stat-item">
            <div className="stat-label">⏳ Life Span</div>
            <div className="stat-value"><span>{life.min}</span>–<span>{life.max}</span> yrs</div>
          </div>
        )}
        {Object.keys(mw).length > 0 && (
          <div className="stat-item">
            <div className="stat-label">⚖️ Male Wt.</div>
            <div className="stat-value"><span>{mw.min}</span>–<span>{mw.max}</span> kg</div>
          </div>
        )}
        {Object.keys(fw).length > 0 && (
          <div className="stat-item">
            <div className="stat-label">⚖️ Female Wt.</div>
            <div className="stat-value"><span>{fw.min}</span>–<span>{fw.max}</span> kg</div>
          </div>
        )}
        {Object.keys(mh).length > 0 && (
          <div className="stat-item">
            <div className="stat-label">📏 Male Ht.</div>
            <div className="stat-value"><span>{mh.min}</span>–<span>{mh.max}</span> cm</div>
          </div>
        )}
        {Object.keys(fh).length > 0 && (
          <div className="stat-item">
            <div className="stat-label">📏 Female Ht.</div>
            <div className="stat-value"><span>{fh.min}</span>–<span>{fh.max}</span> cm</div>
          </div>
        )}
        {traits.exercise_minutes != null && (
          <div className="stat-item">
            <div className="stat-label">🏃 Exercise</div>
            <div className="stat-value"><span>{traits.exercise_minutes}</span> min/day</div>
          </div>
        )}
      </div>

      {/* ── Trait meters ── */}
      {Object.keys(traits).length > 0 && (
        <div className="bc-traits">
          {[
            { key: 'energy',       label: 'Energy'       },
            { key: 'trainability', label: 'Trainability' },
            { key: 'grooming',     label: 'Grooming'     },
            { key: 'barking',      label: 'Barking'      },
            { key: 'apartment_friendly', label: 'Apt. Friendly' },
          ].filter(t => traits[t.key] != null).map(t => (
            <div key={t.key} className="trait-row">
              <span className="trait-label">{t.label}</span>
              <TraitDots value={traits[t.key]} />
            </div>
          ))}
        </div>
      )}

      {/* ── Temperament tags ── */}
      {temps.length > 0 && (
        <div className="bc-temps">
          {temps.slice(0, 5).map(t => (
            <span key={t} className="temp-tag">{t}</span>
          ))}
        </div>
      )}

      {/* ── Coat colors ── */}
      {coat.colors?.length > 0 && (
        <div className="bc-coat-colors">
          <span className="coat-label">Colors:</span>
          {coat.colors.slice(0, 4).map(c => (
            <span key={c} className="color-chip">{c}</span>
          ))}
          {coat.colors.length > 4 && (
            <span className="color-chip more">+{coat.colors.length - 4}</span>
          )}
        </div>
      )}

      {/* ── Kennel clubs ── */}
      {attr.recognized_by?.length > 0 && (
        <div className="bc-clubs">
          {attr.recognized_by.map(c => (
            <span key={c} className="club-tag">{c}</span>
          ))}
        </div>
      )}
    </article>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }) {
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  return (
    <nav className="pagination" aria-label="Breed pages">
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        id="prev-page-btn"
      >← Prev</button>

      {pages.map((p, i) =>
        p === '…'
          ? <span key={`d${i}`} className="page-dots">…</span>
          : <button
              key={p}
              id={`page-btn-${p}`}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >{p}</button>
      )}

      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        id="next-page-btn"
      >Next →</button>
    </nav>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeField, setActiveField] = useState('male_weight');
  const [rangeMin, setRangeMin]       = useState('');
  const [rangeMax, setRangeMax]       = useState('');
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(6);
  const [breeds, setBreeds]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [apiUrl, setApiUrl]           = useState('');
  const debounceRef                   = useRef(null);

  // Validation: field filter only fires when BOTH min AND max are filled
  const hasCompleteFilter = activeField && rangeMin !== '' && rangeMax !== '';
  // Partial = user started filling but hasn't completed both
  const isPartialFilter   = (rangeMin !== '' && rangeMax === '') || (rangeMin === '' && rangeMax !== '');

  const fetchBreeds = useCallback(async (signal) => {
    const url = buildUrl({ field: activeField, min: rangeMin, max: rangeMax, page, limit });
    setApiUrl(url);
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const raw  = await res.json();
      const { breeds: list, total: tot } = parseResponse(raw);
      setBreeds(list);
      setTotal(tot);
      setTotalPages(Math.max(1, Math.ceil(tot / limit)));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch breeds');
        setBreeds([]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeField, rangeMin, rangeMax, page, limit]);

  useEffect(() => {
    const ctl = new AbortController();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBreeds(ctl.signal), 400);
    return () => { clearTimeout(debounceRef.current); ctl.abort(); };
  }, [fetchBreeds]);

  const handleFieldChange = (key) => {
    setActiveField(key); setRangeMin(''); setRangeMax(''); setPage(1);
  };
  const handleRange = (type, val) => {
    type === 'min' ? setRangeMin(val) : setRangeMax(val);
    setPage(1);
  };
  const clearFilters = () => { setRangeMin(''); setRangeMax(''); setPage(1); };
  const fieldInfo    = FIELDS.find(f => f.key === activeField);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-icon">🐕</div>
          <div className="header-text">
            <h1>Dog Breed Explorer</h1>
            <p>Filter &amp; explore breeds by physical traits</p>
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Filter Panel ── */}
        <section className="filter-panel" aria-label="Breed filters">
          <div className="filter-header">
            <div className="filter-title">
              <div className="filter-title-icon">🎛</div>
              Filter by Field
            </div>
            {(rangeMin !== '' || rangeMax !== '') && (
              <button className="clear-btn" id="clear-filters-btn" onClick={clearFilters}>
                ✕ Clear values
              </button>
            )}
          </div>

          <div className="filter-grid">
            {FIELDS.map((f) => (
              <div
                key={f.key}
                id={`field-card-${f.key}`}
                className={`field-card ${activeField === f.key ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={activeField === f.key}
                onClick={() => handleFieldChange(f.key)}
                onKeyDown={(e) => e.key === 'Enter' && handleFieldChange(f.key)}
              >
                <div className="field-card-header">
                  <span className="field-label">
                    <span className="field-emoji">{f.emoji}</span>
                    {f.label}
                  </span>
                  <span className={`field-badge ${f.type === 'bool' ? 'bool' : ''}`}>
                    {f.type === 'bool' ? 'Bool' : f.unit}
                  </span>
                </div>

                {f.type === 'range' && activeField === f.key && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="range-inputs">
                      <div className="range-input-wrap">
                        <span className="range-label">Min</span>
                        <input
                          id={`input-${f.key}-min`}
                          type="number"
                          className={`range-input ${isPartialFilter && rangeMin === '' ? 'input-error' : ''}`}
                          placeholder="e.g. 10"
                          value={rangeMin}
                          onChange={(e) => handleRange('min', e.target.value)}
                          aria-label={`Min ${f.label}`}
                          aria-invalid={isPartialFilter && rangeMin === ''}
                        />
                      </div>
                      <div className="range-input-wrap">
                        <span className="range-label">Max</span>
                        <input
                          id={`input-${f.key}-max`}
                          type="number"
                          className={`range-input ${isPartialFilter && rangeMax === '' ? 'input-error' : ''}`}
                          placeholder="e.g. 30"
                          value={rangeMax}
                          onChange={(e) => handleRange('max', e.target.value)}
                          aria-label={`Max ${f.label}`}
                          aria-invalid={isPartialFilter && rangeMax === ''}
                        />
                      </div>
                    </div>
                    {isPartialFilter && (
                      <div className="range-hint" role="alert">
                        ⚠ Both Min and Max are required to filter by field
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        </section>

        {/* ── Active filter tags ── */}
        {hasCompleteFilter && (
          <div className="active-filters" role="list">
            <div className="filter-tag" role="listitem">
              <span>{fieldInfo?.emoji} {fieldInfo?.label}: {formatRange(rangeMin, rangeMax, fieldInfo?.unit)}</span>
              <button onClick={clearFilters} aria-label="Remove filter">✕</button>
            </div>
          </div>
        )}

        {/* ── API URL chip ──
        {apiUrl && (
          <div className="api-chip" title={apiUrl}>
            <div className="api-chip-dot" />
            <span>{apiUrl}</span>
          </div>
        )} */}

        {/* ── Results bar ── */}
        <div className="results-bar">
          <div className="results-info">
            {loading ? <span>Loading breeds…</span>
              : error ? <span style={{ color: 'var(--error)' }}>Error loading breeds</span>
              : <span>Showing <strong>{breeds.length}</strong> of <strong>{total}</strong> breeds{hasCompleteFilter && ' (filtered)'}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label htmlFor="limit-select" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Per page:</label>
            <select id="limit-select" className="limit-select" value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
              {[3, 6, 9, 12, 24].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="breeds-grid" role="status" aria-label="Loading breeds">
            {[...Array(Math.min(limit, 6))].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="state-container">
            <span className="state-icon">⚠️</span>
            <div className="state-title">Could not connect to API</div>
            <div className="state-desc">
              Make sure your server is running at <code style={{ color: 'var(--accent)' }}>localhost:7000</code>.
              <br />Error: {error}
            </div>
            <button id="retry-btn" className="retry-btn"
              onClick={() => fetchBreeds(new AbortController().signal)}>↺ Retry</button>
          </div>
        ) : breeds.length === 0 ? (
          <div className="state-container">
            <span className="state-icon">🔍</span>
            <div className="state-title">No breeds found</div>
            <div className="state-desc">Try adjusting your filter range or switching to a different field.</div>
            <button id="clear-btn" className="retry-btn" onClick={clearFilters}>✕ Clear Filters</button>
          </div>
        ) : (
          <div className="breeds-grid" role="list" aria-label="Breed results">
            {breeds.map((breed, idx) => (
              <BreedCard key={breed.id || idx} breed={breed} index={idx} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </main>
    </div>
  );
}
