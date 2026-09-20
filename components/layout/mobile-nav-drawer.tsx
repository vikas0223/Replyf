/**
 * Mobile Navigation Drawer (Part 3, 4, 9)
 *
 * Slide-in navigation sheet for viewports < 768px.
 * Uses the existing Radix Sheet primitive for consistent
 * focus trapping, Escape-to-close, and overlay behavior.
 *
 * Contains:
 * - Primary navigation routes (Workout, Programs, Goals, Challenges, Exercises, Dashboard)
 * - Account section (Guest/Authenticated status, Switch/Sign out)
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dumbbell,
  Layers,
  Target,
  Trophy,
  LayoutGrid,
  BarChart2,
  User,
  LogOut,
  X,
} from 'lucide-react';

export interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessMode: 'unselected' | 'guest' | 'authenticated';
  userEmail: string | null;
  onSignOut: () => void;
  onResetFlow?: () => void;
  onSwitchAccess?: () => void;
}

const NAV_ITEMS = [
  { href: '/app', label: 'Workout', icon: Dumbbell },
  { href: '/programs', label: 'Programs', icon: Layers },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
  { href: '/exercises', label: 'Exercises', icon: LayoutGrid },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
];

export function MobileNavDrawer({
  open,
  onOpenChange,
  accessMode,
  userEmail,
  onSignOut,
  onResetFlow,
  onSwitchAccess,
}: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[280px] sm:max-w-[320px] bg-white p-0 flex flex-col [&>button]:hidden"
        aria-label="Navigation menu"
        hideCloseButton
      >
        {/* Drawer Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-sm shadow-indigo-200">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="Replyf logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <SheetTitle className="text-base font-black text-slate-900 tracking-tight">
                Replyf
              </SheetTitle>
            </div>
            <SheetClose
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-2 px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 active:bg-indigo-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <Icon className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Account Section */}
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Account
          </p>

          {accessMode === 'authenticated' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 py-1">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {userEmail || 'Signed In'}
                  </p>
                  <p className="text-[11px] text-slate-500">Authenticated</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onOpenChange(false);
                }}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-slate-700">Guest Mode</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your data stays on this device. Sign in to sync across devices.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onSwitchAccess) {
                    onSwitchAccess();
                  } else {
                    onResetFlow?.();
                  }
                  onOpenChange(false);
                }}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                <span>Switch Account</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
