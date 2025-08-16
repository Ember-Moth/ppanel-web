import { Hero } from '@/components/main/hero';
import { queryUserInfo } from '@/services/user/user';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const Authorization = (await cookies()).get('Authorization')?.value;

  if (Authorization) {
    let user = null;
    try {
      user = await queryUserInfo({
        skipErrorHandler: true,
        Authorization,
      }).then((res) => res.data.data);
    } catch (error) {
      console.log('Token validation failed:', error);
    }

    if (user) {
      redirect('/dashboard');
    }
  }

  return (
      <main className="container space-y-16 backdrop-blur-sm">
      <Hero />
    </main>
  );
}
