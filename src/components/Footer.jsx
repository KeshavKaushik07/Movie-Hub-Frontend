import { Link } from 'react-router-dom';
import { Film, Tv, BookOpen, MessageSquare, Compass, Globe, FileCode } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#070a10] pb-24 text-xs text-zinc-400 lg:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-black">
            <Film size={16} />
          </span>
          <div>
            <span className="font-bold">{APP_NAME}</span>
            <p className="text-[11px] text-zinc-500">
              Indian & Global Cinema Encyclopedia • Movies, Web Series & TV Shows • Live Community
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <Link to="/browse/movies" className="flex items-center gap-1 hover:text-brand">
            <Compass size={13} /> Movies
          </Link>
          <Link to="/browse/web-series" className="flex items-center gap-1 hover:text-brand">
            <Tv size={13} /> Web Series
          </Link>
          <Link to="/browse/tv-shows" className="flex items-center gap-1 hover:text-brand">
            <Tv size={13} /> TV Shows
          </Link>
          <Link to="/blogs" className="flex items-center gap-1 hover:text-brand">
            <BookOpen size={13} /> Editorial Blogs
          </Link>
          <Link to="/community" className="flex items-center gap-1 hover:text-brand">
            <MessageSquare size={13} /> Community Chat
          </Link>
          <Link to="/sitemap" className="flex items-center gap-1 font-semibold text-brand hover:underline">
            <Globe size={13} /> HTML Sitemap
          </Link>
          <Link to="/sitemap.xml" className="flex items-center gap-1 hover:text-brand">
            <FileCode size={13} /> sitemap.xml
          </Link>
        </div>
        <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
