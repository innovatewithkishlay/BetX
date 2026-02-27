import { redirect } from 'next/navigation';

// Root "/" redirects to /login
export default function Home() {
  redirect('/agent/login');
}
