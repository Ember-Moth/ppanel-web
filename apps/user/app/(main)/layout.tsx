import Footer from '@/components/footer';
import Header from '@/components/header';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-grow">
              {children}
          </div>
          <Footer />
      </div>
  );
}
