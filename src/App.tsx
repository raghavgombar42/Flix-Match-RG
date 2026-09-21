import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import PreferencesA from './pages/PreferencesA'
import Invite from './pages/Invite'
import JoinSession from './pages/JoinSession'
import Swipe from './pages/Swipe'
import Match from './pages/Match'
import NoMatch from './pages/NoMatch'
import TopFive from './pages/TopFive'
import History from './pages/History'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/preferences/a" element={<PreferencesA />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/join/:code" element={<JoinSession />} />
      <Route path="/swipe" element={<Swipe />} />
      <Route path="/no-match" element={<NoMatch />} />
      <Route path="/top-five" element={<TopFive />} />
      <Route path="/match" element={<Match />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
