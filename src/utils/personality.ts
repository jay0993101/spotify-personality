import type { SpotifyArtist, SpotifyTrack } from '../services/spotify';
import type { AudioFeatures } from '../services/spotify';

export interface PersonalityProfile {
  archetype: string;
  description: string;
  traits: string[];
  genreMix: string[];
  audioProfile: {
    energy: number;
    danceability: number;
    mood: number;
    acousticness: number;
  };
  topGenres: string[];
  vibe: string;
}

function normalize(v: number): number {
  return Math.round(Math.min(100, Math.max(0, v * 100)));
}

export function buildPersonalityProfile(
  artists: SpotifyArtist[],
  _tracks: SpotifyTrack[],
  audioFeatures: AudioFeatures[]
): PersonalityProfile {
  const allGenres = artists.flatMap((a) => a.genres);
  const genreCounts = allGenres.reduce<Record<string, number>>((acc, g) => {
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([g]) => g);

  const avgFeatures =
    audioFeatures.length > 0
      ? audioFeatures.reduce(
          (acc, f) => ({
            danceability: acc.danceability + f.danceability,
            energy: acc.energy + f.energy,
            valence: acc.valence + f.valence,
            acousticness: acc.acousticness + f.acousticness,
          }),
          { danceability: 0, energy: 0, valence: 0, acousticness: 0 }
        )
      : { danceability: 0.5, energy: 0.5, valence: 0.5, acousticness: 0.3 };

  const n = Math.max(1, audioFeatures.length);
  const audioProfile = {
    energy: normalize(avgFeatures.energy / n),
    danceability: normalize(avgFeatures.danceability / n),
    mood: normalize(avgFeatures.valence / n),
    acousticness: normalize(avgFeatures.acousticness / n),
  };

  const { energy, danceability, mood, acousticness } = audioProfile;

  let archetype = 'The Eclectic';
  let description = 'Your taste spans many moods and genres.';
  let traits: string[] = ['Open-minded', 'Curious', 'Adventurous'];
  let vibe = 'versatile';

  if (energy > 70 && danceability > 60) {
    archetype = 'The Energy Seeker';
    description =
      'You live for high-energy, danceable tracks. Your playlists keep the party going.';
    traits = ['Energetic', 'Social', 'Upbeat'];
    vibe = 'high-octane';
  } else if (mood < 40 && acousticness > 50) {
    archetype = 'The Melancholic';
    description =
      'You gravitate toward introspective, acoustic-leaning sounds. Music is your sanctuary.';
    traits = ['Introspective', 'Thoughtful', 'Sensitive'];
    vibe = 'introspective';
  } else if (acousticness > 60 && energy < 50) {
    archetype = 'The Chill Seeker';
    description =
      'You prefer relaxed, organic sounds. Low-key vibes are your default.';
    traits = ['Calm', 'Grounded', 'Selective'];
    vibe = 'chill';
  } else if (danceability > 65 && energy > 55) {
    archetype = 'The Groove Master';
    description =
      'Rhythm drives your listening. You appreciate grooves and beats that move.';
    traits = ['Rhythmic', 'Expressive', 'Playful'];
    vibe = 'groovy';
  } else if (mood > 65) {
    archetype = 'The Optimist';
    description =
      'You lean into upbeat, positive music. Your soundtrack tends to be bright.';
    traits = ['Positive', 'Resilient', 'Hopeful'];
    vibe = 'bright';
  } else if (topGenres.some((g) => /indie|alternative|folk/i.test(g))) {
    archetype = 'The Tastemaker';
    description =
      'You dig beyond the mainstream. Your taste is distinctive and curated.';
    traits = ['Discerning', 'Independent', 'Authentic'];
    vibe = 'curated';
  }

  return {
    archetype,
    description,
    traits,
    genreMix: topGenres,
    audioProfile,
    topGenres,
    vibe,
  };
}
