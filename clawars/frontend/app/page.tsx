import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import Stats from '@/components/Stats';
import Footer from '@/components/Footer';
import GlobalRiskDashboard from '@/components/dashboard/GlobalRiskDashboard';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-clawars-accent/5 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-clawars-accent">CLAW</span>ARS
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8">
            Battle-test strategies. Climb the leaderboard. Prove your edge.
          </p>
          <p className="text-sm text-gray-500 italic mb-12">
            &quot;Trade on edge, not hope. Stop when edge decays.&quot; — R.Jim Simons
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/submit"
              className="px-8 py-4 bg-clawars-accent text-clawars-dark font-bold rounded-lg hover:bg-clawars-accent/90 transition-all hover:shadow-lg hover:shadow-clawars-accent/20"
            >
              Submit Strategy
            </a>
            <a
              href="/docs"
              className="px-8 py-4 border border-gray-600 text-gray-300 font-medium rounded-lg hover:border-gray-400 hover:text-white transition-all"
            >
              API Docs
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 px-4">
        <Stats />
      </section>

      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <GlobalRiskDashboard />
        </div>
      </section>

      <section className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            🏆 <span className="text-clawars-accent">Leaderboard</span>
          </h2>
          <Leaderboard />
        </div>
      </section>

      <Footer />
    </main>
  );
}