import { KeyRound, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { formatAdminDate } from './adminHelpers';

export default function ApiKeysSection({
  keys,
  newKey,
  setNewKey,
  onAddKey,
  onDeleteKey,
  onTestKey,
}) {
  return (
    <div className="space-y-5">
      <form
        onSubmit={onAddKey}
        className="grid gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg sm:grid-cols-4"
      >
        <input
          required
          placeholder="Key Label (e.g. Backup Key #2)"
          value={newKey.label}
          onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
          className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
        />
        <input
          required
          placeholder="32-char TMDB v3 API Key"
          value={newKey.key}
          onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
          className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 font-mono text-xs text-white sm:col-span-2"
        />
        <button type="submit" className="admin-btn admin-btn-primary">
          <Plus size={14} /> Add Encrypted Key
        </button>
      </form>

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
            {(keys || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                  <KeyRound size={18} className="mx-auto mb-1 text-brand" />
                  No TMDB API keys registered.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
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
                  <td className="text-zinc-400">{formatAdminDate(k.lastUsedAt || k.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onTestKey && (
                        <button
                          type="button"
                          onClick={() => onTestKey(k.id)}
                          className="admin-btn admin-btn-sky"
                        >
                          <CheckCircle2 size={12} /> Test Key
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteKey(k.id)}
                        className="admin-btn admin-btn-danger"
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
    </div>
  );
}
