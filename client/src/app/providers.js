'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CallProvider } from '@/context/CallContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <CallProvider>{children}</CallProvider>
    </AuthProvider>
  );
}
