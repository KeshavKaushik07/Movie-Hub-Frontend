import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Trash2,
  Plus,
  MessageSquare,
  Search,
  ExternalLink,
} from 'lucide-react';
import { formatAdminDate } from './adminHelpers';

export default function CommunitySection({
  commRooms,
  newRoomForm,
  setNewRoomForm,
  onCreateRoom,
  onToggleRoomLock,
  onRequestDeleteRoom,
}) {
  const [searchQ, setSearchQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'public' | 'movie'

  const filteredRooms = (commRooms || []).filter((r) => {
    if (typeFilter === 'public' && r.roomType !== 'public') return false;
    if (typeFilter === 'movie' && r.roomType !== 'movie') return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchCreator = (r.createdBy?.name || 'Official System').toLowerCase().includes(q);
      return matchName || matchCreator;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Create New Official Community Lounge Card */}
      <form
        onSubmit={onCreateRoom}
        className="rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Create New Official Community Lounge
            </h3>
            <p className="text-[11px] text-zinc-400">
              Launch a new public discussion room for movies, box office trade, anime, or regional cinema.
            </p>
          </div>
          <span className="rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-extrabold text-brand">
            {commRooms.length} Active Rooms
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-12">
          <input
            value={newRoomForm.icon}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, icon: e.target.value })}
            placeholder="🎬"
            maxLength={4}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white sm:col-span-1"
            title="Room Icon / Emoji"
          />
          <input
            required
            placeholder="Lounge Name (e.g. Tollywood & Pan-India Club) *"
            value={newRoomForm.name}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-brand focus:outline-none sm:col-span-4"
          />
          <input
            placeholder="Short room description..."
            value={newRoomForm.description}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, description: e.target.value })}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-brand focus:outline-none sm:col-span-5"
          />
          <button type="submit" className="admin-btn admin-btn-primary sm:col-span-2">
            <Plus size={14} /> Create Room
          </button>
        </div>
      </form>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e131f] p-1">
          {[
            { key: 'all', label: `All Rooms (${commRooms.length})` },
            {
              key: 'public',
              label: `Official Lounges (${commRooms.filter((r) => r.roomType === 'public').length})`,
            },
            {
              key: 'movie',
              label: `Movie Chat Rooms (${commRooms.filter((r) => r.roomType === 'movie').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`admin-btn ${
                typeFilter === tab.key ? 'admin-btn-primary' : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Filter by room name or creator..."
            className="w-full rounded-xl border border-white/10 bg-[#0e131f] py-2 pr-3 pl-8 text-xs text-white focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Requirement 3: Detailed Community & Chat Rooms Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Room Name</th>
              <th>Created By</th>
              <th>When Created</th>
              <th>Posts</th>
              <th>Room Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                  <MessageSquare size={20} className="mx-auto mb-2 text-brand" />
                  No community chat rooms match your current filter.
                </td>
              </tr>
            ) : (
              filteredRooms.map((r) => {
                const creatorName = r.createdBy?.name || (r.isOfficial ? 'Official System' : 'Community');
                const creatorRole = r.createdBy?.role || (r.isOfficial ? 'system' : 'user');
                return (
                  <tr key={r.id}>
                    {/* 1. Room Name */}
                    <td className="min-w-52.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">
                          {r.icon || '💬'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-extrabold text-white">{r.name}</p>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase">
                              {r.roomType === 'movie' ? 'Movie Chat' : r.topic || 'Lounge'}
                            </span>
                          </div>
                          {r.description && (
                            <p className="mt-0.5 max-w-xs truncate text-[11px] text-zinc-400">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Who Created It */}
                    <td className="whitespace-nowrap">
                      <div className="leading-tight">
                        <p className="font-bold text-white">{creatorName}</p>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                          {creatorRole}
                        </span>
                      </div>
                    </td>

                    {/* 3. When Created */}
                    <td className="whitespace-nowrap text-zinc-300">
                      {formatAdminDate(r.createdAt)}
                    </td>

                    {/* 4. Posts Count */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-extrabold text-white">
                        <MessageSquare size={12} className="text-brand" />
                        {Number(r.messageCount || 0).toLocaleString('en-IN')} posts
                      </span>
                    </td>

                    {/* 5. Status Badge */}
                    <td className="whitespace-nowrap">
                      <span
                        className={`admin-status-badge ${
                          r.isLocked ? 'admin-status-amber' : 'admin-status-emerald'
                        }`}
                      >
                        {r.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                        {r.isLocked ? 'Locked' : 'Unlocked'}
                      </span>
                    </td>

                    {/* 6. Lock / Unlock & Delete Buttons */}
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/community?room=${encodeURIComponent(r.slug || r.id)}`}
                          className="admin-btn admin-btn-secondary"
                          title="Open Chat Room"
                        >
                          <ExternalLink size={12} /> Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => onToggleRoomLock(r)}
                          className={`admin-btn ${
                            r.isLocked ? 'admin-btn-emerald' : 'admin-btn-amber'
                          }`}
                        >
                          {r.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                          {r.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteRoom(r)}
                          className="admin-btn admin-btn-danger"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
