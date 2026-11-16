import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Database,
  FileUp,
  GitCompare,
  LayoutDashboard,
  MapPin,
  Info,
  Menu,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CricketFormat = 'Test' | 'ODI' | 'T20I' | 'Domestic';
type DataSource = {
  type: 'illustrative_sample' | 'licensed_provider' | 'manual_entry';
  label: string;
  provider: string | null;
  sourceUrl: string | null;
  licenceNote: string;
  retrievedAt: string | null;
};
type Player = {
  id: string;
  fullName: string;
  knownAs: string | null;
  team: string | null;
  formats: CricketFormat[];
  playingRole: string | null;
  battingHand: string | null;
  source: DataSource;
  coverage: {
    inningsAvailable: number;
    formats: CricketFormat[];
    competitions: string[];
    lastUpdated: string | null;
    note: string;
  };
};
type BattingInnings = {
  id: string;
  playerId: string;
  format: CricketFormat;
  sequence: number;
  matchDate: string | null;
  opponent: string | null;
  venue: string | null;
  inningsNumber: number | null;
  runs: number;
  ballsFaced: number | null;
  fours: number | null;
  sixes: number | null;
  isNotOut: boolean;
  dismissalType: string | null;
  source: DataSource;
};
type Metric = {
  value: number | null;
  unit: string;
  sampleSize: number;
  baselineValue: number | null;
  difference: number | null;
  confidenceLabel: string;
  definition: string;
  warning: string;
};
type Dashboard = {
  player: Player;
  innings: BattingInnings[];
  selectedWindow: number;
  format: CricketFormat | null;
  summary: {
    inningsAvailable: number;
    runsRecorded: number;
    notOuts: number;
    timesDismissed: number;
  };
  metrics: {
    battingAverage: Metric;
    strikeRate: Metric;
    formIndex: Metric;
  };
  coverage: {
    source: DataSource;
    coverage: Player['coverage'];
    dataLayer: { mode: 'sample' | 'mongo' | 'unavailable'; connected: boolean; message: string };
    lastUpdated: string | null;
    availableFields: string[];
    missingFields: string[];
  };
  warnings: string[];
};
type PlayerResponse = {
  players: Player[];
  sampleSize: number;
  dataLayer: Dashboard['coverage']['dataLayer'];
  warnings: string[];
};

const FORMATS: CricketFormat[] = ['Test', 'ODI', 'T20I', 'Domestic'];
const WINDOWS = [5, 10, 15, 20];

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload;
}

function formatDate(value: string | null): string {
  if (!value) return 'Date not sourced';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? 'Date not sourced'
    : new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

function App() {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<CricketFormat>('T20I');
  const [windowSize, setWindowSize] = useState(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPlayerLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('format', format);
      getJson<PlayerResponse>(`/api/players?${params.toString()}`, controller.signal)
        .then((result) => {
          setPlayers(result.players);
          setSelectedPlayerId((current) => current || result.players[0]?.id || '');
          setError('');
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
          setError(requestError instanceof Error ? requestError.message : 'Player search is unavailable.');
        })
        .finally(() => setPlayerLoading(false));
    }, search ? 160 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, format]);

  useEffect(() => {
    if (!selectedPlayerId) {
      setDashboard(null);
      return;
    }
    const controller = new AbortController();
    setDashboardLoading(true);
    const params = new URLSearchParams({ format, limit: String(windowSize) });
    getJson<Dashboard>(`/api/players/${encodeURIComponent(selectedPlayerId)}/dashboard?${params.toString()}`, controller.signal)
      .then((result) => {
        setDashboard(result);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Player dashboard is unavailable.');
        setDashboard(null);
      })
      .finally(() => setDashboardLoading(false));
    return () => controller.abort();
  }, [selectedPlayerId, format, windowSize]);

  const filteredPlayers = useMemo(() => players.slice(0, 6), [players]);
  const chartRows = useMemo(() => (dashboard?.innings ?? []).map((innings) => ({
    label: innings.matchDate ? formatDate(innings.matchDate) : `#${innings.sequence}`,
    runs: innings.runs,
    sequence: innings.sequence,
  })), [dashboard]);

  const selectPlayer = (player: Player) => {
    setSelectedPlayerId(player.id);
    setSearch(player.fullName);
    setSearchOpen(false);
  };

  const resetFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setSearch('');
    setFormat('T20I');
    setWindowSize(10);
    setSearchOpen(false);
  };

  const sample = dashboard?.player.source.type === 'illustrative_sample';
  const databaseLabel = dashboard?.coverage.dataLayer.mode === 'mongo'
    ? 'MongoDB connected'
    : dashboard?.coverage.dataLayer.mode === 'unavailable'
      ? 'MongoDB unavailable'
      : 'Demo data · in memory';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>C</span><i /></div>
          <div className="brand-copy">
            <span className="brand-name">cricmetric</span>
            <span className="brand-subtitle">STUDIO</span>
          </div>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className="nav-item active" aria-current="page"><LayoutDashboard size={17} /><span>Overview</span><span className="nav-indicator" /></button>
          <button className="nav-item" disabled title="Comparison is planned after the Phase 1 foundation"><GitCompare size={17} /><span>Compare players</span><span className="nav-badge">NEXT</span></button>
          <button className="nav-item" disabled title="Manual and CSV entry are planned for a later phase"><FileUp size={17} /><span>Data entry</span></button>
        </nav>

        <div className="sidebar-section-label collection-label">PLAYER FILES <span>{players.length.toString().padStart(2, '0')}</span></div>
        <div className="player-list" aria-label="Available players">
          {players.map((player) => (
            <button
              className={`player-list-item ${selectedPlayerId === player.id ? 'selected' : ''}`}
              key={player.id}
              onClick={() => selectPlayer(player)}
              title={`Open ${player.fullName}`}
            >
              <span className="player-avatar">{player.fullName.split(' ').slice(-1)[0]?.charAt(0) ?? 'P'}</span>
              <span className="player-list-copy"><strong>{player.fullName}</strong><small>{player.team ?? 'Team not sourced'}</small></span>
              {selectedPlayerId === player.id && <span className="player-active-dot" aria-hidden="true" />}
            </button>
          ))}
          {!players.length && !playerLoading && <p className="sidebar-empty">No players match these filters.</p>}
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-bottom-card">
          <div className="mini-orbit"><Database size={15} /></div>
          <div><strong>Data, with receipts.</strong><span>Every profile carries its source.</span></div>
          <ArrowUpRight size={15} className="muted-icon" />
        </div>
        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>{databaseLabel}</span>
          <CircleHelp size={15} aria-label="Database status is reported by the API" />
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
            <div className="breadcrumb"><span>PLAYER INTELLIGENCE</span><span className="breadcrumb-separator">/</span><strong>OVERVIEW</strong></div>
          </div>
          <div className="topbar-actions">
            <div className={`global-search ${searchOpen ? 'search-focused' : ''}`}>
              <Search size={16} className="search-icon" />
              <input
                aria-label="Search players by name or team"
                placeholder="Search players…"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); }}
              />
              <kbd>⌘ K</kbd>
              {searchOpen && search.trim() && (
                <div className="search-popover" role="listbox" aria-label="Player search results">
                  <div className="popover-heading">MATCHING PLAYERS <span>{filteredPlayers.length}</span></div>
                  {filteredPlayers.map((player) => (
                    <button key={player.id} role="option" aria-selected={player.id === selectedPlayerId} className="search-result" onClick={() => selectPlayer(player)}>
                      <span className="player-avatar small-avatar">{player.fullName.split(' ').slice(-1)[0]?.charAt(0) ?? 'P'}</span>
                      <span><strong>{player.fullName}</strong><small>{player.team ?? 'Team not sourced'} · {player.formats.join(', ')}</small></span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                  {!filteredPlayers.length && <p className="no-results">No matching player in the current dataset.</p>}
                  <div className="popover-footnote">Search only covers records currently available to this project.</div>
                </div>
              )}
            </div>
            <button className="profile-chip" aria-label="Cricmetric Studio workspace"><span className="workspace-avatar">CM</span><span>Workspace</span><ChevronDown size={14} /></button>
          </div>
        </header>

        <div className="page-wrap" onClick={() => searchOpen && setSearchOpen(false)}>
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> PLAYER PERFORMANCE <span className="eyebrow-dot">·</span> PHASE 01</div>
              <h1>Read the innings.<br /><em>Respect the evidence.</em></h1>
              <p className="page-intro">A clearer view of form starts with what the data can actually support.</p>
            </div>
            <div className="heading-meta">
              <div className="meta-icon"><Activity size={18} /></div>
              <span><strong>CRICKET INTELLIGENCE</strong><small>Evidence-led analysis</small></span>
            </div>
          </section>

          {error && <div className="error-banner" role="alert"><AlertCircle size={17} /><span>{error}</span><button onClick={() => window.location.reload()}>Retry</button></div>}

          {dashboard ? (
            <>
              <section className="profile-panel">
                <div className="profile-panel-main">
                  <div className="player-monogram" aria-hidden="true">{dashboard.player.fullName.split(' ').slice(-1)[0]?.charAt(0) ?? 'P'}<span /></div>
                  <div className="profile-identity">
                    <div className="profile-overline"><span className="profile-dot" /> PLAYER DOSSIER <span className="profile-id">ID / {dashboard.player.id.toUpperCase()}</span></div>
                    <h2>{dashboard.player.fullName}</h2>
                    <div className="identity-details">
                      <span>{dashboard.player.team ?? 'Team not sourced'}</span><b />
                      <span>{dashboard.player.playingRole ?? 'Role not sourced'}</span>
                      {dashboard.player.battingHand && <><b /><span>{dashboard.player.battingHand}</span></>}
                    </div>
                  </div>
                </div>
                <div className="profile-panel-right">
                  <label className="select-label" htmlFor="format-select">FORMAT</label>
                  <div className="select-wrap">
                    <select id="format-select" value={format} onChange={(event) => setFormat(event.target.value as CricketFormat)}>
                      {FORMATS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                  <div className="coverage-chip"><span className={sample ? 'coverage-dot sample-dot' : 'coverage-dot'} />{sample ? 'SAMPLE DATA' : 'SOURCE LINKED'}</div>
                </div>
              </section>

              <section className={`source-banner ${sample ? 'source-banner-sample' : ''}`} aria-label="Data coverage notice">
                <div className="source-banner-icon">{sample ? <AlertCircle size={17} /> : <ShieldCheck size={17} />}</div>
                <div className="source-banner-copy">
                  <strong>{dashboard.coverage.source.label}</strong>
                  <span>{dashboard.coverage.dataLayer.message}</span>
                </div>
                <div className="source-banner-right"><span>LAST UPDATED</span><strong>{dashboard.coverage.lastUpdated ? formatDate(dashboard.coverage.lastUpdated) : 'Not supplied'}</strong></div>
              </section>

              <section className="dashboard-toolbar" aria-label="Dashboard filters">
                <div className="toolbar-context"><SlidersHorizontal size={15} /><span>VIEW CONTEXT</span><span className="toolbar-divider" /><span className="quiet-label">Recent innings</span></div>
                <div className="toolbar-controls">
                  <label className="filter-select"><CalendarDays size={15} /><span className="visually-hidden">Select recent innings window</span><select aria-label="Recent innings window" value={windowSize} onChange={(event) => setWindowSize(Number(event.target.value))}>{WINDOWS.map((window) => <option key={window} value={window}>Last {window} innings</option>)}</select><ChevronDown size={13} /></label>
                  <button className="reset-button" onClick={() => resetFilters()}><RotateCcw size={14} /><span>Reset</span></button>
                </div>
              </section>

              <section className="kpi-grid" aria-label="Selected innings summary">
                <article className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">RUNS RECORDED</span><span className="kpi-icon"><TrendingUp size={16} /></span></div>
                  <div className="kpi-value">{dashboard.summary.runsRecorded.toLocaleString('en')}</div>
                  <div className="kpi-foot"><span className="kpi-foot-line" />Batter-credited runs in this window</div>
                </article>
                <article className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">INNINGS IN VIEW</span><span className="kpi-icon"><BarChart3 size={16} /></span></div>
                  <div className="kpi-value">{dashboard.summary.inningsAvailable}<small className="kpi-denom"> / {windowSize}</small></div>
                  <div className="kpi-foot"><span className="kpi-foot-line" />Available sample size · innings</div>
                </article>
                <article className="kpi-card">
                  <div className="kpi-top"><span className="kpi-label">NOT-OUTS</span><span className="kpi-icon"><Check size={16} /></span></div>
                  <div className="kpi-value">{dashboard.summary.notOuts}</div>
                  <div className="kpi-foot"><span className="kpi-foot-line" />Not counted as dismissals</div>
                </article>
                <article className="kpi-card kpi-card-status">
                  <div className="kpi-top"><span className="kpi-label">DATA STATUS</span><span className="kpi-icon"><ShieldCheck size={16} /></span></div>
                  <div className="kpi-value status-value">{sample ? 'Illustrative' : dashboard.summary.inningsAvailable < 3 ? 'Insufficient' : 'Source linked'}</div>
                  <div className="kpi-foot"><span className={`status-pill ${sample ? 'status-sample' : ''}`} />{sample ? 'Synthetic sample · not match facts' : `${dashboard.summary.inningsAvailable} innings available`}</div>
                </article>
              </section>

              <section className="main-grid">
                <article className="panel innings-chart-panel">
                  <div className="panel-heading">
                    <div><div className="panel-overline">PERFORMANCE TRACE</div><h3>Runs by innings</h3><p>Individual score, separate from strike rate.</p></div>
                    <span className="panel-action"><span className="legend-swatch" /> Runs</span>
                  </div>
                  {dashboard.innings.length ? (
                    <div className="chart-frame" role="img" aria-label={`${dashboard.innings.length} innings shown as a runs-per-innings bar chart. This chart does not show strike rate.`}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartRows} margin={{ top: 10, right: 8, bottom: 0, left: -15 }}>
                          <CartesianGrid vertical={false} stroke="rgba(205, 222, 218, 0.08)" strokeDasharray="3 6" />
                          <XAxis dataKey="label" tick={{ fill: '#77898a', fontSize: 10 }} axisLine={{ stroke: '#344347' }} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: '#77898a', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'rgba(159, 216, 196, 0.05)' }} contentStyle={{ background: '#182327', border: '1px solid #344347', borderRadius: 8, color: '#edf3ef', fontSize: 12 }} formatter={(value) => [`${value ?? '—'} runs`, 'Batter runs']} labelFormatter={(label) => `Record ${label}`} />
                          <Bar dataKey="runs" fill="#8ac8af" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-empty"><BarChart3 size={23} /><strong>No innings in this selection</strong><span>Try another format or data source.</span></div>
                  )}
                  <div className="chart-caption"><span>RECORD ORDER <i /> {dashboard.innings.length} innings</span><span>Missing dates stay unlabelled as dates</span></div>
                </article>

                <article className="panel next-metrics-panel">
                  <div className="panel-heading compact-heading">
                    <div><div className="panel-overline">CORE METRICS</div><h3>Calculations, next</h3></div>
                  <div className="lock-mark"><ShieldCheck size={15} /></div>
                </div>
                  <p className="metrics-intro">The data model can read sourced records. Metric formulas are scheduled for the next phase and stay blank until tested.</p>
                  <div className="deferred-metric">
                    <div><span>Batting average</span><strong>Not calculated</strong></div>
                    <span className="metric-definition">Runs ÷ times dismissed · not-outs excluded</span>
                  </div>
                  <div className="deferred-metric">
                    <div><span>Strike rate</span><strong>Not calculated</strong></div>
                    <span className="metric-definition">Runs ÷ balls faced × 100 · source definition required</span>
                  </div>
                  <div className="deferred-metric deferred-metric-muted">
                    <div><span>Form Index</span><strong>Unavailable</strong></div>
                    <span className="metric-definition">Requires a calibrated format-specific reference group</span>
                  </div>
                  <div className="metrics-footnote"><CircleHelp size={14} /><span>No performance rating is inferred from this sample.</span></div>
                </article>
              </section>

              <section className="lower-grid">
                <article className="panel innings-table-panel">
                  <div className="panel-heading table-panel-heading">
                    <div><div className="panel-overline">MATCH-BY-MATCH</div><h3>Recent innings <span className="heading-count">{dashboard.innings.length}</span></h3></div>
                    <button className="subtle-button" type="button" title="CSV import is planned in a later phase" disabled>Export <ArrowUpRight size={13} /></button>
                  </div>
                  {dashboard.innings.length ? (
                    <div className="table-scroll">
                      <table>
                        <thead><tr><th>RECORD</th><th>OPPOSITION</th><th>VENUE</th><th>SCORE</th><th>BALLS</th><th>STATUS</th></tr></thead>
                        <tbody>
                          {[...dashboard.innings].reverse().map((innings) => (
                            <tr key={innings.id}>
                              <td><span className="record-date">{innings.matchDate ? formatDate(innings.matchDate) : innings.source.type === 'illustrative_sample' ? `Sample ${String(innings.sequence).padStart(2, '0')}` : 'Date not sourced'}</span><span className="record-format">{innings.format}</span></td>
                              <td>{innings.opponent ?? <span className="not-sourced">Not sourced</span>}</td>
                              <td><span className="venue-cell"><MapPin size={12} />{innings.venue ?? 'Not sourced'}</span></td>
                              <td><strong className="score-cell">{innings.runs}</strong>{innings.isNotOut && <span className="not-out-mark">*</span>}</td>
                              <td>{innings.ballsFaced ?? <span className="not-sourced">—</span>}</td>
                              <td><span className={`dismissal-tag ${innings.isNotOut ? 'not-out-tag' : ''}`}>{innings.isNotOut ? 'Not out' : innings.dismissalType ?? 'Dismissed'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="table-empty">No innings available for {format} in this window.</div>}
                  <div className="table-footnote"><Info size={13} />Missing opponent, venue, date and ball data are shown as missing, never inferred.</div>
                </article>

                <article className="panel context-panel">
                  <div className="panel-heading compact-heading">
                    <div><div className="panel-overline">CONDITIONS & CONTEXT</div><h3>What we know</h3></div>
                    <MapPin size={16} className="panel-heading-icon" />
                  </div>
                  <div className="context-empty-icon"><MapPin size={18} /></div>
                  <strong className="context-empty-title">Venue context unavailable</strong>
                  <p className="context-copy">{dashboard.coverage.missingFields.includes('venue') ? 'No reliable venue values are available for this selection. No pitch or weather effect is estimated.' : 'Venue comparison is not part of this foundation phase.'}</p>
                  <div className="context-divider" />
                  <div className="coverage-detail"><span>Available innings</span><strong>{dashboard.summary.inningsAvailable}</strong></div>
                  <div className="coverage-detail"><span>Context fields missing</span><strong>{dashboard.coverage.missingFields.length}</strong></div>
                  <div className="coverage-detail"><span>Competition coverage</span><strong>{dashboard.coverage.coverage.competitions.length ? dashboard.coverage.coverage.competitions.join(', ') : 'Not provided'}</strong></div>
                  <div className="context-note"><ShieldCheck size={14} /><span>Small samples are reported, not promoted into conclusions.</span></div>
                </article>
              </section>

              <section className="method-strip">
                <div className="method-icon"><Database size={16} /></div>
                <div><strong>Source-first by design</strong><span>{dashboard.coverage.source.licenceNote}</span></div>
                <button type="button" disabled title="Methodology page is planned for a later phase">Methodology <ArrowRight size={14} /></button>
              </section>
            </>
          ) : (
            <section className="empty-dashboard">
              <div className="empty-symbol">{playerLoading || dashboardLoading ? <Activity size={25} /> : <Search size={25} />}</div>
              <h2>{playerLoading || dashboardLoading ? 'Reading the available records…' : 'No player selected'}</h2>
              <p>{playerLoading || dashboardLoading ? 'The dashboard is loading from the configured data source.' : 'Search within the current dataset or check its coverage before drawing conclusions.'}</p>
              <button className="primary-button" onClick={resetFilters}>Reset view <RotateCcw size={15} /></button>
            </section>
          )}

          {dashboard && dashboard.warnings.length > 0 && (
            <section className="warnings-row" aria-label="Data warnings">
              <div className="warning-heading"><AlertCircle size={15} /><strong>READ WITH CARE</strong></div>
              {dashboard.warnings.slice(0, 3).map((warning) => <span key={warning}>{warning}</span>)}
            </section>
          )}

          <footer className="page-footer">
            <span>CRICMETRIC STUDIO <i /> PHASE 01 FOUNDATION</span>
            <span><span className="footer-status-dot" />{dashboard?.coverage.dataLayer.mode === 'mongo' ? 'MONGODB CONNECTED' : dashboard?.coverage.dataLayer.mode === 'unavailable' ? 'MONGODB UNAVAILABLE · DEMO FALLBACK' : 'ILLUSTRATIVE DATA MODE'}</span>
            <span className="footer-copyright">ANALYSIS WITHOUT GUESSWORK</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
