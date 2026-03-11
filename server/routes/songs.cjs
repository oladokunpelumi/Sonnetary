const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// Detect adapter: SQLite has .prepare(), Postgres adapter has .all() as an async function
const isPostgres = typeof db.prepare !== 'function';

function formatSong(song) {
    return {
        id: String(song.id),
        title: song.title,
        genre: song.genre,
        duration: song.duration,
        description: song.description,
        coverUrl: song.cover_url,
        artist: song.artist,
        tags: song.tags ? JSON.parse(song.tags) : [],
        audioUrl: song.audio_url,
        story: song.story,
    };
}

// GET /api/songs — return all songs
router.get('/', async (req, res) => {
    try {
        let songs;
        if (isPostgres) {
            songs = await db.all('SELECT * FROM songs ORDER BY id ASC');
        } else {
            songs = db.prepare('SELECT * FROM songs ORDER BY id ASC').all();
        }
        res.json(songs.map(formatSong));
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

// GET /api/songs/:id — return single song
router.get('/:id', async (req, res) => {
    try {
        let song;
        if (isPostgres) {
            song = await db.get('SELECT * FROM songs WHERE id = $1', [req.params.id]);
        } else {
            song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
        }
        if (!song) return res.status(404).json({ error: 'Song not found' });
        res.json(formatSong(song));
    } catch (err) {
        console.error('Error fetching song:', err);
        res.status(500).json({ error: 'Failed to fetch song' });
    }
});

module.exports = router;
