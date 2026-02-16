import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { LoginScreen } from './components/LoginScreen';
import { ProfileScreen } from './components/ProfileScreen';

function App() {
  const {
    status,
    user,
    profile,
    error,
    loadingProfile,
    login,
    logout,
    loadProfile,
  } = useSpotifyAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-[#1DB954] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginScreen onLogin={login} />;
  }

  if (user) {
    return (
      <ProfileScreen
        user={user}
        profile={profile}
        loading={loadingProfile}
        error={error}
        onLoadProfile={loadProfile}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-600 border-t-[#1DB954] rounded-full animate-spin" />
    </div>
  );
}

export default App;
