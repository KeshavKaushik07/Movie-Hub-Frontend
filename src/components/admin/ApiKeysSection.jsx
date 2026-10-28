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
  Save,
} from 'lucide-react';
import { formatAdminDateTime } from './adminHelpers';

export default function ApiKeysSection({
  keys = [],
  newKey,
  setNewKey,
  onAddKey,
  onDeleteKey,
  onTestKey,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'manage';
  const [subTab, setSubTab] = useState(urlTab);
  const [poolFilter, setPoolFilter] = useState('all');

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
    <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
      {/* Pinned Toolbar */}
      <div className='shrink-0 mb-3 space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-2.5 shadow-xs'>
          <div className='flex flex-wrap items-center gap-1 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-[#070a10] p-1'>
            <button
              type='button'
              onClick={() => handleSwitchTab('manage')}
              className={`admin-btn admin-btn-sm ${
                subTab === 'manage'
                  ? 'admin-btn-primary font-bold'
                  : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              <KeyRound size={13} /> Key Pool ({keys.length})
            </button>
            <button
              type='button'
              onClick={() => handleSwitchTab('add')}
              className={`admin-btn admin-btn-sm ${
                subTab === 'add'
                  ? 'admin-btn-primary font-bold'
                  : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              <PlusCircle size={13} /> + Add Encrypted Key
            </button>
          </div>

          {subTab === 'manage' && (
            <div className='flex flex-wrap items-center gap-1 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-[#070a10] px-2 py-1'>
              {[
                { key: 'all', label: `All (${keys.length})`, icon: KeyRound },
                {
                  key: 'active',
                  label: `Active (${activeInPoolCount})`,
                  icon: ShieldCheck,
                },
                {
                  key: 'standby',
                  label: `Standby (${standbyCount})`,
                  icon: Clock,
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.key}
                    type='button'
                    onClick={() => setPoolFilter(f.key)}
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                      poolFilter === f.key
                        ? 'bg-[#2350d8] keep-white dark:bg-brand dark:text-black font-bold shadow-xs'
                        : 'text-[#4a5262] dark:text-zinc-400 hover:text-[#1b2230] dark:hover:text-white'
                    }`}
                  >
                    <Icon size={11} className='mr-1 inline' />
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}

          <span className='rounded px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-brand/15 dark:text-brand'>
            AES-256-GCM Failover Pool
          </span>
        </div>
      </div>

      {subTab === 'add' ? (
        <form
          onSubmit={async (e) => {
            await onAddKey(e);
            handleSwitchTab('manage');
          }}
          className='shrink-0 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 shadow-xs max-w-2xl space-y-4'
        >
          <div>
            <h3 className='text-sm font-bold text-[#1b2230] dark:text-white'>
              Register Encrypted TMDB v3 API Key
            </h3>
            <p className='mt-0.5 text-xs text-[#4a5262] dark:text-zinc-400'>
              Keys are verified against TMDB and encrypted with AES-256-GCM for
              automatic rotation.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Key Label *
              </label>
              <input
                required
                placeholder='e.g. Primary Key #1'
                value={newKey.label}
                onChange={(e) =>
                  setNewKey({ ...newKey, label: e.target.value })
                }
                className='w-full h-9 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
              />
            </div>
            <div className='sm:col-span-2'>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                32-Character TMDB v3 Key *
              </label>
              <input
                required
                placeholder='32-char hex string'
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                className='w-full h-9 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] font-mono text-xs text-[#1b2230] dark:text-white'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2 pt-2'>
            <button
              type='button'
              onClick={() => handleSwitchTab('manage')}
              className='admin-btn admin-btn-secondary admin-btn-sm'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='admin-btn admin-btn-primary admin-btn-sm'
            >
              <Plus size={13} /> Save Key
            </button>
          </div>
        </form>
      ) : (
        <div className='flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] shadow-xs'>
          <div className='flex-1 min-h-0 overflow-x-auto overflow-y-auto studio-scroll'>
            <table className='admin-table w-full text-left'>
              <thead className='sticky top-0 z-10 bg-slate-50 dark:bg-[#0e131f] border-b border-[#d5d9e0] dark:border-white/10 shadow-xs'>
                <tr>
                  <th className='w-12'>#</th>
                  <th>Key Label</th>
                  <th>Masked Key</th>
                  <th>Status</th>
                  <th>Requests</th>
                  <th>Created &amp; Last Used</th>
                  <th className='text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleKeys.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='py-12 text-center text-xs text-zinc-400'
                    >
                      <KeyRound
                        size={22}
                        className='mx-auto mb-2 text-[#2350d8] dark:text-brand'
                      />
                      No TMDB API keys in this filter view.
                    </td>
                  </tr>
                ) : (
                  visibleKeys.map((k, idx) => (
                    <tr key={k.id}>
                      <td className='whitespace-nowrap font-mono text-[11px] font-bold text-zinc-500'>
                        #{idx + 1}
                      </td>
                      <td className='font-bold text-xs text-[#1b2230] dark:text-white'>
                        {k.label}
                      </td>
                      <td className='font-mono text-xs text-zinc-500'>
                        {k.maskedKey}
                      </td>
                      <td>
                        <span
                          className={`admin-status-badge ${
                            k.inUse
                              ? 'admin-status-amber'
                              : 'admin-status-emerald'
                          }`}
                        >
                          {k.inUse ? 'Active' : 'Standby'}
                        </span>
                      </td>
                      <td className='font-mono text-xs text-zinc-600 dark:text-zinc-300'>
                        {(k.requestCount || 0).toLocaleString('en-IN')} reqs
                      </td>
                      <td className='whitespace-nowrap text-[11px] leading-tight'>
                        <div className='text-zinc-800 dark:text-zinc-200 font-medium'>
                          <span className='text-zinc-400 text-[10px]'>
                            Used:{' '}
                          </span>
                          {formatAdminDateTime(k.lastUsedAt || k.createdAt)}
                        </div>
                        <div className='text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5'>
                          <span className='text-zinc-400 text-[9px]'>
                            Cre:{' '}
                          </span>
                          {formatAdminDateTime(k.createdAt)}
                        </div>
                      </td>
                      <td className='whitespace-nowrap text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          {onTestKey && (
                            <button
                              type='button'
                              onClick={() => onTestKey(k.id)}
                              className='admin-btn admin-btn-sky admin-btn-sm'
                            >
                              <CheckCircle2 size={12} /> Test
                            </button>
                          )}
                          <button
                            type='button'
                            onClick={() => onDeleteKey(k.id)}
                            className='admin-btn admin-btn-danger admin-btn-sm px-2'
                            title='Delete Key'
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className='shrink-0 border-t border-[#d5d9e0] dark:border-white/10 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] text-xs text-zinc-500 flex justify-between items-center'>
            <span>
              Showing {visibleKeys.length} of {keys.length} API keys
            </span>
            <span className='text-[11px] text-zinc-400'>
              Pool failover runs automatically on 429/401 rate limits
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
