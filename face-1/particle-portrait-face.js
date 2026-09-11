/**
 * particle-portrait-face.js
 * Dynamically fetches and parses face_coordinates.txt.
 * This avoids a massive hardcoded JS file and keeps the project lightweight.
 */

export const facePointsPromise = fetch('./face_coordinates.txt')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Check if face_coordinates.txt is in the same folder.`);
        }
        return response.text();
    })
    .then(text => {
        // Robust regex: matches optional minus, digits, a dot, and more digits.
        // This safely splits concatenated numbers like "-0.3410710.037500" 
        // into "-0.341071" and "0.037500".
        const matches = text.match(/-?\d+\.\d+/g);
        const points = [];
        
        if (matches) {
            for (let i = 0; i < matches.length - 1; i += 2) {
                points.push([
                    parseFloat(matches[i]), 
                    parseFloat(matches[i + 1])
                ]);
            }
        }
        
        console.log(`✅ Successfully loaded ${points.length} face points.`);
        return points;
    })
    .catch(err => {
        console.error("❌ Error parsing face coordinates:", err);
        return [];
    });