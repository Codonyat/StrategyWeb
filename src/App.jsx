import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import Landing from './pages/Landing';
import Auctions from './pages/Auctions';
import Lottery from './pages/Lottery';
import Stats from './pages/Stats';
import HowItWorks from './pages/HowItWorks';
import './App.css';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auctions" element={<Auctions />} />
                <Route path="/lottery" element={<Lottery />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/faq" element={<HowItWorks />} />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
