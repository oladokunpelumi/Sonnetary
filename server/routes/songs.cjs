const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /api/songs — return all songs
router.get('/', (req, res) => {
    try {
        const songs = db.prepare('SELECT * FROM songs').all();
        const formatted = songs.map(song => ({
            id: String(song.id),
            title: song.title,
            genre: song.genre,
            duration: song.duration,
            description: song.description,
            coverUrl: song.cover_url,
            artist: song.artist,
            tags: song.tags ? JSON.parse(song.tags) : [],
            audioUrl: song.audio_url,
            story: song.story
        }));
        res.json(formatted);
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

// GET /api/songs/:id — return single song
router.get('/:id', (req, res) => {
    try {
        const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
        if (!song) return res.status(404).json({ error: 'Song not found' });

        res.json({
            id: String(song.id),
            title: song.title,
            genre: song.genre,
            duration: song.duration,
            description: song.description,
            coverUrl: song.cover_url,
            artist: song.artist,
            tags: song.tags ? JSON.parse(song.tags) : [],
            audioUrl: song.audio_url,
            story: song.story
        });
    } catch (err) {
        console.error('Error fetching song:', err);
        res.status(500).json({ error: 'Failed to fetch song' });
    }
});

module.exports = router;
