import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  PlusCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { communityApi, tmdb } from '../services/api';
import { getInMemoryAccessToken } from '../services/backendApi';
import { BACKEND, ROLES, ROUTES } from '../config/constants';
import SafeImage from '../components/ui/SafeImage';

export default function Community() {
  const user = useSelector((s) => s.auth.user);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);

  const [mode, setMode] = useState('public');
  const [rooms, setRooms] = useState([]);
  const [dms, setDms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

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

  const [userSearchQ, setUserSearchQ] = useState('');
  const [chatUsers, setChatUsers] = useState([]);

  const bottomRef = useRef(null);
  const lastMessageSigRef = useRef('');

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    }, 60);
  }, []);

  // Load Public/Movie rooms + User's 1-on-1 DMs
  const loadRooms = useCallback(
    async (silent = false) => {
      const pub = await communityApi.listRooms({ _t: Date.now() }).catch(() => []);
      setRooms(pub);
      setActiveRoom((prev) => {
        if (prev) {
          const updated = pub.find((r) => r.id === prev.id);
          return updated ? { ...prev, ...updated } : prev;
        }
        return pub.length && !silent ? pub[0] : prev;
      });

      if (user?.id) {
        const dmList = await communityApi.listDms({ _t: Date.now() }).catch(() => []);
        setDms(dmList);
        setActiveRoom((prev) => {
          if (prev && prev.roomType === 'dm') {
            const updatedDm = dmList.find((d) => d.id === prev.id);
            return updatedDm ? { ...prev, ...updatedDm } : prev;
          }
          return prev;
        });
      }
    },
    [user?.id],
  );

  // Fetch all previous + new messages for a room and re-render chat view cleanly
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

  useEffect(() => {
    document.title = 'Live Cinema Community & User Chat | Movies Hub';
    loadRooms(false);
  }, [loadRooms]);

  // Whenever activeRoom changes OR while chatting:
  // 1) Immediately fetch previous + new messages
  // 2) Poll every 1.5 seconds so incoming messages from the other user appear automatically without page refresh
  // 3) Also connect SSE stream (with token query param so DM rooms authenticate properly)
  useEffect(() => {
    const roomId = activeRoom?.id;
    if (!roomId) return;

    lastMessageSigRef.current = '';
    fetchRoomMessages(roomId, { forceScroll: true, showSpinner: true });

    // Live polling every 1.5s guarantees instant updates even without WebSockets
    const pollTimer = setInterval(() => {
      fetchRoomMessages(roomId, { forceScroll: false });
    }, 1500);

    // Keep sidebar message counts & DM previews updated every 4s
    const roomTimer = setInterval(() => {
      loadRooms(true);
    }, 4000);

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
            payload.event === 'message_deleted'
          ) {
            fetchRoomMessages(roomId, { forceScroll: payload.event === 'new_message' });
            loadRooms(true);
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* polling handles everything if SSE is unavailable */
    }

    return () => {
      clearInterval(pollTimer);
      clearInterval(roomTimer);
      if (eventSource) eventSource.close();
    };
  }, [activeRoom?.id, fetchRoomMessages, loadRooms]);

  // Send a message -> optimistically append + immediately re-fetch previous & new chats from backend
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom || sending) return;
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

      if (sent) {
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
        scrollToLatest('smooth');
      }

      // Immediately fetch full updated chat history (previous + new messages) & update room counts
      await Promise.all([
        fetchRoomMessages(activeRoom.id, { forceScroll: true }),
        loadRooms(true),
      ]);
    } catch {
      // Restore draft if send failed
      setText(messageText);
      setReplyTo(currentReply);
      setAttachedMovie(currentMovie);
      setSpoiler(currentSpoiler);
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

  const handleSearchUsers = async (qVal) => {
    setUserSearchQ(qVal);
    if (!user) return;
    const res = await communityApi.searchUsers(qVal).catch(() => []);
    setChatUsers(res);
  };

  const handleStartDm = async (targetUserId) => {
    const dmRoom = await communityApi.startDm(targetUserId);
    const updatedDms = await communityApi.listDms({ _t: Date.now() }).catch(() => []);
    setDms(updatedDms);
    setMode('dm');
    setActiveRoom(dmRoom);
    setMobileChatOpen(true);
  };

  const displayedRooms =
    mode === 'dm'
      ? dms
      : mode === 'movie'
        ? rooms.filter((r) => r.roomType === 'movie')
        : rooms.filter((r) => r.roomType === 'public');

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-2.5 py-3 sm:px-6 sm:py-6">
      <div className="grid h-[calc(100vh-140px)] min-h-[480px] w-full max-w-full overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] shadow-2xl lg:h-[78vh] lg:grid-cols-12">
        {/* Left Sidebar: `min-w-0 w-full max-w-full overflow-hidden` prevents Lounge descriptions from stretching mobile width */}
        <aside
          className={`${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          } min-w-0 w-full max-w-full flex-col overflow-hidden border-white/10 bg-[#070a10]/60 lg:col-span-4 lg:border-r`}
        >
          <div className="min-w-0 w-full border-b border-white/10 p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className="truncate text-base font-extrabold text-white sm:text-lg"
              >
                Community & Live Chat
              </h1>
              <button
                type="button"
                onClick={() => {
                  loadRooms(true);
                  if (activeRoom?.id) fetchRoomMessages(activeRoom.id, { showSpinner: true });
                }}
                title="Sync chats"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-[#f5b942]"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin text-[#f5b942]' : ''} />
              </button>
            </div>

            {/* 3 Responsive Tabs: Always fit 100% inside mobile viewport regardless of active tab */}
            <div className="mt-3 grid w-full min-w-0 grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
              {[
                { key: 'public', icon: '💬', label: 'Lounges' },
                { key: 'movie', icon: '🎬', label: 'Movies' },
                { key: 'dm', icon: '✉️', label: 'User DMs' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setMode(t.key);
                    if (t.key === 'dm' && user) handleSearchUsers('');
                  }}
                  className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-bold transition sm:text-xs ${
                    mode === t.key
                      ? 'bg-[#f5b942] text-black shadow-sm'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mode === 'dm' && (
            <div className="min-w-0 w-full border-b border-white/10 p-3">
              {user ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={userSearchQ}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Find a user to message..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white focus:border-[#f5b942] focus:outline-none"
                    />
                  </div>
                  {chatUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {chatUsers.slice(0, 6).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleStartDm(u.id)}
                          className="flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:border-[#f5b942]"
                        >
                          <PlusCircle size={11} className="shrink-0 text-[#f5b942]" />
                          <span className="truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-xs text-zinc-400">
                  <Link to={ROUTES.LOGIN} className="font-bold text-[#f5b942] underline">
                    Log in
                  </Link>{' '}
                  to message users directly.
                </p>
              )}
            </div>
          )}

          <div className="studio-scroll min-w-0 w-full flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto p-2.5">
            {displayedRooms.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-xs text-zinc-500">
                <p>
                  {mode === 'dm'
                    ? 'No direct messages yet. Search a user above to start chatting!'
                    : mode === 'movie'
                      ? 'No movie chat rooms yet. Open any Movie Details page to start its fan room!'
                      : 'Loading lounges...'}
                </p>
              </div>
            ) : (
              displayedRooms.map((r) => {
                const active = activeRoom?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setActiveRoom(r);
                      setMobileChatOpen(true);
                    }}
                    className={`flex w-full max-w-full min-w-0 items-start gap-2.5 overflow-hidden rounded-2xl p-2.5 text-left transition active:scale-[0.99] sm:gap-3 sm:p-3 ${
                      active ? 'border border-[#f5b942]/40 bg-[#f5b942]/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-lg">
                      {r.icon || '💬'}
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <p className={`truncate text-xs font-extrabold ${active ? 'text-[#f5b942]' : 'text-white'}`}>
                          {r.name}
                        </p>
                        <span className="shrink-0 text-[10px] text-zinc-500">{r.messageCount || 0} msgs</span>
                      </div>
                      <p className="mt-0.5 block w-full truncate text-[11px] text-zinc-400">
                        {r.lastMessagePreview?.text
                          ? `${r.lastMessagePreview.senderName ? `${r.lastMessagePreview.senderName}: ` : ''}${r.lastMessagePreview.text}`
                          : r.description || 'Tap to open live chat'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Chat Window: Full-screen on mobile when `mobileChatOpen` is true */}
        <section
          className={`${
            mobileChatOpen ? 'flex' : 'hidden lg:flex'
          } min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden lg:col-span-8`}
        >
          {activeRoom ? (
            <>
              <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/10 px-3.5 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white lg:hidden"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <span className="shrink-0 text-xl">{activeRoom.icon || '💬'}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-extrabold text-white">{activeRoom.name}</h2>
                    <p className="truncate text-[11px] text-zinc-400">{activeRoom.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchRoomMessages(activeRoom.id, { forceScroll: true, showSpinner: true })}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:border-[#f5b942] hover:text-white"
                  >
                    <RefreshCw size={11} className={syncing ? 'animate-spin text-[#f5b942]' : ''} />
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span>Live</span>
                  </div>
                </div>
              </div>

              <div className="studio-scroll min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-xs text-zinc-500">
                    <MessageSquare size={28} className="mb-2 text-zinc-600" />
                    <p>No messages in {activeRoom.name} yet.</p>
                    <p>Say hello or share a movie recommendation below!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = user && String(m.sender?.id) === String(user.id);
                    return (
                      <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[86%] break-words rounded-2xl border p-3 sm:max-w-lg ${
                            isMine
                              ? 'border-[#f5b942]/30 bg-[#f5b942]/10'
                              : 'border-white/10 bg-white/[0.04]'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4 text-[11px]">
                            <span className="font-bold text-[#f5b942]">{m.sender?.name || 'Member'}</span>
                            <span className="text-zinc-500">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {m.replyTo?.textSnippet && (
                            <div className="mb-2 rounded-lg border-l-2 border-[#f5b942] bg-black/30 px-2.5 py-1 text-[11px] text-zinc-400">
                              <b>@{m.replyTo.senderName}:</b> {m.replyTo.textSnippet}
                            </div>
                          )}

                          <p className=" whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-100">
                            {m.text}
                          </p>

                          {m.sharedTitle?.tmdbId && (
                            <Link
                              to={`/details/${m.sharedTitle.type || 'movie'}/${m.sharedTitle.tmdbId}#overview`}
                              className="mt-2.5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#070a10] p-2 hover:border-[#f5b942]"
                            >
                              <SafeImage
                                src={m.sharedTitle.posterUrl}
                                alt={m.sharedTitle.title}
                                size="w185"
                                variant="poster"
                                className="h-14 w-10 shrink-0 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">{m.sharedTitle.title}</p>
                                <p className="text-[10px] text-[#f5b942]">
                                  {m.sharedTitle.year} • ★ {Number(m.sharedTitle.rating || 0).toFixed(1)}
                                </p>
                              </div>
                            </Link>
                          )}

                          <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(m.id)}
                              className={`flex items-center gap-1 ${m.liked ? 'text-rose-400' : 'hover:text-white'}`}
                            >
                              <Heart size={11} fill={m.liked ? 'currentColor' : 'none'} /> {m.likesCount || 0}
                            </button>
                            {user && (
                              <button
                                type="button"
                                onClick={() => setReplyTo(m)}
                                className="flex items-center gap-1 hover:text-white"
                              >
                                <Reply size={11} /> Reply
                              </button>
                            )}
                            {(isMine || isStaff) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
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
                <div ref={bottomRef} />
              </div>

              {moviePickerOpen && (
                <div className="border-t border-white/10 bg-[#070a10] p-3">
                  <form onSubmit={searchMoviesToAttach} className="flex gap-2">
                    <input
                      value={movieSearchQ}
                      onChange={(e) => setMovieSearchQ(e.target.value)}
                      placeholder="Search movie to attach..."
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                    />
                    <button className="shrink-0 rounded-xl bg-[#f5b942] px-3 py-1.5 text-xs font-bold text-black">
                      Find
                    </button>
                    <button type="button" onClick={() => setMoviePickerOpen(false)} className="p-1.5 text-zinc-400">
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
                          className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white hover:border-[#f5b942]"
                        >
                          🎬 {mv.title || mv.name} ({mv.year})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-white/10 p-3">
                {(replyTo || attachedMovie) && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    {replyTo && (
                      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-zinc-200">
                        Replying to <b>@{replyTo.sender?.name}</b>
                        <button type="button" onClick={() => setReplyTo(null)}>
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {attachedMovie && (
                      <span className="flex items-center gap-1.5 rounded-full bg-[#f5b942]/20 px-3 py-1 text-[#f5b942]">
                        🎬 <b>{attachedMovie.title || attachedMovie.name}</b>
                        <button type="button" onClick={() => setAttachedMovie(null)}>
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {user ? (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMoviePickerOpen((v) => !v)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#f5b942]"
                    >
                      <Film size={16} />
                    </button>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`Message ${activeRoom.name}...`}
                      className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white focus:border-[#f5b942] focus:outline-none"
                    />
                    <button
                      disabled={sending}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f5b942] px-4 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-1 text-xs text-zinc-400">
                    <Lock size={14} /> Please{' '}
                    <Link to={ROUTES.LOGIN} className="font-bold text-[#f5b942] underline">
                      log in
                    </Link>{' '}
                    to chat.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
