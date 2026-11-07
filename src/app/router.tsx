import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { HomeRedirect, RequireArea, RequireLanguage, RequireSession, RootLayout } from './guards'

// Screens are code-split so the first load on a slow connection stays small.
const LanguagePage = lazy(() => import('@/pages/LanguagePage'))
const LocationPage = lazy(() => import('@/pages/LocationPage'))
const AreaPickerPage = lazy(() => import('@/pages/AreaPickerPage'))
const GuestHomePage = lazy(() => import('@/pages/GuestHomePage'))
const ForYouPage = lazy(() => import('@/pages/ForYouPage'))
const TalkIntroPage = lazy(() => import('@/pages/TalkIntroPage'))
const TalkPage = lazy(() => import('@/pages/TalkPage'))
const TapFormPage = lazy(() => import('@/pages/TapFormPage'))
const CallPage = lazy(() => import('@/pages/CallPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'))
const ApplicationSentPage = lazy(() => import('@/pages/ApplicationSentPage'))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'))
const MePage = lazy(() => import('@/pages/MePage'))
const HisaabPage = lazy(() => import('@/pages/HisaabPage'))
const RatesPage = lazy(() => import('@/pages/RatesPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/** /jobs shows the matched list to a worker with a profile and the nearby list to one who skipped it. */
function JobsHome() {
  const { signedIn } = useAuth()
  return signedIn ? <ForYouPage /> : <GuestHomePage />
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      { path: '/language', element: <LanguagePage /> },
      {
        element: <RequireLanguage />,
        children: [
          { path: '/talk', element: <TalkIntroPage /> },
          { path: '/talk/voice', element: <TalkPage /> },
          { path: '/talk/tap', element: <TapFormPage /> },
          { path: '/talk/call', element: <CallPage /> },
          { path: '/location', element: <LocationPage /> },
          { path: '/location/area', element: <AreaPickerPage /> },
          { path: '/rates', element: <RatesPage /> },
          { path: '/help', element: <HelpPage /> },
          {
            element: <RequireSession />,
            children: [
              { path: '/profile', element: <ProfilePage /> },
              { path: '/me', element: <MePage /> },
              { path: '/hisaab', element: <HisaabPage /> },
              { path: '/applications', element: <ApplicationsPage /> },
            ],
          },
          {
            element: <RequireArea />,
            children: [
              { path: '/jobs', element: <JobsHome /> },
              {
                element: <RequireSession />,
                children: [
                  { path: '/jobs/:id', element: <JobDetailPage /> },
                  { path: '/jobs/:id/applied', element: <ApplicationSentPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" aria-busy="true" />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
