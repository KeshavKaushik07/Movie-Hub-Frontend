import { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  UserCheck,
  Crown,
  Save,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { formatAdminDateTime } from './adminHelpers';

export default function SettingsSection({ user, isSuper, notify = () => {} }) {
  // Profile Update Form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!profileName.trim()) {
      notify('Name cannot be empty', 'error');
      return;
    }
    setProfileSaving(true);
    try {
      await authService.updateMe({
        name: profileName.trim(),
        bio: profileBio.trim(),
      });
      setProfileMsg('Profile updated successfully!');
      notify('Profile updated successfully!');
    } catch (err) {
      notify(
        err.response?.data?.message || 'Failed to update profile',
        'error',
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword: newPassword.trim(),
      });
      setPasswordSuccess('Password changed successfully!');
      notify('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordError(msg);
      notify(msg, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className='space-y-6 max-w-4xl py-2 w-full'>
      {/* Card 1: Profile Details */}
      <div className='rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 sm:p-6 shadow-xs'>
        <div className='flex items-center gap-3 mb-5 pb-3 border-b border-[#d5d9e0] dark:border-white/10'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-brand/15 dark:text-brand font-bold'>
            {isSuper ? <Crown size={18} /> : <UserCheck size={18} />}
          </span>
          <div>
            <h3 className='text-sm font-bold text-[#1b2230] dark:text-white'>
              Admin Profile
            </h3>
            <p className='text-xs text-[#4a5262] dark:text-zinc-400'>
              Your credentials and role identity.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className='space-y-4'>
          {profileMsg && (
            <div className='p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold'>
              {profileMsg}
            </div>
          )}

          <div className='flex items-center gap-4 mb-4'>
            <span
              style={{ backgroundColor: user?.avatarColor || '#2350d8' }}
              className='keep-white flex h-14 w-14 items-center justify-center rounded-xl text-lg font-black text-white shadow-xs shrink-0'
            >
              {(user?.name || 'A')[0].toUpperCase()}
            </span>
            <div className='min-w-0'>
              <p className='text-sm font-bold text-[#1b2230] dark:text-white truncate'>
                {user?.name}
              </p>
              <p className='text-xs text-zinc-500 truncate'>{user?.email}</p>
              <div className='flex items-center gap-2 mt-1 text-[11px] text-[#4a5262] dark:text-zinc-400'>
                <span>
                  Role: <b>{user?.role}</b>
                </span>
                <span>&middot;</span>
                <span>Joined: {formatAdminDateTime(user?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Display Name *
              </label>
              <input
                type='text'
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className='w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Email Address
              </label>
              <input
                type='email'
                disabled
                value={user?.email || ''}
                className='w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-white/5 text-sm text-zinc-500 cursor-not-allowed'
              />
              <span className='block mt-1 text-[11px] text-zinc-400'>
                Email cannot be changed directly for security.
              </span>
            </div>

            <div className='sm:col-span-2'>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Bio / Notes
              </label>
              <textarea
                rows={2}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder='Short note about your role or specialization...'
                className='w-full p-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white'
              />
            </div>
          </div>

          <div className='pt-2 flex justify-end'>
            <button
              type='submit'
              disabled={profileSaving}
              className='admin-btn admin-btn-primary'
            >
              <Save size={14} />{' '}
              {profileSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Password Change System */}
      <div className='rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 sm:p-6 shadow-xs'>
        <div className='flex items-center gap-3 mb-5 pb-3 border-b border-[#d5d9e0] dark:border-white/10'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 font-bold'>
            <KeyRound size={18} />
          </span>
          <div>
            <h3 className='text-sm font-bold text-[#1b2230] dark:text-white'>
              Account Security &amp; Password
            </h3>
            <p className='text-xs text-[#4a5262] dark:text-zinc-400'>
              Change your administrative login password.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className='space-y-4'>
          {passwordError && (
            <div className='p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold'>
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className='p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold'>
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
              Current Password *
            </label>
            <div className='relative'>
              <input
                required
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder='Enter your current password'
                className='w-full h-10 px-3 pr-10 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white'
              />
              <button
                type='button'
                onClick={() => setShowCurrent((v) => !v)}
                className='absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600'
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                New Password *
              </label>
              <div className='relative'>
                <input
                  required
                  type={showNew ? 'text' : 'password'}
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Min 6 characters'
                  className='w-full h-10 px-3 pr-10 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white'
                />
                <button
                  type='button'
                  onClick={() => setShowNew((v) => !v)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600'
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Confirm New Password *
              </label>
              <input
                required
                type={showNew ? 'text' : 'password'}
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Re-enter new password'
                className='w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white'
              />
            </div>
          </div>

          <div className='pt-2 flex justify-end'>
            <button
              type='submit'
              disabled={passwordSaving}
              className='admin-btn admin-btn-primary'
            >
              <Check size={14} />{' '}
              {passwordSaving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
