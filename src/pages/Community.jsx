import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MessageSquare,
  Send,
  Heart,
  Reply,
  Film,
  Search,
  Lock,
  Trash2,
  X,
  Plus,
  ArrowLeft,
  RefreshCw,
  Users,
  UserPlus,
  UserCheck,
  LogOut,
  Crown,
  Ban,
  Check,
  Sparkles,
  Settings,
  ArrowRightLeft,
} from 'lucide-react';
import {
  communityApi,
  tmdb,
  GROUP_SYMBOLS,
  COMMUNITY_TOPICS,
} from '../services/api';
import { getTitlePath } from '../utils/formatters';
import { getInMemoryAccessToken } from '../services/backendApi';
import { BACKEND, ROLES, ROUTES } from '../config/constants';
import { notifyPatch } from '../utils/notify';
import SafeImage from '../components/ui/SafeImage';
import {
  CommunityRoomsListSkeleton,
  CommunityMessagesSkeleton,
  CommunityChatPaneSkeleton,
} from '../components/ui/Skeletons';

export default function Community() {
  const user = useSelector((s) => s.auth.user);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);
  const [searchParams] = useSearchParams();
  const requestedRoomParam = searchParams.get('room') || '';

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Left sidebar search & WhatsApp-style Create Community panel
  const [communitySearchQ, setCommunitySearchQ] = useState('');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [newCommunityForm, setNewCommunityForm] = useState({
    name: '',
    description: '',
    icon: '🎬',
    topic: 'general',
  });

  // Group Info / Members / Admins / Symbol Modal
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [roomMembersData, setRoomMembersData] = useState({
    totalMembers: 0,
    admins: [],
    members: [],
    blockedUsers: [],
  });
  const [editRoomForm, setEditRoomForm] = useState({
    name: '',
    description: '',
    icon: '🎬',
    topic: 'general',
  });
  const [savingRoomSettings, setSavingRoomSettings] = useState(false);
  const [memberSearchQ, setMemberSearchQ] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [joiningOrLeaving, setJoiningOrLeaving] = useState(false);

  // Chat messages & composer state
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [spoiler, setSpoiler] = useState(false);

  const [moviePickerOpen, setMoviePickerOpen] = useState(false);
  const [movieSearchQ, setMovieSearchQ] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [attachedMovie, setAttachedMovie] = useState(null);

  const [roomToDelete, setRoomToDelete] = useState(null);

  const messagesContainerRef = useRef(null);
  const lastMessageSigRef = useRef('');

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior,
        });
      }
    }, 50);
  }, []);

  // Strictly check whether the current user is an actual Group Admin of `activeRoom`
  // (Never fake membership/adminship just because `user.role === 'admin'`, so normal admins
  // can join and leave communities properly!)
  const isCurrentRoomAdmin = useMemo(() => {
    if (!user || !activeRoom) return false;
    const uid = String(user.id);
    if (activeRoom.isBlockedUser) return false;
    if (Array.isArray(activeRoom.adminIds) && activeRoom.adminIds.includes(uid)) {
      return true;
    }
    if (
      Array.isArray(activeRoom.admins) &&
      activeRoom.admins.some((a) => String(a.id || a._id) === uid)
    ) {
      return true;
    }
    return Boolean(activeRoom.isRoomAdmin);
  }, [user, activeRoom]);

  // Site Staff (`admin`/`superadmin`) or Group Admins can moderate settings/messages
  const canModerateRoom = Boolean(isCurrentRoomAdmin || isStaff);

  // Strictly check whether the current user has joined `activeRoom` (`memberIds` / `isMember`)
  const isCurrentRoomMember = useMemo(() => {
    if (!user || !activeRoom) return false;
    const uid = String(user.id);
    if (activeRoom.isBlockedUser) return false;
    if (Array.isArray(activeRoom.memberIds)) {
      return activeRoom.memberIds.includes(uid);
    }
    return Boolean(activeRoom.isMember);
  }, [user, activeRoom]);

  // Load Community Rooms
  const loadRooms = useCallback(
    async (silent = false) => {
      if (!silent) setRoomsLoading(true);
      try {
        const pub = await communityApi.listRooms({ _t: Date.now() });
        const list = Array.isArray(pub) ? pub : [];
        setRooms(list);

        setActiveRoom((prev) => {
          if (prev) {
            const updated = list.find((r) => r.id === prev.id);
            return updated ? { ...prev, ...updated } : prev;
          }
          if (requestedRoomParam) {
            const matched = list.find(
              (r) =>
                r.slug === requestedRoomParam.toLowerCase() ||
                r.id === requestedRoomParam,
            );
            if (matched) return matched;
          }
          return list.length > 0 ? list[0] : null;
        });
      } catch {
        /* ignore network blip */
      } finally {
        if (!silent) setRoomsLoading(false);
      }
    },
    [requestedRoomParam],
  );

  // Fetch messages for the active community
  const fetchRoomMessages = useCallback(
    async (roomId, { forceScroll = false, showSpinner = false } = {}) => {
      if (!roomId) return;
      if (showSpinner) setSyncing(true);
      try {
        const res = await communityApi.listMessages(roomId, {
          limit: 100,
          _t: Date.now(),
        });
        const fetched = Array.isArray(res?.messages) ? res.messages : [];
        const newSig = fetched
          .map((m) => `${m.id}:${m.likesCount || 0}:${m.updatedAt || ''}`)
          .join('|');

        const hadNewMessage = newSig !== lastMessageSigRef.current;
        const prevCount = lastMessageSigRef.current
          ? lastMessageSigRef.current.split('|').filter(Boolean).length
          : 0;

        if (hadNewMessage || forceScroll) {
          lastMessageSigRef.current = newSig;
          setMessages(fetched);
          if (forceScroll || fetched.length > prevCount) {
            scrollToLatest('smooth');
          }
        }
        if (res?.room) {
          setActiveRoom((prev) => (prev && prev.id === roomId ? { ...prev, ...res.room } : prev));
        }
      } catch {
        /* keep current messages on transient network blip */
      } finally {
        if (showSpinner) setSyncing(false);
      }
    },
    [scrollToLatest],
  );

  const loadRoomMembersInfo = useCallback(async (roomId) => {
    if (!roomId) return;
    setRoomDetailsLoading(true);
    try {
      const data = await communityApi.getRoomMembers(roomId);
      setRoomMembersData({
        totalMembers: data?.totalMembers || 0,
        admins: Array.isArray(data?.admins) ? data.admins : [],
        members: Array.isArray(data?.members) ? data.members : [],
        blockedUsers: Array.isArray(data?.blockedUsers) ? data.blockedUsers : [],
      });
      if (data?.room) {
        setActiveRoom((prev) => (prev && prev.id === roomId ? { ...prev, ...data.room } : prev));
        setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...data.room } : r)));
      }
    } catch {
      /* ignore */
    } finally {
      setRoomDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Communities & Live Group Chat | Movies Hub';
    loadRooms(false);
  }, [loadRooms]);

  // Sync edit form whenever activeRoom changes
  useEffect(() => {
    if (activeRoom) {
      setEditRoomForm({
        name: activeRoom.name || '',
        description: activeRoom.description || '',
        icon: activeRoom.icon || '🎬',
        topic: activeRoom.topic || 'general',
      });
    }
  }, [activeRoom?.id]); // eslint-disable-line

  // Poll + SSE stream for the active community
  useEffect(() => {
    const roomId = activeRoom?.id;
    if (!roomId) return;

    lastMessageSigRef.current = '';
    setMessagesLoading(true);
    fetchRoomMessages(roomId, { forceScroll: true, showSpinner: true }).finally(() =>
      setMessagesLoading(false),
    );

    const pollTimer = setInterval(() => {
      fetchRoomMessages(roomId, { forceScroll: false });
    }, 2000);

    const roomTimer = setInterval(() => {
      loadRooms(true);
    }, 5000);

    let eventSource = null;
    try {
      const token = getInMemoryAccessToken();
      const streamUrl = token
        ? `${BACKEND.URL}/community/rooms/${roomId}/stream?token=${encodeURIComponent(token)}`
        : `${BACKEND.URL}/community/rooms/${roomId}/stream`;

      eventSource = new EventSource(streamUrl, { withCredentials: true });
      eventSource.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (
            payload.event === 'new_message' ||
            payload.event === 'message_updated' ||
            payload.event === 'message_liked' ||
            payload.event === 'message_deleted' ||
            payload.event === 'user_blocked' ||
            payload.event === 'room_updated'
          ) {
            fetchRoomMessages(roomId, { forceScroll: payload.event === 'new_message' });
            loadRooms(true);
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* polling handles updates if SSE is unavailable */
    }

    return () => {
      clearInterval(pollTimer);
      clearInterval(roomTimer);
      if (eventSource) eventSource.close();
    };
  }, [activeRoom?.id, fetchRoomMessages, loadRooms]);

  // Filter communities by the search input bar
  const filteredRooms = useMemo(() => {
    const q = communitySearchQ.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.topic || '').toLowerCase().includes(q),
    );
  }, [rooms, communitySearchQ]);

  // WhatsApp-style Create Community handler (Available to ANY logged-in user or admin)
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!user) return;
    const cleanName = newCommunityForm.name.trim();
    if (!cleanName || creatingRoom) return;

    setCreatingRoom(true);
    try {
      const created = await communityApi.createRoom({
        name: cleanName,
        description: newCommunityForm.description.trim(),
        icon: newCommunityForm.icon || '🎬',
        topic: newCommunityForm.topic || 'general',
      });
      setNewCommunityForm({
        name: '',
        description: '',
        icon: '🎬',
        topic: 'general',
      });
      setCreatePanelOpen(false);
      await loadRooms(true);
      if (created) {
        setActiveRoom(created);
        setMobileChatOpen(true);
      }
      notifyPatch({
        type: 'success',
        title: 'Community Created',
        message: `You created "${cleanName}" and are now its Community Admin!`,
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Could Not Create Community',
        message: err.response?.data?.message || 'Please check the community name and try again.',
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  // Join Community (Required before chatting)
  const handleJoinCommunity = async (roomToJoin = activeRoom) => {
    if (!user || !roomToJoin || joiningOrLeaving) return;
    setJoiningOrLeaving(true);
    try {
      const updated = await communityApi.joinRoom(roomToJoin.id);
      if (updated) {
        setActiveRoom((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      }
      notifyPatch({
        type: 'success',
        title: 'Joined Community',
        message: `You joined "${roomToJoin.name}". You can now chat with the community!`,
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Cannot Join Community',
        message: err.response?.data?.message || 'Unable to join this community right now.',
      });
    } finally {
      setJoiningOrLeaving(false);
    }
  };

  // Leave Community (Works for regular members, normal admins, and room creators)
  const handleLeaveCommunity = async () => {
    if (!user || !activeRoom || joiningOrLeaving) return;
    setJoiningOrLeaving(true);
    const uid = String(user.id);
    try {
      const updated = await communityApi.leaveRoom(activeRoom.id);
      const applyLeftState = (r) => {
        if (!r) return r;
        const nextMemberIds = Array.isArray(r.memberIds)
          ? r.memberIds.filter((id) => String(id) !== uid)
          : [];
        const nextAdminIds = Array.isArray(r.adminIds)
          ? r.adminIds.filter((id) => String(id) !== uid)
          : [];
        const nextAdmins = Array.isArray(r.admins)
          ? r.admins.filter((a) => String(a.id || a._id) !== uid)
          : [];
        return {
          ...r,
          ...(updated || {}),
          memberIds: nextMemberIds,
          adminIds: nextAdminIds,
          admins: nextAdmins,
          memberCount: nextMemberIds.length,
          isMember: false,
          isRoomAdmin: false,
        };
      };

      setActiveRoom((prev) => (prev?.id === activeRoom.id ? applyLeftState(prev) : prev));
      setRooms((prev) =>
        prev.map((r) => (r.id === activeRoom.id ? applyLeftState(r) : r)),
      );
      setGroupInfoOpen(false);
      notifyPatch({
        type: 'info',
        title: 'Left Community',
        message: `You left "${activeRoom.name}". Click Join Community anytime to rejoin.`,
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || 'Could not leave community.',
      });
    } finally {
      setJoiningOrLeaving(false);
    }
  };

  // Send a message (Strictly safe against blank-page crashes)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom || sending) return;

    if (!isCurrentRoomMember) {
      notifyPatch({
        type: 'warning',
        title: 'Join Required',
        message: 'Please click "Join Community" first before sending messages.',
      });
      return;
    }

    const messageText = text.trim();
    const currentReply = replyTo;
    const currentMovie = attachedMovie;
    const currentSpoiler = spoiler;

    setSending(true);
    setText('');
    setReplyTo(null);
    setAttachedMovie(null);
    setSpoiler(false);

    try {
      const sent = await communityApi.sendMessage(activeRoom.id, {
        text: messageText,
        replyToId: currentReply?.id || undefined,
        spoiler: currentSpoiler,
        sharedTitle: currentMovie
          ? { tmdbId: currentMovie.id, type: currentMovie.type || 'movie' }
          : undefined,
      });

      if (sent && typeof sent === 'object' && sent.id) {
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
        scrollToLatest('smooth');
      }

      await Promise.all([
        fetchRoomMessages(activeRoom.id, { forceScroll: true }),
        loadRooms(true),
      ]);
    } catch (err) {
      setText(messageText);
      setReplyTo(currentReply);
      setAttachedMovie(currentMovie);
      setSpoiler(currentSpoiler);
      notifyPatch({
        type: 'error',
        title: 'Message Not Sent',
        message: err.response?.data?.message || 'Could not send message.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleToggleLike = async (msgId) => {
    if (!user || !activeRoom) return;
    try {
      const r = await communityApi.toggleLike(msgId);
      setMessages((prev) =>
        prev.map((x) => (x.id === msgId ? { ...x, likesCount: r.likesCount, liked: r.liked } : x)),
      );
      await fetchRoomMessages(activeRoom.id, { forceScroll: false });
    } catch {
      /* ignore */
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!activeRoom) return;
    try {
      await communityApi.deleteMessage(msgId);
      setMessages((prev) => prev.filter((x) => x.id !== msgId));
      await Promise.all([
        fetchRoomMessages(activeRoom.id, { forceScroll: false }),
        loadRooms(true),
      ]);
    } catch {
      /* ignore */
    }
  };

  const searchMoviesToAttach = async (e) => {
    e.preventDefault();
    if (!movieSearchQ.trim()) return;
    const res = await tmdb.search(movieSearchQ.trim());
    setMovieResults((res.items || res.results || []).slice(0, 6));
  };

  // Update Community Symbol / Name / Description (Group Admin or Site Admin)
  const handleSaveRoomSettings = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!activeRoom || savingRoomSettings) return;
    setSavingRoomSettings(true);
    try {
      const updated = await communityApi.updateRoom(activeRoom.id, {
        name: editRoomForm.name.trim() || activeRoom.name,
        description: editRoomForm.description.trim(),
        icon: editRoomForm.icon || '🎬',
        topic: editRoomForm.topic || 'general',
      });
      if (updated) {
        setActiveRoom((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      }
      notifyPatch({
        type: 'success',
        title: 'Community Updated',
        message: 'Updated community symbol and details!',
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Could not update community settings.',
      });
    } finally {
      setSavingRoomSettings(false);
    }
  };

  // Promote Member to Admin or Transfer Adminship
  const handlePromoteOrTransferAdmin = async (targetUserId, transfer = false) => {
    if (!activeRoom || !targetUserId) return;
    try {
      const updated = await communityApi.promoteOrTransferAdmin(activeRoom.id, {
        userId: targetUserId,
        transfer,
      });
      if (updated) {
        setActiveRoom((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      }
      await loadRoomMembersInfo(activeRoom.id);
      notifyPatch({
        type: 'success',
        title: transfer ? 'Adminship Transferred' : 'Co-Admin Added',
        message: transfer
          ? 'Community adminship has been transferred!'
          : 'Member promoted to Community Admin!',
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Role Update Failed',
        message: err.response?.data?.message || 'Could not update admin role.',
      });
    }
  };

  const handleDemoteAdmin = async (targetUserId) => {
    if (!activeRoom || !targetUserId) return;
    try {
      const updated = await communityApi.removeAdmin(activeRoom.id, targetUserId);
      if (updated) {
        setActiveRoom((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
        setRooms((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      }
      await loadRoomMembersInfo(activeRoom.id);
      notifyPatch({
        type: 'info',
        title: 'Admin Role Updated',
        message: 'Removed admin privileges for that member.',
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Cannot Remove Admin',
        message: err.response?.data?.message || 'At least one admin must remain in the community.',
      });
    }
  };

  const handleBlockUserInRoom = async (targetUser) => {
    if (!activeRoom || !targetUser) return;
    try {
      const res = await communityApi.blockUser(activeRoom.id, targetUser.id);
      if (res?.room) {
        setActiveRoom((prev) => (prev?.id === res.room.id ? { ...prev, ...res.room } : prev));
        setRooms((prev) => prev.map((r) => (r.id === res.room.id ? { ...r, ...res.room } : r)));
      }
      await Promise.all([
        loadRoomMembersInfo(activeRoom.id),
        fetchRoomMessages(activeRoom.id, { forceScroll: false }),
      ]);
      notifyPatch({
        type: 'success',
        title: 'User Blocked & Posts Deleted',
        message: `Blocked ${targetUser.name} and deleted ${res?.deletedMessagesCount || 0} of their posts.`,
      });
    } catch (err) {
      notifyPatch({
        type: 'error',
        title: 'Could Not Block User',
        message: err.response?.data?.message || 'Unable to block user.',
      });
    }
  };

  const handleUnblockUserInRoom = async (targetUser) => {
    if (!activeRoom || !targetUser) return;
    try {
      const res = await communityApi.unblockUser(activeRoom.id, targetUser.id);
      if (res?.room) {
        setActiveRoom((prev) => (prev?.id === res.room.id ? { ...prev, ...res.room } : prev));
        setRooms((prev) => prev.map((r) => (r.id === res.room.id ? { ...r, ...res.room } : r)));
      }
      await loadRoomMembersInfo(activeRoom.id);
      notifyPatch({
        type: 'success',
        title: 'User Unblocked',
        message: `${targetUser.name} can now join and participate again.`,
      });
    } catch {
      /* ignore */
    }
  };

  const handleSearchUsersForAdmin = async (qVal) => {
    setMemberSearchQ(qVal);
    if (!qVal.trim()) {
      setUserSearchResults([]);
      return;
    }
    const list = await communityApi.searchUsers(qVal.trim()).catch(() => []);
    setUserSearchResults(list.slice(0, 6));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-2.5 py-3 sm:px-6 sm:py-6">
      <div className="grid h-[calc(100vh-135px)] min-h-[520px] w-full max-w-full overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] shadow-2xl lg:h-[80vh] lg:grid-cols-12">
        {/* ==================== LEFT SIDEBAR: SEARCH BAR + COMMUNITY LIST (OR WHATSAPP CREATE PANEL) ==================== */}
        <aside
          className={`${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          } min-w-0 w-full max-w-full flex-col overflow-hidden border-white/10 bg-[#070a10]/60 lg:col-span-4 lg:border-r`}
        >
          {createPanelOpen ? (
            /* WhatsApp-Style Community Creation Panel */
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0e131f] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreatePanelOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <div>
                    <h2
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-sm font-extrabold text-white"
                    >
                      New Community
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      Create a group & become Community Admin
                    </p>
                  </div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-xl">
                  {newCommunityForm.icon}
                </span>
              </div>

              <form
                onSubmit={handleCreateCommunity}
                className="studio-scroll flex-1 space-y-4 overflow-y-auto p-4"
              >
                {/* Group Symbol Picker */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                    Choose Community Symbol
                  </label>
                  <div className="grid grid-cols-8 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                    {GROUP_SYMBOLS.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setNewCommunityForm((p) => ({ ...p, icon: sym }))}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-base transition ${
                          newCommunityForm.icon === sym
                            ? 'scale-110 border border-brand bg-brand/25 shadow-sm'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Community Name */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                    Community Name *
                  </label>
                  <input
                    required
                    maxLength={80}
                    value={newCommunityForm.name}
                    onChange={(e) =>
                      setNewCommunityForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Sci-Fi & Thriller Theorists"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
                  />
                </div>

                {/* Topic / Category */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                    Community Topic (Suggested or Custom)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={
                        COMMUNITY_TOPICS.some((t) => t.value === newCommunityForm.topic)
                          ? newCommunityForm.topic
                          : 'custom'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setNewCommunityForm((p) => ({ ...p, topic: val }));
                        }
                      }}
                      className="w-1/2 rounded-xl border border-white/10 bg-[#0e131f] px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
                    >
                      {COMMUNITY_TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                      <option value="custom">✏️ Custom Topic...</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Custom topic..."
                      value={newCommunityForm.topic || ''}
                      onChange={(e) =>
                        setNewCommunityForm((p) => ({
                          ...p,
                          topic: e.target.value.toLowerCase().trim(),
                        }))
                      }
                      className="w-1/2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
                    Community Description & Rules
                  </label>
                  <textarea
                    rows={3}
                    maxLength={350}
                    value={newCommunityForm.description}
                    onChange={(e) =>
                      setNewCommunityForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="What is this community about? Mention topics, languages, or spoiler rules..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-brand/25 bg-brand/10 p-3 text-[11px] leading-relaxed text-zinc-200">
                  <b className="text-brand">Admin Privileges:</b> You will automatically become the
                  Community Admin & first Member. You can add multiple co-admins, transfer adminship, or
                  change the group symbol anytime.
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCreatePanelOpen(false)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingRoom || !newCommunityForm.name.trim()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-extrabold text-black shadow-lg shadow-brand/20 disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    {creatingRoom ? 'Creating...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Left Sidebar: Title + New Community Button -> Search Input Bar -> Community List */
            <>
              <div className="min-w-0 w-full border-b border-white/10 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h1
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="truncate text-base font-extrabold text-white sm:text-lg"
                    >
                      Communities
                    </h1>
                    <p className="text-[11px] text-zinc-400">
                      {rooms.length} active cinema communities
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => setCreatePanelOpen(true)}
                        className="flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-extrabold text-black shadow-sm transition hover:brightness-105"
                      >
                        <Plus size={14} />
                        <span>New Community</span>
                      </button>
                    ) : (
                      <Link
                        to={ROUTES.LOGIN}
                        className="flex items-center gap-1 rounded-xl border border-brand/40 bg-brand/15 px-2.5 py-1.5 text-[11px] font-bold text-brand"
                      >
                        <Plus size={13} /> Create
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        loadRooms(true);
                        if (activeRoom?.id) fetchRoomMessages(activeRoom.id, { showSpinner: true });
                      }}
                      title="Sync communities"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-brand"
                    >
                      <RefreshCw size={13} className={syncing ? 'animate-spin text-brand' : ''} />
                    </button>
                  </div>
                </div>

                {/* Search Community Input Bar Directly Above Community List */}
                <div className="relative mt-3">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={communitySearchQ}
                    onChange={(e) => setCommunitySearchQ(e.target.value)}
                    placeholder="Search communities by name or topic..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-8 pl-9 text-xs text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
                  />
                  {communitySearchQ && (
                    <button
                      type="button"
                      onClick={() => setCommunitySearchQ('')}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-zinc-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable List of Communities Below Search Bar */}
              <div className="studio-scroll min-w-0 w-full flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto p-2.5">
                {roomsLoading && filteredRooms.length === 0 ? (
                  <CommunityRoomsListSkeleton count={6} />
                ) : filteredRooms.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center px-4 text-center text-xs text-zinc-400">
                    <MessageSquare size={24} className="mb-2 text-zinc-600" />
                    <p className="font-bold text-white">No communities found</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {communitySearchQ
                        ? `No community matches "${communitySearchQ}".`
                        : 'Create the first community using the button above!'}
                    </p>
                  </div>
                ) : (
                  filteredRooms.map((r) => {
                    const active = activeRoom?.id === r.id;
                    const uid = user ? String(user.id) : null;
                    const userIsAdmin =
                      uid &&
                      !r.isBlockedUser &&
                      (r.isRoomAdmin ||
                        (Array.isArray(r.adminIds) && r.adminIds.includes(uid)));
                    const userIsMember =
                      uid &&
                      !r.isBlockedUser &&
                      (Array.isArray(r.memberIds)
                        ? r.memberIds.includes(uid)
                        : Boolean(r.isMember));

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setActiveRoom(r);
                          setMobileChatOpen(true);
                        }}
                        className={`flex w-full max-w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl p-2.5 text-left transition active:scale-[0.99] sm:p-3 ${
                          active
                            ? 'border border-brand/40 bg-brand/15 shadow-md'
                            : 'border border-transparent hover:bg-white/5'
                        }`}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl">
                          {r.icon || '🎬'}
                        </span>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex min-w-0 items-center justify-between gap-1.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p
                                className={`truncate text-xs font-extrabold ${
                                  active ? 'text-brand' : 'text-white'
                                }`}
                              >
                                {r.name}
                              </p>
                              {r.isLocked && (
                                <Lock size={11} className="shrink-0 text-amber-400" title="Locked" />
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-zinc-400">
                              {r.messageCount || 0} posts
                            </span>
                          </div>

                          <p className="mt-0.5 block w-full truncate text-[11px] text-zinc-400">
                            {r.lastMessagePreview?.text
                              ? `${
                                  r.lastMessagePreview.senderName
                                    ? `${r.lastMessagePreview.senderName}: `
                                    : ''
                                }${r.lastMessagePreview.text}`
                              : r.description || 'Tap to view community chat'}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-zinc-400">
                              <Users size={10} /> {r.memberCount || 0} members
                            </span>
                            {userIsAdmin && userIsMember ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-brand/20 px-1.5 py-0.5 font-extrabold text-brand">
                                <Crown size={10} /> Admin
                              </span>
                            ) : userIsMember ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-400">
                                <Check size={10} /> Joined
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>

        {/* ==================== RIGHT CHAT SECTION ==================== */}
        <section
          className={`${
            mobileChatOpen ? 'flex' : 'hidden lg:flex'
          } min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden lg:col-span-8`}
        >
          {activeRoom ? (
            <>
              {/* Top Community Chat Bar */}
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0b101b] px-3.5 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white lg:hidden"
                  >
                    <ArrowLeft size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGroupInfoOpen(true);
                      loadRoomMembersInfo(activeRoom.id);
                    }}
                    title="Community Info & Settings"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl transition hover:border-brand"
                  >
                    {activeRoom.icon || '🎬'}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-extrabold text-white">
                        {activeRoom.name}
                      </h2>
                      {activeRoom.isLocked && (
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-300 uppercase">
                          Blocked / Locked
                        </span>
                      )}
                      {isCurrentRoomAdmin && isCurrentRoomMember && (
                        <span className="hidden items-center gap-1 rounded-md bg-brand/20 px-1.5 py-0.5 text-[9px] font-extrabold text-brand uppercase sm:inline-flex">
                          <Crown size={10} /> Group Admin
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-zinc-400">
                      {activeRoom.memberCount || 0} members • {activeRoom.messageCount || 0} posts
                      {activeRoom.description ? ` • ${activeRoom.description}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right Header Controls: Join / Leave, Group Info/Admins, Delete */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {user && !isCurrentRoomMember && !activeRoom.isBlockedUser && (
                    <button
                      type="button"
                      disabled={joiningOrLeaving}
                      onClick={() => handleJoinCommunity(activeRoom)}
                      className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-[11px] font-extrabold text-black shadow-sm transition hover:brightness-105 disabled:opacity-50"
                    >
                      <UserPlus size={12} />
                      <span>{joiningOrLeaving ? 'Joining...' : 'Join Community'}</span>
                    </button>
                  )}

                  {user && isCurrentRoomMember && (
                    <div className="flex items-center gap-1.5">
                      <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300 sm:inline-flex">
                        <UserCheck size={11} /> Joined
                      </span>
                      <button
                        type="button"
                        disabled={joiningOrLeaving}
                        onClick={handleLeaveCommunity}
                        title="Leave this community"
                        className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <LogOut size={11} />
                        <span>Leave</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setGroupInfoOpen(true);
                      loadRoomMembersInfo(activeRoom.id);
                    }}
                    className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-brand hover:text-white"
                  >
                    {canModerateRoom ? (
                      <Settings size={12} className="text-brand" />
                    ) : (
                      <Users size={12} className="text-brand" />
                    )}
                    <span className="hidden sm:inline">
                      {canModerateRoom ? 'Manage Group' : 'Group Info'}
                    </span>
                  </button>

                  {canModerateRoom && (
                    <button
                      type="button"
                      onClick={() => setRoomToDelete(activeRoom)}
                      title="Delete Community"
                      className="flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-bold text-rose-400 transition hover:bg-rose-500/25"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages List */}
              <div
                ref={messagesContainerRef}
                className="studio-scroll min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5"
              >
                {messagesLoading && messages.length === 0 ? (
                  <CommunityMessagesSkeleton count={5} />
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-xs text-zinc-500">
                    <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-2xl">
                      {activeRoom.icon || '🎬'}
                    </span>
                    <p className="text-sm font-extrabold text-white">
                      Welcome to {activeRoom.name}
                    </p>
                    <p className="mt-1 max-w-md text-xs text-zinc-400">
                      {activeRoom.description ||
                        'No posts in this community yet. Join the community and start the conversation below!'}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderId = String(m.sender?.id || '');
                    const isMine = user && senderId === String(user.id);
                    const senderIsGroupAdmin =
                      (Array.isArray(activeRoom.adminIds) &&
                        activeRoom.adminIds.includes(senderId)) ||
                      ['admin', 'superadmin'].includes(m.sender?.role);

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] break-words rounded-2xl border p-3 sm:max-w-lg ${
                            isMine
                              ? 'border-brand/35 bg-brand/10'
                              : 'border-white/10 bg-white/[0.04]'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-brand">
                                {m.sender?.name || 'Member'}
                              </span>
                              {senderIsGroupAdmin && (
                                <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[9px] font-black text-brand uppercase">
                                  Admin
                                </span>
                              )}
                              {m.isReply && (
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400">
                                  Reply
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>

                          {m.replyTo?.textSnippet && (
                            <div className="mb-2 rounded-lg border-l-2 border-brand bg-black/30 px-2.5 py-1 text-[11px] text-zinc-400">
                              <b>@{m.replyTo.senderName || 'Member'}:</b> {m.replyTo.textSnippet}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-100">
                            {m.text}
                          </p>

                          {m.sharedTitle?.tmdbId && (
                            <Link
                              to={getTitlePath(
                                m.sharedTitle,
                                m.sharedTitle.subType || m.sharedTitle.type || 'movie',
                                'overview',
                              )}
                              className="mt-2.5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#070a10] p-2 hover:border-brand"
                            >
                              <SafeImage
                                src={m.sharedTitle.posterUrl}
                                alt={m.sharedTitle.title}
                                size="w185"
                                variant="poster"
                                className="h-14 w-10 shrink-0 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">
                                  {m.sharedTitle.title}
                                </p>
                                <p className="text-[10px] text-brand">
                                  {m.sharedTitle.year} • ★{' '}
                                  {Number(m.sharedTitle.rating || 0).toFixed(1)}
                                </p>
                              </div>
                            </Link>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(m.id)}
                              className={`flex items-center gap-1 ${
                                m.liked ? 'text-rose-400' : 'hover:text-white'
                              }`}
                            >
                              <Heart size={11} fill={m.liked ? 'currentColor' : 'none'} />{' '}
                              {m.likesCount || 0}
                            </button>
                            {user && isCurrentRoomMember && (
                              <button
                                type="button"
                                onClick={() => setReplyTo(m)}
                                className="flex items-center gap-1 hover:text-white"
                              >
                                <Reply size={11} /> Reply
                              </button>
                            )}
                            {(isMine || canModerateRoom) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                title="Delete message"
                                className="text-zinc-500 hover:text-rose-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Attach Movie Picker */}
              {moviePickerOpen && isCurrentRoomMember && (
                <div className="border-t border-white/10 bg-[#070a10] p-3">
                  <form onSubmit={searchMoviesToAttach} className="flex gap-2">
                    <input
                      value={movieSearchQ}
                      onChange={(e) => setMovieSearchQ(e.target.value)}
                      placeholder="Search movie or series to recommend..."
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-black"
                    >
                      Find
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoviePickerOpen(false)}
                      className="p-1.5 text-zinc-400"
                    >
                      <X size={15} />
                    </button>
                  </form>
                  {movieResults.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {movieResults.map((mv) => (
                        <button
                          key={mv.id}
                          type="button"
                          onClick={() => {
                            setAttachedMovie(mv);
                            setMoviePickerOpen(false);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white hover:border-brand"
                        >
                          🎬 {mv.title || mv.name} ({mv.year})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Chat Composer / Join Prompt */}
              <div className="border-t border-white/10 bg-[#0b101b] p-3">
                {(replyTo || attachedMovie) && isCurrentRoomMember && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    {replyTo && (
                      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-zinc-200">
                        Replying to <b>@{replyTo.sender?.name || 'Member'}</b>
                        <button type="button" onClick={() => setReplyTo(null)}>
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {attachedMovie && (
                      <span className="flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-brand">
                        🎬 <b>{attachedMovie.title || attachedMovie.name}</b>
                        <button type="button" onClick={() => setAttachedMovie(null)}>
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {!user ? (
                  <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-400">
                    <Lock size={14} /> Please{' '}
                    <Link to={ROUTES.LOGIN} className="font-bold text-brand underline">
                      log in
                    </Link>{' '}
                    to join this community and chat.
                  </div>
                ) : activeRoom.isBlockedUser ? (
                  <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-rose-400">
                    <Ban size={14} /> You have been blocked from posting in this community.
                  </div>
                ) : activeRoom.isLocked && !canModerateRoom ? (
                  <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-amber-400">
                    <Lock size={14} /> This community is currently locked by moderators.
                  </div>
                ) : !isCurrentRoomMember ? (
                  /* Requirement a.2: One can chat ONLY after joining the community */
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white">
                        Join {activeRoom.name} to start chatting
                      </p>
                      <p className="text-[11px] text-zinc-300">
                        Click Join Community to become a member and post messages or replies.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={joiningOrLeaving}
                      onClick={() => handleJoinCommunity(activeRoom)}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-black shadow-md shadow-brand/20 transition hover:brightness-105 disabled:opacity-50"
                    >
                      <UserPlus size={14} />
                      <span>{joiningOrLeaving ? 'Joining...' : 'Join Community to Chat'}</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMoviePickerOpen((v) => !v)}
                      title="Attach a Movie or Web Series"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-brand hover:border-brand"
                    >
                      <Film size={16} />
                    </button>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={
                        replyTo
                          ? `Reply to @${replyTo.sender?.name || 'Member'}...`
                          : `Post a message in ${activeRoom.name}...`
                      }
                      className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !text.trim()}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : roomsLoading ? (
            <CommunityChatPaneSkeleton />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-zinc-400">
              <MessageSquare size={32} className="mb-2 text-brand" />
              <p className="text-sm font-bold text-white">Select or Create a Community</p>
              <p className="mt-1 text-xs">
                Choose a community from the list on the left or create your own community.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ==================== COMMUNITY INFO, SYMBOL & ADMINS MODAL ==================== */}
      {groupInfoOpen && activeRoom && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4">
          <div className="studio-scroll relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0e131f] p-5 text-white shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setGroupInfoOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4 pr-8">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-3xl">
                {activeRoom.icon || '🎬'}
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="truncate text-lg font-extrabold text-white"
                >
                  {activeRoom.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {roomMembersData.totalMembers || activeRoom.memberCount || 0} Members •{' '}
                  {activeRoom.messageCount || 0} Posts (replies excluded)
                </p>
              </div>
              {user && isCurrentRoomMember ? (
                <button
                  type="button"
                  disabled={joiningOrLeaving}
                  onClick={handleLeaveCommunity}
                  className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                >
                  <LogOut size={13} /> Leave Community
                </button>
              ) : user && !activeRoom.isBlockedUser ? (
                <button
                  type="button"
                  disabled={joiningOrLeaving}
                  onClick={() => handleJoinCommunity(activeRoom)}
                  className="flex items-center gap-1 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-extrabold text-black hover:brightness-105 disabled:opacity-50"
                >
                  <UserPlus size={13} /> Join Community
                </button>
              ) : null}
            </div>

            {/* Admin Section: Change Community Symbol & Edit Community Info */}
            {canModerateRoom && (
              <form
                onSubmit={handleSaveRoomSettings}
                className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#070a10]/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-brand uppercase">
                    <Crown size={13} /> Community Admin Settings & Group Symbol
                  </p>
                  <button
                    type="submit"
                    disabled={savingRoomSettings}
                    className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-extrabold text-black shadow-sm hover:brightness-105 disabled:opacity-50"
                  >
                    {savingRoomSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-zinc-400">
                    Select Group Symbol
                  </label>
                  <div className="grid grid-cols-10 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    {GROUP_SYMBOLS.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setEditRoomForm((p) => ({ ...p, icon: sym }))}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                          editRoomForm.icon === sym
                            ? 'scale-110 border border-brand bg-brand/25'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-zinc-400">
                      Community Name
                    </label>
                    <input
                      value={editRoomForm.name}
                      onChange={(e) =>
                        setEditRoomForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-zinc-400">
                      Description
                    </label>
                    <input
                      value={editRoomForm.description}
                      onChange={(e) =>
                        setEditRoomForm((p) => ({ ...p, description: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* Add / Transfer Admin Search Bar for Group Admins */}
            {canModerateRoom && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#070a10]/60 p-4">
                <p className="text-xs font-extrabold text-white">
                  Add Co-Admin or Transfer Adminship
                </p>
                <p className="text-[11px] text-zinc-400">
                  Search any user or use the member list below to assign multiple admins or transfer admin rights.
                </p>
                <div className="relative mt-2">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={memberSearchQ}
                    onChange={(e) => handleSearchUsersForAdmin(e.target.value)}
                    placeholder="Search user by name or email to make Admin..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                  />
                </div>
                {userSearchResults.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {userSearchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{u.name}</p>
                          <p className="truncate text-[10px] text-zinc-400">{u.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePromoteOrTransferAdmin(u.id, false)}
                            className="rounded-lg bg-brand/20 px-2.5 py-1 text-[11px] font-extrabold text-brand hover:bg-brand hover:text-black"
                          >
                            + Make Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromoteOrTransferAdmin(u.id, true)}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-200 hover:border-brand"
                          >
                            Transfer Admin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members & Admins Directory */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
                  Community Admins & Members ({roomMembersData.members.length})
                </h4>
              </div>

              {roomDetailsLoading ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  Loading community members...
                </div>
              ) : roomMembersData.members.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-6 text-center text-xs text-zinc-500">
                  No members in this community yet. Click Join Community to be the first member!
                </div>
              ) : (
                <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {roomMembersData.members.map((m) => {
                    const isSelf = user && String(m.id) === String(user.id);
                    return (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            style={{ backgroundColor: m.avatarColor || '#f5b942' }}
                            className="keep-white flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                          >
                            {(m.name || 'U')[0].toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-bold text-white">
                                {m.name} {isSelf && <span className="text-zinc-400">(You)</span>}
                              </p>
                              {m.isRoomAdmin && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-brand/20 px-1.5 py-0.5 text-[10px] font-extrabold text-brand">
                                  <Crown size={10} /> Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400">
                              {m.postsCount || 0} posts
                              {m.repliesCount ? ` • ${m.repliesCount} replies` : ''}
                            </p>
                          </div>
                        </div>

                        {canModerateRoom && !isSelf && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {!m.isRoomAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handlePromoteOrTransferAdmin(m.id, false)}
                                  className="rounded-lg border border-brand/30 bg-brand/15 px-2 py-1 text-[10px] font-extrabold text-brand hover:bg-brand hover:text-black"
                                >
                                  + Make Admin
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromoteOrTransferAdmin(m.id, true)}
                                  title="Transfer your adminship to this member"
                                  className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-zinc-200 hover:border-brand"
                                >
                                  <ArrowRightLeft size={10} /> Transfer
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDemoteAdmin(m.id)}
                                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:bg-white/10"
                              >
                                Remove Admin
                              </button>
                            )}

                            {(isStaff || !m.isRoomAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleBlockUserInRoom(m)}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/25"
                              >
                                <Ban size={10} /> Block & Delete Posts
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Blocked Users List (Visible to Group Admin / Site Admin) */}
            {canModerateRoom && roomMembersData.blockedUsers.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <h4 className="mb-2 text-[11px] font-extrabold tracking-wider text-rose-400 uppercase">
                  Blocked Users ({roomMembersData.blockedUsers.length})
                </h4>
                <div className="space-y-1.5">
                  {roomMembersData.blockedUsers.map((bu) => (
                    <div
                      key={bu.id}
                      className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-white">{bu.name}</span>
                      <button
                        type="button"
                        onClick={() => handleUnblockUserInRoom(bu)}
                        className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/20"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Community Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setRoomToDelete(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10"
            >
              <X size={16} />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
              <Trash2 size={22} />
            </div>

            <h3
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-center text-lg font-extrabold"
            >
              Delete Community?
            </h3>
            <p className="mt-2 text-center text-xs leading-relaxed text-zinc-400">
              Are you sure you want to permanently delete{' '}
              <b className="text-white">
                {roomToDelete.icon} {roomToDelete.name}
              </b>{' '}
              and all posts inside it?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="rounded-2xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = roomToDelete.id;
                  try {
                    await communityApi.deleteRoom(targetId);
                    setRoomToDelete(null);
                    setRooms((prev) => prev.filter((r) => r.id !== targetId));
                    setActiveRoom((prev) => (prev?.id === targetId ? null : prev));
                    setMobileChatOpen(false);
                    await loadRooms(false);
                  } catch {
                    setRoomToDelete(null);
                  }
                }}
                className="keep-white flex items-center justify-center gap-1.5 rounded-2xl bg-rose-500 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
              >
                <Trash2 size={14} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
