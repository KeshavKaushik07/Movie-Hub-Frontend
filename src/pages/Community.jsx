import { useEffect, useState, useRef } from 'react';
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
} from 'lucide-react';
import { communityApi, tmdb } from '../services/api';
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

  const loadRooms = async () => {
    const pub = await communityApi.listRooms().catch(() => []);
    setRooms(pub);
    if (!activeRoom && pub.length) {
      setActiveRoom(pub[0]);
    }
    if (user) {
      const dmList = await communityApi.listDms().catch(() => []);
      setDms(dmList);
    }
  };

  useEffect(() => {
    document.title = 'Live Cinema Community & User Chat | Movies Hub';
    loadRooms();
  }, [user?.id]); // eslint-disable-line

  useEffect(() => {
    if (!activeRoom?.id) return;
    let eventSource = null;

    communityApi
      .listMessages(activeRoom.id)
      .then((res) => {
        setMessages(res.messages || []);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
          100,
        );
      })
      .catch(() => setMessages([]));

    try {
      eventSource = new EventSource(
        `${BACKEND.URL}/community/rooms/${activeRoom.id}/stream`,
        {
          withCredentials: true,
        },
      );
      eventSource.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.event === 'new_message' && payload.data) {
            setMessages((prev) =>
              prev.some((m) => m.id === payload.data.id)
                ? prev
                : [...prev, payload.data],
            );
            setTimeout(
              () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
              80,
            );
          } else if (
            payload.event === 'message_deleted' &&
            payload.data?.messageId
          ) {
            setMessages((prev) =>
              prev.filter((m) => m.id !== payload.data.messageId),
            );
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeRoom?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    try {
      const sent = await communityApi.sendMessage(activeRoom.id, {
        text: text.trim(),
        replyToId: replyTo?.id || undefined,
        spoiler,
        sharedTitle: attachedMovie
          ? { tmdbId: attachedMovie.id, type: attachedMovie.type || 'movie' }
          : undefined,
      });
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      setText('');
      setReplyTo(null);
      setAttachedMovie(null);
      setSpoiler(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        80,
      );
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
    const res = await communityApi.searchUsers(qVal);
    setChatUsers(res);
  };

  const handleStartDm = async (targetUserId) => {
    const dmRoom = await communityApi.startDm(targetUserId);
    const updatedDms = await communityApi.listDms();
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
    <div className='mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6'>
      <div className='grid h-[calc(100vh-145px)] min-h-[480px] overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] shadow-2xl lg:h-[78vh] lg:grid-cols-12'>
        {/* Left Sidebar: Shown on mobile when `!mobileChatOpen`, always shown on desktop (`lg:flex`) */}
        <aside
          className={`${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          } flex-col border-white/10 bg-[#070a10]/60 lg:col-span-4 lg:border-r`}
        >
          <div className='border-b border-white/10 p-4'>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className='text-lg font-extrabold text-white'
            >
              Community & Live Chat
            </h1>
            <div className='mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-white/5 p-1'>
              {[
                { key: 'public', label: '💬 Lounges' },
                { key: 'movie', label: '🎬 Movies' },
                { key: 'dm', label: '✉️ User DMs' },
              ].map((t) => (
                <button
                  key={t.key}
                  type='button'
                  onClick={() => {
                    setMode(t.key);
                    if (t.key === 'dm' && user) handleSearchUsers('');
                  }}
                  className={`rounded-lg py-1.5 text-xs font-bold transition ${
                    mode === t.key
                      ? 'bg-[#f5b942] text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'dm' && (
            <div className='border-b border-white/10 p-3'>
              {user ? (
                <div className='space-y-2'>
                  <div className='relative'>
                    <Search
                      size={13}
                      className='absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400'
                    />
                    <input
                      value={userSearchQ}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder='Find a user to message...'
                      className='w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white'
                    />
                  </div>
                  {chatUsers.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 pt-1'>
                      {chatUsers.slice(0, 6).map((u) => (
                        <button
                          key={u.id}
                          type='button'
                          onClick={() => handleStartDm(u.id)}
                          className='flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:border-[#f5b942]'
                        >
                          <PlusCircle size={11} className='text-[#f5b942]' />{' '}
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-center text-xs text-zinc-400'>
                  <Link
                    to={ROUTES.LOGIN}
                    className='font-bold text-[#f5b942] underline'
                  >
                    Log in
                  </Link>{' '}
                  to message users directly.
                </p>
              )}
            </div>
          )}

          <div className='studio-scroll flex-1 space-y-1.5 overflow-y-auto p-2.5'>
            {displayedRooms.map((r) => {
              const active = activeRoom?.id === r.id;
              return (
                <button
                  key={r.id}
                  type='button'
                  onClick={() => {
                    setActiveRoom(r);
                    setMobileChatOpen(true);
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99] ${
                    active
                      ? 'border border-[#f5b942]/40 bg-[#f5b942]/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-lg'>
                    {r.icon || '💬'}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p
                        className={`truncate text-xs font-extrabold ${active ? 'text-[#f5b942]' : 'text-white'}`}
                      >
                        {r.name}
                      </p>
                      <span className='text-[10px] text-zinc-500'>
                        {r.messageCount || 0} msgs
                      </span>
                    </div>
                    <p className='mt-0.5 truncate text-[11px] text-zinc-400'>
                      {r.lastMessagePreview?.text ||
                        r.description ||
                        'Tap to open live chat'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Window: Full-screen on mobile when `mobileChatOpen` is true */}
        <section
          className={`${
            mobileChatOpen ? 'flex' : 'hidden lg:flex'
          } flex-col lg:col-span-8 min-h-0`}
        >
          {activeRoom ? (
            <>
              <div className='flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <button
                    type='button'
                    onClick={() => setMobileChatOpen(false)}
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white lg:hidden'
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <span className='text-xl shrink-0'>
                    {activeRoom.icon || '💬'}
                  </span>
                  <div className='min-w-0'>
                    <h2 className='truncate text-sm font-extrabold text-white'>
                      {activeRoom.name}
                    </h2>
                    <p className='truncate text-[11px] text-zinc-400'>
                      {activeRoom.description}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-emerald-400'>
                  <span className='h-2 w-2 rounded-full bg-emerald-400' />
                  <span>Live</span>
                </div>
              </div>

              <div className='studio-scroll flex-1 space-y-3 overflow-y-auto p-4 sm:p-5'>
                {messages.length === 0 ? (
                  <div className='flex h-full flex-col items-center justify-center text-center text-xs text-zinc-500'>
                    <MessageSquare size={28} className='mb-2 text-zinc-600' />
                    <p>No messages in {activeRoom.name} yet.</p>
                    <p>Say hello or share a movie recommendation below!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = user && m.sender?.id === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl border p-3 sm:max-w-lg ${
                            isMine
                              ? 'border-[#f5b942]/30 bg-[#f5b942]/10'
                              : 'border-white/10 bg-white/[0.04]'
                          }`}
                        >
                          <div className='mb-1 flex items-center justify-between gap-4 text-[11px]'>
                            <span className='font-bold text-[#f5b942]'>
                              {m.sender?.name || 'Member'}
                            </span>
                            <span className='text-zinc-500'>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {m.replyTo?.textSnippet && (
                            <div className='mb-2 rounded-lg border-l-2 border-[#f5b942] bg-black/30 px-2.5 py-1 text-[11px] text-zinc-400'>
                              <b>@{m.replyTo.senderName}:</b>{' '}
                              {m.replyTo.textSnippet}
                            </div>
                          )}

                          <p className='text-xs leading-relaxed text-zinc-100'>
                            {m.text}
                          </p>

                          {m.sharedTitle?.tmdbId && (
                            <Link
                              to={`/details/${m.sharedTitle.type || 'movie'}/${m.sharedTitle.tmdbId}#overview`}
                              className='mt-2.5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#070a10] p-2 hover:border-[#f5b942]'
                            >
                              <SafeImage
                                src={m.sharedTitle.posterUrl}
                                alt={m.sharedTitle.title}
                                size='w185'
                                variant='poster'
                                className='h-14 w-10 rounded-lg object-cover'
                              />
                              <div className='min-w-0 flex-1'>
                                <p className='truncate text-xs font-bold text-white'>
                                  {m.sharedTitle.title}
                                </p>
                                <p className='text-[10px] text-[#f5b942]'>
                                  {m.sharedTitle.year} • ★{' '}
                                  {Number(m.sharedTitle.rating || 0).toFixed(1)}
                                </p>
                              </div>
                            </Link>
                          )}

                          <div className='mt-2 flex items-center gap-3 text-[10px] text-zinc-400'>
                            <button
                              type='button'
                              onClick={() =>
                                user &&
                                communityApi
                                  .toggleLike(m.id)
                                  .then((r) =>
                                    setMessages((prev) =>
                                      prev.map((x) =>
                                        x.id === m.id
                                          ? {
                                              ...x,
                                              likesCount: r.likesCount,
                                              liked: r.liked,
                                            }
                                          : x,
                                      ),
                                    ),
                                  )
                              }
                              className={`flex items-center gap-1 ${m.liked ? 'text-rose-400' : 'hover:text-white'}`}
                            >
                              <Heart
                                size={11}
                                fill={m.liked ? 'currentColor' : 'none'}
                              />{' '}
                              {m.likesCount || 0}
                            </button>
                            {user && (
                              <button
                                type='button'
                                onClick={() => setReplyTo(m)}
                                className='flex items-center gap-1 hover:text-white'
                              >
                                <Reply size={11} /> Reply
                              </button>
                            )}
                            {(isMine || isStaff) && (
                              <button
                                type='button'
                                onClick={() =>
                                  communityApi
                                    .deleteMessage(m.id)
                                    .then(() =>
                                      setMessages((prev) =>
                                        prev.filter((x) => x.id !== m.id),
                                      ),
                                    )
                                }
                                className='text-zinc-500 hover:text-rose-400'
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
                <div className='border-t border-white/10 bg-[#070a10] p-3'>
                  <form onSubmit={searchMoviesToAttach} className='flex gap-2'>
                    <input
                      value={movieSearchQ}
                      onChange={(e) => setMovieSearchQ(e.target.value)}
                      placeholder='Search movie to attach...'
                      className='flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white'
                    />
                    <button className='rounded-xl bg-[#f5b942] px-3 py-1.5 text-xs font-bold text-black'>
                      Find
                    </button>
                    <button
                      type='button'
                      onClick={() => setMoviePickerOpen(false)}
                      className='p-1.5 text-zinc-400'
                    >
                      <X size={15} />
                    </button>
                  </form>
                  {movieResults.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {movieResults.map((mv) => (
                        <button
                          key={mv.id}
                          type='button'
                          onClick={() => {
                            setAttachedMovie(mv);
                            setMoviePickerOpen(false);
                          }}
                          className='rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white hover:border-[#f5b942]'
                        >
                          🎬 {mv.title || mv.name} ({mv.year})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className='border-t border-white/10 p-3'>
                {(replyTo || attachedMovie) && (
                  <div className='mb-2 flex flex-wrap items-center gap-2 text-xs'>
                    {replyTo && (
                      <span className='flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-zinc-200'>
                        Replying to <b>@{replyTo.sender?.name}</b>
                        <button type='button' onClick={() => setReplyTo(null)}>
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {attachedMovie && (
                      <span className='flex items-center gap-1.5 rounded-full bg-[#f5b942]/20 px-3 py-1 text-[#f5b942]'>
                        🎬 <b>{attachedMovie.title || attachedMovie.name}</b>
                        <button
                          type='button'
                          onClick={() => setAttachedMovie(null)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {user ? (
                  <form
                    onSubmit={handleSend}
                    className='flex items-center gap-2'
                  >
                    <button
                      type='button'
                      onClick={() => setMoviePickerOpen((v) => !v)}
                      className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#f5b942]'
                    >
                      <Film size={16} />
                    </button>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`Message ${activeRoom.name}...`}
                      className='flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white focus:border-[#f5b942] focus:outline-none'
                    />
                    <button className='flex shrink-0 items-center gap-1.5 rounded-full bg-[#f5b942] px-4 py-2 text-xs font-extrabold text-black'>
                      <Send size={14} />
                    </button>
                  </form>
                ) : (
                  <div className='flex items-center justify-center gap-2 py-1 text-xs text-zinc-400'>
                    <Lock size={14} /> Please{' '}
                    <Link
                      to={ROUTES.LOGIN}
                      className='font-bold text-[#f5b942] underline'
                    >
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
