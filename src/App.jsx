import { WalletConnect } from './components/WalletConnect'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Strategy Coin</h1>
        <p>Welcome to Strategy Coin - Your Strategic Investment</p>
      </header>

      <main className="App-main">
        <WalletConnect />

        <section className="info-section">
          <h2>About Strategy Coin</h2>
          <p>Your strategic approach to cryptocurrency investment</p>
        </section>
      </main>
    </div>
  )
}

export default App
