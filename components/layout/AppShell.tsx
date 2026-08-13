'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [colapsada, setColapsada] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  return (
    <div className="min-h-screen bg-base-50">
      <Sidebar colapsada={colapsada} onToggle={() => setColapsada((v) => !v)} />
      <MobileSidebar aberto={menuMobileAberto} onFechar={() => setMenuMobileAberto(false)} />

      <div
        className={clsx(
          'flex min-h-screen flex-col transition-all duration-200',
          colapsada ? 'md:pl-sidebar-collapsed' : 'md:pl-sidebar'
        )}
      >
        <Topbar onAbrirMenuMobile={() => setMenuMobileAberto(true)} />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-7">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
