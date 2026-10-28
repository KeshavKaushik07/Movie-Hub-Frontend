import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { formatAdminDate } from './adminHelpers';

export default function ApiKeysSection({
  keys,
  newKey,
  setNewKey,
  onAddKey,
  onDeleteKey,
  onTestKey,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'manage'; // 'manage' | 'add'
  const [subTab, setSubTab] = useState(urlTab);
  const [poolFilter, setPoolFilter] = useState('all'); // 'all' | 'active' | 'standby'

  useEffect(() => {
    setSubTab(searchParams.get('tab') || 'manage');
  }, [searchParams]);

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const activeInPoolCount = (keys || []).filter((k) => k.inUse).length;
  const standbyCount = Math.max(0, (keys || []).length - activeInPoolCount);

  const visibleKeys = (keys || []).filter((k) => {
    if (poolFilter === 'active') return Boolean(k.inUse);
    if (poolFilter === 'standby') return !k.inUse;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Frozen Inner Selection & Filter Tabs Bar */}
      <div className="admin-sticky-bar">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#070a10] p-1">
              <button
                type="button"
                onClick={() => handleSwitchTab('manage')}
                className={`admin-btn ${
                  subTab === 'manage'
                    ? 'admin-btn-primary'
                    : 'admin-btn-secondary border-transparent shadow-none'
                }`}
              >
                <KeyRound size={13} /> Key Pool ({(keys || []).length})
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab('add')}
                className={`admin-btn ${
                  subTab === 'add'
                    ? 'admin-btn-primary'
                    : 'admin-btn-secondary border-transparent shadow-none'
                }`}
              >
                <PlusCircle size={13} /> Add Encrypted API Key
              </button>
            </div>

            {subTab === 'manage' && (
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] p-1">
                {[
                  { key: 'all', label: `All Keys (${(keys || []).length})`, icon: KeyRound },
                  { key: 'active', label: `Active (${activeInPoolCount})`, icon: ShieldCheck },
                  { key: 'standby', label: `Standby (${standbyCount})`, icon: Clock },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setPoolFilter(f.key)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        poolFilter === f.key
                          ? 'bg-brand/20 font-extrabold text-brand'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon size={11} className="mr-1 inline" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="rounded-xl bg-brand/15 px-3 py-1.5 text-xs font-extrabold text-brand">
            AES-256-GCM Encrypted Rotation Pool
          </span>
        </div>
      </div>

      {subTab === 'add' ? (
        <form
          onSubmit={async (e) => {
            await onAddKey(e);
            handleSwitchTab('manage');
          }}
          className="space-y-4 rounded-2xl border border-brand/30 bg-[#0e131f] p-6 shadow-xl"
        >
          <div>
            <h3 className="text-base font-extrabold text-white">
              Register Encrypted TMDB v3 API Key
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Keys are verified against TMDB and encrypted with AES-256-GCM for automatic failover rotation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              required
              placeholder="Key Label (e.g. Backup Key #2)"
              value={newKey.label}
              onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white"
            />
            <input
              required
              placeholder="32-char TMDB v3 API Key"
              value={newKey.key}
              onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-xs text-white sm:col-span-2"
            />
            <button type="submit" className="admin-btn admin-btn-primary">
              <Plus size={14} /> Add Encrypted Key
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Key Label</th>
                <th>Masked Key</th>
                <th>Status</th>
                <th>Total Requests</th>
                <th>Last Used</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                    <KeyRound size={18} className="mx-auto mb-1 text-brand" />
                    No TMDB API keys match this filter.
                  </td>
                </tr>
              ) : (
                visibleKeys.map((k) => (
                  <tr key={k.id}>
                    <td className="font-bold text-white">{k.label}</td>
                    <td className="font-mono text-zinc-400">{k.maskedKey}</td>
                    <td>
                      {k.inUse ? (
                        <span className="admin-status-badge admin-status-amber">
                          ACTIVE IN POOL
                        </span>
                      ) : (
                        <span className="admin-status-badge admin-status-emerald">
                          STANDBY
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-zinc-300">
                      {(k.requestCount || 0).toLocaleString('en-IN')} reqs
                    </td>
                    <td className="text-zinc-400">
                      {formatAdminDate(k.lastUsedAt || k.createdAt)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onTestKey && (
                          <button
                            type="button"
                            onClick={() => onTestKey(k.id)}
                            className="admin-btn admin-btn-sky admin-btn-sm"
                          >
                            <CheckCircle2 size={12} /> Test Key
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteKey(k.id)}
                          className="admin-btn admin-btn-danger admin-btn-sm"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
