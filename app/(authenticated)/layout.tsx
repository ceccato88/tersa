import { currentUser, currentUserProfile } from '@/lib/auth';
import {
  type SubscriptionContextType,
  SubscriptionProvider,
} from '@/providers/subscription';
import { ReactFlowProvider } from '@xyflow/react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

const AuthenticatedLayout = async ({ children }: AuthenticatedLayoutProps) => {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = await currentUserProfile();

  if (!profile) {
    return null;
  }

  // No Stripe/credits: treat all logged-in users as subscribed
  const plan: SubscriptionContextType['plan'] = 'enterprise';

  return (
    <SubscriptionProvider isSubscribed={true} plan={plan}>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </SubscriptionProvider>
  );
};

export default AuthenticatedLayout;
