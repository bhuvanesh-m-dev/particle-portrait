/**
 * particle-portrait.js
 * Three.js scene, particle system, line-by-line assembly animation
 * with support for per-point colors extracted from the portrait.
 *
 * Copyright (C) 2026 - Present Bhuvanesh M
 * Original Repository: https://github.com/bhuvanesh-m-dev/particle-portrait
 * SPDX-License-Identifier: GPL-3.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { facePointsPromise } from './particle-portrait-face.js';

facePointsPromise.then(({ points: facePoints, colors: faceColors }) => {
    const N = facePoints.length;
    if (N === 0) {
        console.error("No face points loaded. Animation aborted.");
        return;
    }

    // --- 1. Renderer & Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 50);
    camera.position.set(0, 0.02, 2.85);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 1.25;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.02, 0);

    // --- 2. Particle System Setup ---
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const targets = new Float32Array(N * 3);
    const starts = new Float32Array(N * 3);

    // Find vertical range for band-based animation
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < N; i++) {
        const y = facePoints[i][1];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    const faceHeight = maxY - minY;
    const BAND_H = 0.028;
    const BAND_DELAY = 0.15;
    const MOVE_DURATION = 1.8;

    function easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    }

    // Build start / target / color arrays
    for (let i = 0; i < N; i++) {
        const x = facePoints[i][0];
        const y = facePoints[i][1];

        // Target position (slight micro-depth)
        const microZ = (Math.random() - 0.5) * 0.012;
        targets[i * 3]     = x;
        targets[i * 3 + 1] = y;
        targets[i * 3 + 2] = microZ;

        // Start position (scattered behind)
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.25 + Math.random() * 1.35;
        starts[i * 3]     = x + Math.cos(ang) * rad * 0.65;
        starts[i * 3 + 1] = y + (Math.random() - 0.5) * 1.05;
        starts[i * 3 + 2] = -4.8 - Math.random() * 3.2;

        // Initial position
        positions[i * 3]     = starts[i * 3];
        positions[i * 3 + 1] = starts[i * 3 + 1];
        positions[i * 3 + 2] = starts[i * 3 + 2];

        // Color from the extracted portrait data
        const c = faceColors[i] || [0.9, 0.9, 0.95];
        colors[i * 3]     = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft particle material with vertex colors
    const material = new THREE.PointsMaterial({
        size: 0.0055,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // --- 3. Animation Loop ---
    let startTime = performance.now();
    let isAnimating = true;

    function resetAnimation() {
        startTime = performance.now();
        isAnimating = true;
        for (let i = 0; i < N; i++) {
            positions[i * 3]     = starts[i * 3];
            positions[i * 3 + 1] = starts[i * 3 + 1];
            positions[i * 3 + 2] = starts[i * 3 + 2];
        }
        geometry.attributes.position.needsUpdate = true;
    }

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            resetAnimation();
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = (performance.now() - startTime) / 1000;

        if (isAnimating) {
            let finishedCount = 0;
            for (let i = 0; i < N; i++) {
                const ty = targets[i * 3 + 1];
                const band = Math.floor((maxY - ty) / BAND_H);
                const startT = band * BAND_DELAY;

                let t = (elapsed - startT) / MOVE_DURATION;
                if (t < 0) t = 0;
                else if (t > 1) {
                    t = 1;
                    finishedCount++;
                }

                t = easeOutQuint(t);

                positions[i * 3]     = starts[i * 3]     + (targets[i * 3]     - starts[i * 3])     * t;
                positions[i * 3 + 1] = starts[i * 3 + 1] + (targets[i * 3 + 1] - starts[i * 3 + 1]) * t;
                positions[i * 3 + 2] = starts[i * 3 + 2] + (targets[i * 3 + 2] - starts[i * 3 + 2]) * t;
            }

            geometry.attributes.position.needsUpdate = true;
            if (finishedCount === N) isAnimating = false;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    animate();
});
