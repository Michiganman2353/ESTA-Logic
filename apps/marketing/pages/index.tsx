import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect root to /home
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      Redirecting...
    </div>
  );
}
