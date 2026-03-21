// ── PostgreSQL support ────────────────────────────────────────────────────────
// If DATABASE_URL is set, initialize PostgreSQL schema and re-export the pg adapter.
// Routes that need async pg queries import from './db-postgres.cjs' directly.
if (process.env.DATABASE_URL) {
    const pg = require('./db-postgres.cjs');
    pg.initSchema().catch(err => {
        console.error('[PostgreSQL] Schema init failed:', err.message);
        process.exit(1);
    });
    module.exports = pg; // Export pg adapter — all consumers must use async/await
    return; // Skip SQLite setup below
}

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'yourgbedu.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    artist TEXT,
    tags TEXT, -- JSON array
    audio_url TEXT,
    story TEXT
  );


  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    song_title TEXT,
    genre TEXT,
    mood TEXT,
    tempo INTEGER,
    occasion TEXT,
    story TEXT,
    status TEXT DEFAULT 'in_production',
    created_at TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    stripe_session_id TEXT,
    paystack_reference TEXT,
    amount INTEGER DEFAULT 30000
  );
`);

// Safe migrations for new columns
try { db.exec("ALTER TABLE orders ADD COLUMN recipient_type TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN sender_name TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN voice_gender TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN special_qualities TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN favorite_memories TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN special_message TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN customer_email TEXT"); } catch (err) { }
try { db.exec("ALTER TABLE orders ADD COLUMN ai_brief TEXT"); } catch (err) { }



// Seed songs if table is empty
const songCount = db.prepare('SELECT COUNT(*) as count FROM songs').get();

if (songCount.count === 0) {
  const insertSong = db.prepare(`
    INSERT INTO songs (title, genre, duration, description, cover_url, artist, tags, audio_url, story)
    VALUES (@title, @genre, @duration, @description, @cover_url, @artist, @tags, @audio_url, @story)
  `);

  const seedSongs = [
    {
      title: 'Like Roses (You Are Your Name)',
      genre: 'Afro-R&B',
      duration: '4:03',
      description: '"We met at a coffee shop on a rainy Tuesday. I spilled my latte, he laughed, and now every moment feels like roses blooming."',
      cover_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn8xOssl2ppe5twvI7LYDeLGPnmv-mo9yVKKzEBlA6LDDxKmJmEZ4iOXN1t9pT2eiVrYMzuuUqhoHRRyrHnVkB4fuBScfeRLGc__QeeJKM40nGNE0vBX1OaYrCxt-0Y_BalNBilpXI8jzgTrw3FVN9LUvUsAZg7IeBVXn5JKh2S7RS4dJYv6V0UJtqqhyY8PIR35JSwhd1Gdzm3vcpCaNrncnlxrt7QVGUc7N7axoppfVPDUPVHokSBBRd5cv3Nmb--XvVB7Tbkg',
      artist: 'First Love',
      tags: JSON.stringify(['First Date', 'Love']),
      audio_url: '/musics/Like Roses ( You Are Your Name).mp3',
      story: 'A first date love story turned into a romantic Afro-R&B track.'
    },
    {
      title: 'Mimi (Give Me Wealth)',
      genre: 'Afro-Beats',
      duration: '1:47',
      description: '"For her milestone birthday, we wanted to capture her radiant energy, her love for life, and the joy she brings to everyone around her."',
      cover_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvKxuOtg_3IVmm0l8rcnPdVJtKIB_iOtBYdQdMm6nAYydMOsmIgiQlkbKvqIGiUjpvMotWmPV1rjbepTXfuVlEnepVvxv_dNkUubkUik5OZS2QKArjhKO0nav02SQm90Tk8rTYfZ-PFsaBa8-7CNDLdMDNlyFXKvbjg5Rv00_OrMmS6nCMKnlNZFnXCrYO1QpQUSrVfMW_AO72eUtnnJV0ihDT08TkpolfbndIJxKz-KLWNGNiv7Xqb-31b5ely4qUhLJg0GozHw',
      artist: 'The Family',
      tags: JSON.stringify(['Birthday', 'Celebration']),
      audio_url: '/musics/Mimi (Give Me Wealth)".mp3',
      story: 'A birthday celebration song full of Afrobeats energy.'
    },
    {
      title: 'Baby Steps',
      genre: 'Gospel',
      duration: '2:58',
      description: '"Welcoming our first child was magic. We wanted a song that we could hum to her every night as she drifts off to sleep."',
      cover_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJHdoLF0pZDcWvJt_PYJ2omO4zgo2pXdiE-vRWknOLG7l8xuEupdb0lbuiu5D963dwT0dvFR8hcoScud5gLUvctPAR5csY0_2My3OQzi4v1zJ06tXK14IWUke0Y0QxExxpa3qEUHKoPTy_tlhTuj31_h732NM8VHCvSQjAo1C4bPCLdaFipVOwUbp-Xsxznwfhx4dfqixZfuSda89J64oBpG7Di6vr9hmY6O_a0o9P5sNi6aSLRRI3zkhulZ0qxCEh9vlh_szUg',
      artist: 'New Parents',
      tags: JSON.stringify(['Newborn', 'Magic']),
      audio_url: null,
      story: 'A gentle lullaby for a newborn child.'
    },
    {
      title: 'Valentine',
      genre: 'Afro-R&B',
      duration: '2:30',
      description: '"A song to celebrate our love and all the wonderful moments we share."',
      cover_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJHdoLF0pZDcWvJt_PYJ2omO4zgo2pXdiE-vRWknOLG7l8xuEupdb0lbuiu5D963dwT0dvFR8hcoScud5gLUvctPAR5csY0_2My3OQzi4v1zJ06tXK14IWUke0Y0QxExxpa3qEUHKoPTy_tlhTuj31_h732NM8VHCvSQjAo1C4bPCLdaFipVOwUbp-Xsxznwfhx4dfqixZfuSda89J64oBpG7Di6vr9hmY6O_a0o9P5sNi6aSLRRI3zkhulZ0qxCEh9vlh_szUg',
      artist: 'Lovers',
      tags: JSON.stringify(['Valentine', 'Romance']),
      audio_url: '/musics/Valentine.mp3',
      story: 'A perfectly crafted pop electronic song dedicated to an amazing valentine.'
    }
  ];

  const insertMany = db.transaction((songs) => {
    for (const song of songs) {
      insertSong.run(song);
    }
  });

  insertMany(seedSongs);
  console.log('✅ Seeded 4 songs into database');
}

module.exports = db;
