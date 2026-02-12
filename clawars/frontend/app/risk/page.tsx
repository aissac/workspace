import Header from '@/components/Header';
import GlobalRiskDashboard from '@/components/dashboard/GlobalRiskDashboard';
import Footer from '@/components/Footer';

export default function RiskPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <GlobalRiskDashboard />
        </div>
      </section>

      <Footer />
    </main>
  );
}