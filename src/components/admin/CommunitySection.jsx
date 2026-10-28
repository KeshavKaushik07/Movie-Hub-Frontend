import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Trash2,
  Plus,
  MessageSquare,
  Search,
  ExternalLink,
  Users,
  Crown,
  Ban,
  Sparkles,
  X,
  ShieldAlert,
  Check,
  Edit3,
} from 'lucide-react';
import { formatAdminDate } from './adminHelpers';
import {
  communityApi,
  GROUP_SYMBOLS,
  COMMUNITY_TOPICS,
} from '../../services/api';

export default function CommunitySection({
  commRooms,
  currentUser,
  newRoomForm,
  setNewRoomForm,
  onCreateRoom,
  onToggleRoomLock,
  onRequestDeleteRoom,
  onRefreshCommunity,
  notify,
}) {
  const [searchQ, setSearchQ] = useState('');
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);

  // Modal state for inspecting a community's users/admins, changing symbol, & blocking community/users
  const [managingRoom, setManagingRoom] = useState(null);
  const [roomMembersLoading, setRoomMembersLoading] = useState(false);
  const [roomMembersData, setRoomMembersData] = useState({
    totalMembers: 0,
    admins: [],
    members: [],
    blockedUsers: [],
  });
  const [memberFilterQ, setMemberFilterQ] = useState('');
  const [symbolEditOpenForRoom, setSymbolEditOpenForRoom] = useState(false);
  const [blockingUserId, setBlockingUserId] = useState(null);

  const openManageRoomModal = useCallback(
    async (room) => {
      setManagingRoom(room);
      setMemberFilterQ('');
      setSymbolEditOpenForRoom(false);
      setRoomMembersLoading(true);
      try {
        let data = await communityApi.getRoomMembers(room.id);
        let membersList = Array.isArray(data?.members) ? data.members : [];

        // If this community was created by an Admin (or seeded as an official lounge)
        // and its creator/admin was not yet persisted into `room.members` & `room.admins`,
        // automatically assign that Admin as Room Admin & Member in MongoDB!
        const targetAdminId = room.createdBy?.id || currentUser?.id;
        if (membersList.length === 0 && targetAdminId) {
          try {
            await communityApi.promoteOrTransferAdmin(room.id, {
              userId: targetAdminId,
              transfer: false,
            });
            data = await communityApi.getRoomMembers(room.id);
            membersList = Array.isArray(data?.members) ? data.members : [];
            if (onRefreshCommunity) onRefreshCommunity();
          } catch {
            /* ignore */
          }
        }

        setRoomMembersData({
          totalMembers: data?.totalMembers || membersList.length,
          admins: Array.isArray(data?.admins) ? data.admins : [],
          members: membersList,
          blockedUsers: Array.isArray(data?.blockedUsers) ? data.blockedUsers : [],
        });
        if (data?.room) {
          setManagingRoom((prev) =>
            prev && prev.id === room.id ? { ...prev, ...data.room } : prev,
          );
        }
      } catch {
        /* ignore */
      } finally {
        setRoomMembersLoading(false);
      }
    },
    [currentUser?.id, onRefreshCommunity],
  );

  const handleChangeRoomSymbol = async (room, newSymbol) => {
    if (!room || !newSymbol) return;
    try {
      const updated = await communityApi.updateRoom(room.id, { icon: newSymbol });
      if (updated) {
        setManagingRoom((prev) =>
          prev && prev.id === room.id ? { ...prev, ...updated } : prev,
        );
      }
      if (onRefreshCommunity) onRefreshCommunity();
      if (notify) notify(`Updated symbol for "${room.name}" to ${newSymbol}`);
    } catch (err) {
      if (notify) {
        notify(err.response?.data?.message || 'Failed to update community symbol', 'error');
      }
    }
  };

  const handleBlockUserOrRoomAdmin = async (member) => {
    if (!managingRoom || !member || blockingUserId) return;
    setBlockingUserId(member.id);
    try {
      const res = await communityApi.blockUser(managingRoom.id, member.id);
      if (res?.room) {
        setManagingRoom((prev) =>
          prev && prev.id === managingRoom.id ? { ...prev, ...res.room } : prev,
        );
      }
      await openManageRoomModal(res?.room || managingRoom);
      if (onRefreshCommunity) onRefreshCommunity();
      if (notify) {
        notify(
          `Blocked ${member.isRoomAdmin ? 'Room Admin' : 'user'} "${member.name}" and completely deleted ${
            res?.deletedMessagesCount || 0
          } of their posts!`,
        );
      }
    } catch (err) {
      if (notify) {
        notify(err.response?.data?.message || 'Failed to block user', 'error');
      }
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleUnblockUser = async (blockedUser) => {
    if (!managingRoom || !blockedUser) return;
    try {
      const res = await communityApi.unblockUser(managingRoom.id, blockedUser.id);
      await openManageRoomModal(res?.room || managingRoom);
      if (onRefreshCommunity) onRefreshCommunity();
      if (notify) {
        notify(`Unblocked "${blockedUser.name}" in "${managingRoom.name}"`);
      }
    } catch (err) {
      if (notify) {
        notify(err.response?.data?.message || 'Failed to unblock user', 'error');
      }
    }
  };

  const handleToggleMemberAdminRole = async (member) => {
    if (!managingRoom || !member) return;
    try {
      if (member.isRoomAdmin) {
        await communityApi.removeAdmin(managingRoom.id, member.id);
        if (notify) notify(`Removed Room Admin role from "${member.name}"`);
      } else {
        await communityApi.promoteOrTransferAdmin(managingRoom.id, {
          userId: member.id,
          transfer: false,
        });
        if (notify) notify(`Promoted "${member.name}" to Room Admin!`);
      }
      await openManageRoomModal(managingRoom);
      if (onRefreshCommunity) onRefreshCommunity();
    } catch (err) {
      if (notify) {
        notify(err.response?.data?.message || 'Could not update Room Admin role', 'error');
      }
    }
  };

  const filteredRooms = (commRooms || []).filter((r) => {
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      const matchName = (r.name || '').toLowerCase().includes(q);
      const matchTopic = (r.topic || '').toLowerCase().includes(q);
      const matchCreator = (
        r.createdBy?.name ||
        r.admins?.[0]?.name ||
        currentUser?.name ||
        ''
      )
        .toLowerCase()
        .includes(q);
      return matchName || matchTopic || matchCreator;
    }
    return true;
  });

  const filteredModalMembers = (roomMembersData.members || []).filter((m) => {
    if (!memberFilterQ.trim()) return true;
    const q = memberFilterQ.toLowerCase().trim();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* ==================== WHATSAPP-STYLE ADMIN COMMUNITY CREATION PANEL ==================== */}
      <form
        onSubmit={onCreateRoom}
        className="rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Sparkles size={15} className="text-brand" />
              Create Official Community Group
            </h3>
            <p className="text-[11px] text-zinc-400">
              Choose a group symbol, name, topic, and description. Post counts strictly track top-level posts (replies are excluded).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-extrabold text-brand">
              {commRooms.length} Communities
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          {/* Group Symbol Selector Button */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setSymbolPickerOpen((v) => !v)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-white transition hover:border-brand"
              title="Click to choose Group Symbol"
            >
              <span className="text-lg">{newRoomForm.icon || '🎬'}</span>
              <span className="text-[11px] text-zinc-300">Symbol</span>
            </button>
          </div>

          <input
            required
            placeholder="Community Name (e.g. Tollywood & Pan-India Club) *"
            value={newRoomForm.name}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white focus:border-brand focus:outline-none sm:col-span-3"
          />

          <select
            value={newRoomForm.topic || 'general'}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, topic: e.target.value })}
            className="h-10 rounded-xl border border-white/10 bg-[#070a10] px-3 text-xs text-white focus:border-brand focus:outline-none sm:col-span-2"
          >
            {COMMUNITY_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            placeholder="Community description & rules..."
            value={newRoomForm.description}
            onChange={(e) => setNewRoomForm({ ...newRoomForm, description: e.target.value })}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white focus:border-brand focus:outline-none sm:col-span-3"
          />

          <button type="submit" className="admin-btn admin-btn-primary h-10 sm:col-span-2">
            <Plus size={14} /> Create Group
          </button>
        </div>

        {/* Expandable Group Symbol Palette */}
        {symbolPickerOpen && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#070a10] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                Select Group Symbol ({GROUP_SYMBOLS.length} symbols available)
              </span>
              <button
                type="button"
                onClick={() => setSymbolPickerOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Done
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GROUP_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setNewRoomForm({ ...newRoomForm, icon: sym });
                    setSymbolPickerOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                    newRoomForm.icon === sym
                      ? 'scale-110 border border-brand bg-brand/25 shadow-sm'
                      : 'border border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* ==================== SEARCH COMMUNITIES BAR ==================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search communities by name, topic, or creator..."
            className="w-full rounded-xl border border-white/10 bg-[#0e131f] py-2.5 pr-8 pl-9 text-xs text-white focus:border-brand focus:outline-none"
          />
          {searchQ && (
            <button
              type="button"
              onClick={() => setSearchQ('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-400">
          Click <b className="text-brand">Users & Block</b> on any community to view all members, inspect Room Admins, or block a user/admin (which deletes all their posts).
        </p>
      </div>

      {/* ==================== COMMUNITIES MANAGEMENT TABLE ==================== */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Community & Symbol</th>
              <th>Creator & Room Admins</th>
              <th>Created Date</th>
              <th>Total Users</th>
              <th>Posts (No Replies)</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-zinc-400">
                  <MessageSquare size={20} className="mx-auto mb-2 text-brand" />
                  No communities match your current search.
                </td>
              </tr>
            ) : (
              filteredRooms.map((r) => {
                const primaryAdmin =
                  (Array.isArray(r.admins) && r.admins[0]) ||
                  r.createdBy ||
                  currentUser;
                const creatorName = primaryAdmin?.name || 'Admin';
                const adminNames =
                  Array.isArray(r.admins) && r.admins.length > 0
                    ? r.admins.map((a) => a.name).join(', ')
                    : creatorName;
                const adminCount =
                  Array.isArray(r.adminIds) && r.adminIds.length > 0
                    ? r.adminIds.length
                    : r.admins?.length || 1;
                const displayMemberCount = Math.max(
                  Number(r.memberCount || 0),
                  Array.isArray(r.memberIds) ? r.memberIds.length : 0,
                  adminCount,
                );

                return (
                  <tr key={r.id}>
                    {/* 1. Community Name & Changeable Symbol */}
                    <td className="min-w-56">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            openManageRoomModal(r);
                            setSymbolEditOpenForRoom(true);
                          }}
                          title="Click to change Group Symbol"
                          className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:border-brand"
                        >
                          <span>{r.icon || '🎬'}</span>
                          <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] text-black opacity-0 transition group-hover:opacity-100">
                            <Edit3 size={9} />
                          </span>
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-extrabold text-white">{r.name}</p>
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase">
                              {r.topic || 'general'}
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

                    {/* 2. Creator & Room Admins */}
                    <td className="whitespace-nowrap">
                      <div className="leading-tight">
                        <p className="font-bold text-white">{creatorName}</p>
                        <p
                          className="max-w-44 truncate text-[10px] font-semibold text-brand"
                          title={adminNames}
                        >
                          <Crown size={10} className="mr-1 inline" />
                          {adminCount} Admin{adminCount > 1 ? 's' : ''}: {adminNames}
                        </p>
                      </div>
                    </td>

                    {/* 3. Created Date */}
                    <td className="whitespace-nowrap text-zinc-300">
                      {formatAdminDate(r.createdAt)}
                    </td>

                    {/* 4. Total Users in Chat Room (Clickable to inspect & block users/admins) */}
                    <td className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openManageRoomModal(r)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-extrabold text-brand transition hover:bg-brand hover:text-black"
                        title="View all users & admins in this chat room"
                      >
                        <Users size={12} />
                        {displayMemberCount.toLocaleString('en-IN')} users
                      </button>
                    </td>

                    {/* 5. Top-Level Posts Count (Replies Excluded!) */}
                    <td className="whitespace-nowrap">
                      <div className="inline-flex flex-col">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-extrabold text-white">
                          <MessageSquare size={12} className="text-brand" />
                          {Number(r.messageCount || 0).toLocaleString('en-IN')} posts
                        </span>
                        <span className="mt-0.5 text-[9px] text-zinc-500">
                          Top-level only (no replies)
                        </span>
                      </div>
                    </td>

                    {/* 6. Status Badge */}
                    <td className="whitespace-nowrap">
                      <span
                        className={`admin-status-badge ${
                          r.isLocked ? 'admin-status-amber' : 'admin-status-emerald'
                        }`}
                      >
                        {r.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                        {r.isLocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>

                    {/* 7. Actions */}
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openManageRoomModal(r)}
                          className="admin-btn admin-btn-secondary"
                          title="Inspect total users, Room Admins, change symbol, or block users"
                        >
                          <Users size={12} className="text-brand" /> Users & Block
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleRoomLock(r)}
                          className={`admin-btn ${
                            r.isLocked ? 'admin-btn-emerald' : 'admin-btn-amber'
                          }`}
                        >
                          {r.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                          {r.isLocked ? 'Unblock Room' : 'Block Room'}
                        </button>
                        <Link
                          to={`/community?room=${encodeURIComponent(r.slug || r.id)}`}
                          className="admin-btn admin-btn-secondary"
                          title="Open Community Chat"
                        >
                          <ExternalLink size={12} /> Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteRoom(r)}
                          className="admin-btn admin-btn-danger"
                        >
                          <Trash2 size={12} />
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

      {/* ==================== COMMUNITY USERS, ROOM ADMINS & BLOCKING MODAL ==================== */}
      {managingRoom && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4">
          <div className="studio-scroll relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0e131f] p-5 text-white shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setManagingRoom(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 pr-8">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setSymbolEditOpenForRoom((v) => !v)}
                  title="Click to change Group Symbol"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-3xl transition hover:scale-105"
                >
                  {managingRoom.icon || '🎬'}
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-lg font-extrabold text-white"
                    >
                      {managingRoom.name}
                    </h3>
                    <span
                      className={`admin-status-badge ${
                        managingRoom.isLocked ? 'admin-status-amber' : 'admin-status-emerald'
                      }`}
                    >
                      {managingRoom.isLocked ? 'Community Blocked' : 'Active Community'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {managingRoom.description || 'Manage community members, Room Admins, symbol, and blocking.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSymbolEditOpenForRoom((v) => !v)}
                  className="admin-btn admin-btn-secondary"
                >
                  <Edit3 size={12} /> Change Symbol
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onToggleRoomLock(managingRoom);
                    setManagingRoom((prev) =>
                      prev ? { ...prev, isLocked: !prev.isLocked } : null,
                    );
                  }}
                  className={`admin-btn ${
                    managingRoom.isLocked ? 'admin-btn-emerald' : 'admin-btn-amber'
                  }`}
                >
                  {managingRoom.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                  {managingRoom.isLocked ? 'Unblock Community' : 'Block Community'}
                </button>
              </div>
            </div>

            {/* Change Group Symbol Palette Inside Modal */}
            {symbolEditOpenForRoom && (
              <div className="mt-4 rounded-2xl border border-brand/30 bg-[#070a10] p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand">
                    Choose a New Group Symbol for {managingRoom.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSymbolEditOpenForRoom(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GROUP_SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleChangeRoomSymbol(managingRoom, sym)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                        managingRoom.icon === sym
                          ? 'scale-110 border border-brand bg-brand/25'
                          : 'border border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Metrics Summary Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#070a10] p-3">
                <p className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  Total Users in Room
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {roomMembersData.totalMembers}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070a10] p-3">
                <p className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  Room Admins
                </p>
                <p className="mt-1 text-xl font-black text-brand">
                  {roomMembersData.admins.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070a10] p-3">
                <p className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  Top-Level Posts
                </p>
                <p className="mt-1 text-xl font-black text-emerald-400">
                  {managingRoom.messageCount || 0}
                </p>
                <p className="text-[9px] text-zinc-500">Replies excluded</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#070a10] p-3">
                <p className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  Blocked Users
                </p>
                <p className="mt-1 text-xl font-black text-rose-400">
                  {roomMembersData.blockedUsers.length}
                </p>
              </div>
            </div>

            {/* Notice Banner */}
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <ShieldAlert size={16} className="shrink-0 text-brand" />
              <span>
                Blocking any <b>User</b> or <b>Room Admin</b> below immediately revokes their membership/admin role in this community and <b>permanently deletes all of their posts</b>.
              </span>
            </div>

            {/* Filter Users in Room */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold tracking-wider text-zinc-300 uppercase">
                Users & Room Admins in {managingRoom.name} ({filteredModalMembers.length})
              </h4>
              <div className="relative w-full sm:w-64">
                <Search
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={memberFilterQ}
                  onChange={(e) => setMemberFilterQ(e.target.value)}
                  placeholder="Search user in this room..."
                  className="w-full rounded-xl border border-white/10 bg-[#070a10] py-1.5 pr-3 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            {/* Members & Room Admins Table */}
            <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto pr-1">
              {roomMembersLoading ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Loading users in this chat room...
                </div>
              ) : filteredModalMembers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-8 text-center text-xs text-zinc-500">
                  No users found in this chat room.
                </div>
              ) : (
                filteredModalMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        style={{ backgroundColor: m.avatarColor || '#f5b942' }}
                        className="keep-white flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                      >
                        {(m.name || 'U')[0].toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-extrabold text-white">{m.name}</p>
                          {m.isRoomAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-brand/20 px-2 py-0.5 text-[10px] font-extrabold text-brand">
                              <Crown size={10} /> Room Admin
                            </span>
                          )}
                          {m.isCreator && (
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              Creator
                            </span>
                          )}
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase">
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {m.email || 'Member'} • <b className="text-white">{m.postsCount || 0} posts</b>
                          {m.repliesCount ? ` (${m.repliesCount} replies)` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMemberAdminRole(m)}
                        className="admin-btn admin-btn-secondary"
                      >
                        <Crown size={12} className="text-brand" />
                        {m.isRoomAdmin ? 'Remove Admin' : 'Make Room Admin'}
                      </button>

                      {m.role !== 'superadmin' && (
                        <button
                          type="button"
                          disabled={blockingUserId === m.id}
                          onClick={() => handleBlockUserOrRoomAdmin(m)}
                          className="admin-btn admin-btn-danger"
                          title="Block this user/admin and permanently delete all their posts"
                        >
                          <Ban size={12} />
                          {blockingUserId === m.id
                            ? 'Blocking...'
                            : m.isRoomAdmin
                              ? 'Block Admin & Delete Posts'
                              : 'Block User & Delete Posts'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Blocked Users List */}
            {roomMembersData.blockedUsers.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <h4 className="mb-2 text-xs font-extrabold tracking-wider text-rose-400 uppercase">
                  Blocked Users in This Community ({roomMembersData.blockedUsers.length})
                </h4>
                <div className="space-y-1.5">
                  {roomMembersData.blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center justify-between rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{bu.name}</p>
                        <p className="text-[10px] text-zinc-400">{bu.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblockUser(bu)}
                        className="admin-btn admin-btn-emerald"
                      >
                        <Check size={12} /> Unblock User
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
