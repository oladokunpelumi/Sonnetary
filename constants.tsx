
import { Genre, Mood } from './types';

export const GENRES: { name: Genre; desc: string; icon: string }[] = [
  { name: 'Acoustic Pop' as any, desc: 'Intimate & Raw', icon: 'piano' },
  { name: 'Cinematic', desc: 'Grand & Emotional', icon: 'movie' },
  { name: 'Neo-Soul', desc: 'Smooth & Groovy', icon: 'queue_music' },
  { name: 'Afrobeats' as any, desc: 'Vibrant & Rhythmic', icon: 'music_note' },
];

export const MOODS: { name: Mood; icon: string; img: string }[] = [
  { name: 'Nostalgic', icon: 'history_edu', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkWXZkqIJoemByHZfGIz0moxYQsHJFsq7pOkrAaXwhXAjrmLJ-cIz2Jaf7pQqv-Vv6eChJHhSmsj11s6mivOxdMORFzGQ5zU2GYa_LUqyP1chDgxwohv5wwYPB9ouVJhYmKqPJNTtPlwhhRQhR9bG3FCWUsrEYEg5JMno5yKCCOR8XEEXwescXfkYd8fcqs_3qnCSnY4iYotobpPrQqWygLOc0rIRF45_VUfBb4jc2ofSdEQlPs_D41beosQzje-gRc4fEjySdpQ' },
  { name: 'Upbeat', icon: 'bolt', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBuNeOIWUItoR5KQYZvCXH73oTa53ZrzoloepIjhJTTjFfCpx-WSyw6auEeOUkp1wMRyOseJCoenCHHelq5ZPCyLM0GbRKCP6xeogToprDh2sEIde0v1bp0uPOLOzR-oxSHQY0EgBuI_ml-pXAugAOuXhI6IPmuv-STx5Gc4u2KYHaMdtyyvy2zt0rfWqG18nSMubw5Go9frJtsihR2FCGPHp2TkswKIv-m6YXCb4NXqJFHKNcPalzthJsiDkodwDFXh8k7cYZSw' },
  { name: 'Romantic', icon: 'favorite', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Dfw9-PDleiLVoAIZLrGUvO9qjlpt5s4poIl_xzG34LHTTY9YyBZ_T578qdsiR1cdFUxuPzPBDmUe7TWRB1S_GtpbgFRDL96uLNuWulvoBVy5CjUvLqdzzNku7cr53VlmctItfsRUJUf6wMecZ6f07unj9ckiDN2ToP6olp4-e7C2OxmMpkrtahtyxr-2M4RhSowmDFla3WKbrDZZD2j4UWU7z5xWJVxCfpPuUw7JoFXZ8fdYZolgpK3krbWw4tqwpWluFGmEoA' },
  { name: 'Melancholic', icon: 'cloudy_snowing', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnjaO6YYEdtpaGgOeYjmMjycLvOg00DM40fLnw-bNEEhr9Y7UsWnwhHwA2zFoNncvNk1dsm7zN9IOrMIiyxyhcotIZYf4zZATOm5wC8k0AffponzAYMD3tVTmPPfKWiBGxibR_zIMPpaSbwgn5wDbafdApkhwF2viiX6VY28yEoHuyKhkX568epSw3VsCBqhMsecKbPmv0wKD5NPXatCjS9HpC6kyyQmQU53u6IQd--fWR2vLce5D7IiVx0Lzs5TxrBi_XkGIlCA' }
];
