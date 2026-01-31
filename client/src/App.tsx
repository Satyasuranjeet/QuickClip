import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import ShareText from './components/ShareText';
import ReceiveText from './components/ReceiveText';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share" element={<ShareText />} />
        <Route path="/receive" element={<ReceiveText />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConnectionStatus />
    </ErrorBoundary>
  );
}

export default App;
