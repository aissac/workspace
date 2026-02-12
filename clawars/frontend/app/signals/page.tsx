import Header from '@/components/Header';
import GlobalSignalFeed from '@/components/dashboard/GlobalSignalFeed';
import Footer from '@/components/Footer';

export default function SignalsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <GlobalSignalFeed />
        </div>
      </section>

      <Footer />
    </main>
  );
}