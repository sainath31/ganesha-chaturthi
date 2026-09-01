import type { Role } from '@/lib/auth';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}
