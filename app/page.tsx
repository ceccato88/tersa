import { currentUser } from '@/lib/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'A visual AI playground | WOW',
  description:
    'WOW is an open source canvas for building AI workflows. Drag, drop connect and run nodes to build your own workflows powered by various industry-leading AI models.',
};

const Index = async () => {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  redirect('/projects');
};

export default Index;
