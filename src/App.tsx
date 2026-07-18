import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/app/providers/queryClient";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { RequireAuth } from "@/app/guards/RequireAuth";
import { RequireGuest } from "@/app/guards/RequireGuest";
import { RequireRole } from "@/app/guards/RequireRole";
import { AppShell } from "@/app/layouts/AppShell";
import { AdminShell } from "@/app/layouts/AdminShell";
import { AuthLayout } from "@/app/layouts/AuthLayout";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/home/DashboardPage";
import CommunitiesDiscoveryPage from "@/pages/communities/CommunitiesDiscoveryPage";
import CreateCommunityPage from "@/pages/communities/CreateCommunityPage";
import CommunityDetailPage from "@/pages/communities/CommunityDetailPage";
import PostDetailPage from "@/pages/communities/PostDetailPage";
import EventsPage from "@/pages/events/EventsPage";
import CreateEventPage from "@/pages/events/CreateEventPage";
import AiEventPlannerPage from "@/pages/events/AiEventPlannerPage";
import EventDetailPage from "@/pages/events/EventDetailPage";
import PeoplePage from "@/pages/people/PeoplePage";
import UserProfilePage from "@/pages/profile/UserProfilePage";
import MyProfilePage from "@/pages/profile/MyProfilePage";
import GamesHubPage from "@/pages/games/GamesHubPage";
import ChessGamePage from "@/pages/games/ChessGamePage";
import TicTacToeGamePage from "@/pages/games/TicTacToeGamePage";
import RockPaperScissorsGamePage from "@/pages/games/RockPaperScissorsGamePage";
import ConnectFourGamePage from "@/pages/games/ConnectFourGamePage";
import GameLeaderboardPage from "@/pages/games/GameLeaderboardPage";
import AiBuddyPage from "@/pages/ai-buddy/AiBuddyPage";
import WeeklyDigestPage from "@/pages/digest/WeeklyDigestPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import SearchResultsPage from "@/pages/search/SearchResultsPage";
import ForbiddenPage from "@/pages/errors/ForbiddenPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";

import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCommunitiesPage from "@/pages/admin/AdminCommunitiesPage";
import AdminModerationPage from "@/pages/admin/AdminModerationPage";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/home" replace /> },
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/home", element: <DashboardPage /> },
          { path: "/communities", element: <CommunitiesDiscoveryPage /> },
          { path: "/communities/create", element: <CreateCommunityPage /> },
          { path: "/communities/posts/:postId", element: <PostDetailPage /> },
          { path: "/communities/:slug", element: <CommunityDetailPage /> },
          { path: "/events", element: <EventsPage /> },
          { path: "/events/create", element: <CreateEventPage /> },
          { path: "/events/create/ai", element: <AiEventPlannerPage /> },
          { path: "/events/:eventId", element: <EventDetailPage /> },
          { path: "/people", element: <PeoplePage /> },
          { path: "/people/:userId", element: <UserProfilePage /> },
          { path: "/profile/me", element: <MyProfilePage /> },
          { path: "/settings/profile", element: <MyProfilePage /> },
          { path: "/games", element: <GamesHubPage /> },
          { path: "/games/leaderboard", element: <GameLeaderboardPage /> },
          { path: "/games/chess", element: <ChessGamePage /> },
          { path: "/games/tic-tac-toe", element: <TicTacToeGamePage /> },
          { path: "/games/rock-paper-scissors", element: <RockPaperScissorsGamePage /> },
          { path: "/games/connect-four", element: <ConnectFourGamePage /> },
          { path: "/ai-buddy", element: <AiBuddyPage /> },
          { path: "/digest", element: <WeeklyDigestPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/search", element: <SearchResultsPage /> },
        ],
      },
      {
        element: <RequireRole role="administrator" />,
        children: [
          {
            path: "/admin",
            element: <AdminShell />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "communities", element: <AdminCommunitiesPage /> },
              { path: "moderation", element: <AdminModerationPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "/403", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
