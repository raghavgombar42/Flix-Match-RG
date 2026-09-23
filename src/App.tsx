import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import PreferencesA from './pages/PreferencesA'
import Invite from './pages/Invite'
import JoinSession from './pages/JoinSession'
import Swipe from './pages/Swipe'
import Overlap from './pages/Overlap'
import Match from './pages/Match'
import History from './pages/History'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/preferences/a" element={<PreferencesA />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/join/:code" element={<JoinSession />} />
      <Route path="/swipe" element={<Swipe />} />
      <Route path="/overlap" element={<Overlap />} />
      <Route path="/match" element={<Match />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
