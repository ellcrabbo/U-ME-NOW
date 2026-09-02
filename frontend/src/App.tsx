import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth, RequireAgeVerified, RequireOnboarded, RequireAdmin } from './components/Guards'
import { useAuth } from './context/AuthContext'
import { useHeartbeat } from './hooks/useHeartbeat'

import Landing from './pages/Landing'
import { SignIn, SignUp } from './pages/Auth'
import Forgot from './pages/Forgot'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import AgeVerification from './pages/AgeVerification'
import Onboarding from './pages/Onboarding'
import Discovery from './pages/Discovery'
import Connections from './pages/Connections'
import Chat from './pages/Chat'
import ProfileSettings from './pages/ProfileSettings'
import Premium from './pages/Premium'
import Safety from './pages/Safety'
import Admin from './pages/Admin'
import { Terms, Privacy, Guidelines, AcceptableUse, Reporting, LawEnforcement, Refunds, Contact } from './pages/Legal'
import NotFound from './pages/NotFound'

export default function App() {
  const { session, profile } = useAuth()
  useHeartbeat(Boolean(session && profile?.onboarding_complete))

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/auth/forgot" element={<Forgot />} />
      <Route path="/auth/reset" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/age-verification" element={<RequireAuth><AgeVerification /></RequireAuth>} />
      <Route path="/onboarding" element={<RequireAgeVerified><Onboarding /></RequireAgeVerified>} />
      <Route path="/discover" element={<RequireOnboarded><Discovery /></RequireOnboarded>} />
      <Route path="/connections" element={<RequireOnboarded><Connections /></RequireOnboarded>} />
      <Route path="/chat/:conversationId" element={<RequireOnboarded><Chat /></RequireOnboarded>} />
      <Route path="/me" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
      <Route path="/premium" element={<RequireOnboarded><Premium /></RequireOnboarded>} />
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/guidelines" element={<Guidelines />} />
      <Route path="/acceptable-use" element={<AcceptableUse />} />
      <Route path="/reporting" element={<Reporting />} />
      <Route path="/law-enforcement" element={<LawEnforcement />} />
      <Route path="/refunds" element={<Refunds />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
