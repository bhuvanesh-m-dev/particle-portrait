/**
 * particle-portrait-face.js
 * Dynamically fetches and parses face coordinates.
 * Tries face_coordinates_with_color.txt first (x y r g b),
 * falls back to face_coordinates.txt (x y).
 *
 * Copyright (C) 2026 - Present Bhuvanesh M
 * Original Repository: https://github.com/bhuvanesh-m-dev/particle-portrait
 * SPDX-License-Identifier: GPL-3.0
 */

async function loadCoordinates() {
    // Prefer the colored version if it exists
    const candidates = [
        './face_coordinates_with_color.txt',
        './face_coordinates.txt'
    ];

    let text = null;
    let usedFile = null;

    for (const url of candidates) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                text = await response.text();
                usedFile = url;
                break;
            }
        } catch (e) {
            // try next
        }
    }

    if (!text) {
        throw new Error('Could not load face_coordinates_with_color.txt or face_coordinates.txt');
    }

    const lines = text.split('\n');
    const points = [];
    const colors = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/\s+/).map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            points.push([parts[0], parts[1]]);

            if (parts.length >= 5 && !isNaN(parts[2])) {
                // Colored data available
                colors.push([
                    Math.min(1, Math.max(0, parts[2])),
                    Math.min(1, Math.max(0, parts[3])),
                    Math.min(1, Math.max(0, parts[4]))
                ]);
            } else {
                // Neutral fallback
                colors.push([0.92, 0.92, 0.95]);
            }
        }
    }

    console.log(`✅ Loaded ${points.length} points from ${usedFile}` +
                (usedFile.includes('color') ? ' (with per-point colors)' : ''));
    return { points, colors };
}

export const facePointsPromise = loadCoordinates().catch(err => {
    console.error("❌ Error loading face coordinates:", err);
    return { points: [], colors: [] };
});
