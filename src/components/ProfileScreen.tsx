import type { PersonalityProfile } from '../utils/personality';
import type { SpotifyUser } from '../services/spotify';

interface ProfileScreenProps {
  user: SpotifyUser;
  profile: PersonalityProfile | null;
  loading: boolean;
  error: string | null;
  onLoadProfile: () => void;
  onLogout: () => void;
}

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-stone-500">{label}</span>
        <span className="text-stone-300">{value}%</span>
      </div>
      <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1DB954] rounded-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ProfileScreen({
  user,
  profile,
  loading,
  error,
  onLoadProfile,
  onLogout,
}: ProfileScreenProps) {
  const avatar = user.images?.[0]?.url;
  const displayName = user.display_name || (user.email ? user.email.split('@')[0] : null) || 'Listener';

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-xl text-white">Spotify Personality</span>
          <button
            onClick={onLogout}
            className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          {avatar && (
            <img
              src={avatar}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-xl font-medium text-white">
              Hello, {displayName}
            </h2>
            <p className="text-stone-500 text-sm">
              Your music tells a story. See what it says.
            </p>
          </div>
        </div>

        {!profile && !loading && (
          <button
            onClick={onLoadProfile}
            className="w-full py-4 px-6 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-white font-medium transition-colors"
          >
            Generate my personality profile
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            <p className="text-stone-500">Analyzing your listening habits...</p>
          </div>
        )}

        {error && (
          <div className="py-6 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {profile && !loading && (
          <div className="space-y-10">
            <section className="rounded-2xl border border-stone-800/60 p-8 bg-stone-900/30">
              <p className="text-[#1DB954] text-sm font-medium uppercase tracking-wider mb-2">
                Your Archetype
              </p>
              <h3 className="font-serif text-3xl md:text-4xl text-white mb-3">
                {profile.archetype}
              </h3>
              <p className="text-stone-400 leading-relaxed">
                {profile.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.traits.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-sm bg-stone-800/80 text-stone-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                Audio Profile
              </h4>
              <div className="space-y-4">
                <Bar value={profile.audioProfile.energy} label="Energy" />
                <Bar value={profile.audioProfile.danceability} label="Danceability" />
                <Bar value={profile.audioProfile.mood} label="Mood (valence)" />
                <Bar value={profile.audioProfile.acousticness} label="Acousticness" />
              </div>
            </section>

            <section>
              <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                Top Genres
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.topGenres.map((g) => (
                  <span
                    key={g}
                    className="px-4 py-2 rounded-lg bg-stone-800/60 text-stone-300 capitalize"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
