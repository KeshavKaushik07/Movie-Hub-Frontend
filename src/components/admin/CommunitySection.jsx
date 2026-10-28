import { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  PlusCircle,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'manage'; // 'create' | 'manage'

  const [subTab, setSubTab] = useState(urlTab);
  const [searchQ, setSearchQ] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked'
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(true);

  useEffect(() => {
    setSubTab(searchParams.get('tab') || 'manage');
  }, [searchParams]);

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

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

  const activeRoomsCount = (commRooms || []).filter((r) => !r.isLocked).length;
  const blockedRoomsCount = (commRooms || []).filter((r) => r.isLocked).length;

  const filteredRooms = (commRooms || []).filter((r) => {
    if (roomStatusFilter === 'active' && r.isLocked) return false;
    if (roomStatusFilter === 'blocked' && !r.isLocked) return false;
    if (topicFilter && (r.topic || 'general') !== topicFilter) return false;
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
      {/* Frozen Inner Selection & Filter Tabs Bar */}
      <div className="admin-sticky-bar">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Primary View Selection Tabs */}
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
                  <MessageSquare size={13} /> Manage Communities ({commRooms.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('create')}
                  className={`admin-btn ${
                    subTab === 'create'
                      ? 'admin-btn-primary'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <PlusCircle size={13} /> Create Community Room
                </button>
              </div>

              {subTab === 'manage' && (
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] p-1">
                  {[
                    { key: 'all', label: `All (${commRooms.length})` },
                    { key: 'active', label: `Active (${activeRoomsCount})` },
                    { key: 'blocked', label: `Blocked (${blockedRoomsCount})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setRoomStatusFilter(f.key)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        roomStatusFilter === f.key
                          ? 'bg-brand/20 font-extrabold text-brand'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {subTab === 'manage' && (
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search communities by name or creator..."
                  className="w-full rounded-xl border border-white/10 bg-[#070a10] py-2 pr-8 pl-9 text-xs text-white focus:border-brand focus:outline-none"
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
            )}
          </div>

          {/* Topic Filter Tabs */}
          {subTab === 'manage' && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2.5">
              <span className="mr-1 text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                Topic Filter:
              </span>
              {[
                { value: '', label: 'All Topics' },
                ...COMMUNITY_TOPICS.map((t) => ({ value: t.value, label: t.label })),
              ].map((t) => {
                const active = topicFilter === t.value;
                return (
                  <button
                    key={t.value || 'all'}
                    type="button"
                    onClick={() => setTopicFilter(t.value)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? 'bg-brand font-extrabold text-black shadow-sm shadow-brand/20'
                        : 'border border-white/10 bg-[#070a10] text-zinc-300 hover:border-brand/40 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== OPTION 1: CREATE COMMUNITY ROOM VIEW ==================== */}
      {subTab === 'create' ? (
        <form
          onSubmit={async (e) => {
            await onCreateRoom(e);
            handleSwitchTab('manage');
          }}
          className="rounded-2xl border border-brand/30 bg-[#0e131f] p-5 shadow-xl sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
                <Sparkles size={16} className="text-brand" />
                Create Official Community Chat Room
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Choose a custom group symbol, name, topic, and rules. You will automatically be assigned as the Room Admin and first member.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchTab('manage')}
              className="admin-btn admin-btn-secondary"
            >
              View All {commRooms.length} Communities
            </button>
          </div>

          <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#070a10] p-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-3xl shadow-md">
              {newRoomForm.icon || '🎬'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-extrabold text-white">
                  {newRoomForm.name.trim() || 'Your New Community Name'}
                </p>
                <span className="rounded bg-brand/20 px-2 py-0.5 text-[10px] font-extrabold text-brand uppercase">
                  {newRoomForm.topic || 'general'}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">
                {newRoomForm.description.trim() ||
                  'Community description and guidelines will appear here...'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Group Symbol
              </label>
              <button
                type="button"
                onClick={() => setSymbolPickerOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-white transition hover:border-brand"
              >
                <span className="text-lg">{newRoomForm.icon || '🎬'}</span>
                <span className="text-xs text-zinc-300">
                  {symbolPickerOpen ? 'Hide Symbols' : 'Change Symbol'}
                </span>
              </button>
            </div>

            <div className="sm:col-span-5">
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Community Name *
              </label>
              <input
                required
                placeholder="e.g. Tollywood & Pan-India Club"
                value={newRoomForm.name}
                onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Community Topic
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMUNITY_TOPICS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNewRoomForm({ ...newRoomForm, topic: t.value })}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      (newRoomForm.topic || 'general') === t.value
                        ? 'bg-brand font-extrabold text-black'
                        : 'border border-white/10 bg-[#070a10] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-12">
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Community Description & Rules
              </label>
              <textarea
                rows={2}
                placeholder="Describe what members can discuss in this community lounge..."
                value={newRoomForm.description}
                onChange={(e) =>
                  setNewRoomForm({ ...newRoomForm, description: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {symbolPickerOpen && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#070a10] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  Choose Group Symbol ({GROUP_SYMBOLS.length} symbols available)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setNewRoomForm({ ...newRoomForm, icon: sym })}
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

          <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
            <button type="submit" className="admin-btn admin-btn-primary px-6 py-2.5">
              <Plus size={14} /> Create Official Community Room
            </button>
          </div>
        </form>
      ) : (
        /* ==================== OPTION 2: MANAGE COMMUNITIES TABLE VIEW ==================== */
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs text-zinc-400">
              Showing <b className="text-white">{filteredRooms.length}</b> of{' '}
              <b className="text-white">{commRooms.length}</b> communities • Click{' '}
              <b className="text-brand">Users & Block</b> on any row to inspect members, Room Admins, or block a user/admin.
            </p>
          </div>

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
                      No communities match your current filter.
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
                        <td className="max-w-64 overflow-hidden">
                          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
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
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <p className="truncate font-extrabold text-white" title={r.name}>
                                  {r.name}
                                </p>
                                <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase">
                                  {r.topic || 'general'}
                                </span>
                              </div>
                              {r.description && (
                                <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                                  {r.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

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

                        <td className="whitespace-nowrap text-zinc-300">
                          {formatAdminDate(r.createdAt)}
                        </td>

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

                        <td className="whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openManageRoomModal(r)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Inspect total users, Room Admins, change symbol, or block users"
                            >
                              <Users size={12} className="text-brand" /> Users & Block
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleRoomLock(r)}
                              className={`admin-btn admin-btn-sm ${
                                r.isLocked ? 'admin-btn-emerald' : 'admin-btn-amber'
                              }`}
                            >
                              {r.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                              {r.isLocked ? 'Unblock' : 'Block'}
                            </button>
                            <Link
                              to={`/community?room=${encodeURIComponent(r.slug || r.id)}`}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Open Community Chat"
                            >
                              <ExternalLink size={12} /> Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteRoom(r)}
                              className="admin-btn admin-btn-danger admin-btn-sm px-2"
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
        </div>
      )}

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
                    {managingRoom.description ||
                      'Manage community members, Room Admins, symbol, and blocking.'}
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

            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <ShieldAlert size={16} className="shrink-0 text-brand" />
              <span>
                Blocking any user or Room Admin removes them from{' '}
                <b>{managingRoom.name}</b> and permanently deletes all of their posts and replies in this community.
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold tracking-wider text-zinc-300 uppercase">
                  Community Members & Room Admins ({filteredModalMembers.length})
                </h4>
                <div className="relative w-60">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={memberFilterQ}
                    onChange={(e) => setMemberFilterQ(e.target.value)}
                    placeholder="Filter room members..."
                    className="w-full rounded-xl border border-white/10 bg-[#070a10] py-1.5 pr-3 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {roomMembersLoading ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Loading community users & Room Admins...
                </div>
              ) : filteredModalMembers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#070a10] py-6 text-center text-xs text-zinc-400">
                  No members found in this community.
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredModalMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#070a10] px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          style={{ backgroundColor: m.avatarColor || '#f5b942' }}
                          className="keep-white flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                        >
                          {(m.name || 'U')[0].toUpperCase()}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-extrabold text-white">
                              {m.name}
                            </span>
                            {m.isCreator && (
                              <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-black text-black uppercase">
                                Creator
                              </span>
                            )}
                            {m.isRoomAdmin && (
                              <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[9px] font-extrabold text-brand uppercase">
                                <Crown size={9} className="mr-0.5 inline" /> Room Admin
                              </span>
                            )}
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 uppercase">
                              {m.role || 'user'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            {m.email} • {m.postCount || 0} posts in room
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleMemberAdminRole(m)}
                          className="admin-btn admin-btn-secondary py-1 px-2.5 text-[11px]"
                        >
                          <Crown size={11} className="text-brand" />
                          {m.isRoomAdmin ? 'Remove Admin' : 'Make Room Admin'}
                        </button>
                        {m.id !== currentUser?.id && (
                          <button
                            type="button"
                            disabled={blockingUserId === m.id}
                            onClick={() => handleBlockUserOrRoomAdmin(m)}
                            className="admin-btn admin-btn-danger py-1 px-2.5 text-[11px]"
                          >
                            <Ban size={11} />
                            {blockingUserId === m.id ? 'Blocking...' : 'Block & Purge Posts'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {roomMembersData.blockedUsers.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
                <h4 className="text-xs font-extrabold tracking-wider text-rose-400 uppercase">
                  Blocked Users in {managingRoom.name} ({roomMembersData.blockedUsers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roomMembersData.blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs"
                    >
                      <span className="font-bold text-white">{bu.name}</span>
                      <button
                        type="button"
                        onClick={() => handleUnblockUser(bu)}
                        className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <Check size={10} className="mr-0.5 inline" /> Unblock
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
