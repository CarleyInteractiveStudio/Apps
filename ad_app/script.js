import { supabase } from './supabase-client.js';

// --- App State ---
let currentUser = null;
let userProfile = null;
let activeVideo = null;
let watchTimeInterval = null;
let accumulatedWatchTime = 0;

// --- Main App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authPage = document.getElementById('auth-page');
    const adFeedPage = document.getElementById('ad-feed-page');
    const settingsPage = document.getElementById('settings-page');

    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const videoFeedContainer = document.getElementById('video-feed-container');
    const watchTimeTracker = document.getElementById('watch-time-tracker').querySelector('span');

    const settingsButton = document.getElementById('settings-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const logoutButton = document.getElementById('logout-button');
    const pointsBalance = document.getElementById('points-balance');

    // --- Page Navigation ---
    function showPage(pageElement) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        pageElement.classList.add('active');
    }

    // --- UI Toggles ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    // --- Auth Logic ---
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            alert(`Error al registrar: ${error.message}`);
        } else {
            alert('Registro exitoso. Por favor, revisa tu email para verificar tu cuenta.');
            showLoginLink.click(); // Programmatically click the link to switch forms
        }
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert(`Error al iniciar sesión: ${error.message}`);
        } else if (data.user) {
            // Use the user from the successful login to initialize the app
            currentUser = data.user;
            userProfile = await fetchUserProfile(currentUser.id);
            if (userProfile) {
                updateUI();
                initializeFeed();
                showPage(adFeedPage);
            } else {
                alert("Error: No se pudo cargar el perfil del usuario.");
                await supabase.auth.signOut();
                showPage(authPage);
            }
        }
    });

    // --- Settings Logic ---
    settingsButton.addEventListener('click', () => {
        if (activeVideo) {
            activeVideo.pause();
            stopWatchTimeTracking();
            syncWatchTime();
            activeVideo = null;
        }
        if (userProfile) {
            pointsBalance.textContent = userProfile.points;
        }
        showPage(settingsPage);
    });

    closeSettingsButton.addEventListener('click', () => {
        showPage(adFeedPage);
    });

    logoutButton.addEventListener('click', async () => {
        stopWatchTimeTracking();
        await syncWatchTime();
        await supabase.auth.signOut();
        currentUser = null;
        userProfile = null;
        accumulatedWatchTime = 0;
        showPage(authPage);
    });

    // --- Video Feed Logic ---
    async function syncWatchTime() {
        if (accumulatedWatchTime < 1) return;
        const timeToSync = accumulatedWatchTime;
        accumulatedWatchTime = 0;

        try {
            const { data, error } = await supabase.functions.invoke('update-watch-time', { body: { watchTime: timeToSync } });
            if (error) throw error;
            userProfile.points = data.points;
            userProfile.watch_time_progress = data.watch_time_progress;
            updateUI();
        } catch (error) {
            console.error("Error syncing watch time:", error.message);
            accumulatedWatchTime += timeToSync;
        }
    }

    function updateUI() {
        if (!userProfile) return;
        const totalTime = userProfile.watch_time_progress + accumulatedWatchTime;
        watchTimeTracker.textContent = `Tiempo: ${totalTime.toFixed(1)}s`;
        pointsBalance.textContent = userProfile.points;
    }

    function startWatchTimeTracking() {
        if (watchTimeInterval) clearInterval(watchTimeInterval);
        watchTimeInterval = setInterval(() => {
            accumulatedWatchTime += 0.1;
            updateUI();
        }, 100);
    }

    function stopWatchTimeTracking() {
        if (watchTimeInterval) {
            clearInterval(watchTimeInterval);
            watchTimeInterval = null;
        }
    }

    function initializeFeed() {
        const options = { root: videoFeedContainer, threshold: 0.5 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target.querySelector('video');
                if (entry.isIntersecting) {
                    video.play().catch(e => console.error("Video play failed", e));
                    activeVideo = video;
                    startWatchTimeTracking();
                } else {
                    video.pause();
                    if (activeVideo === video) {
                        stopWatchTimeTracking();
                        syncWatchTime();
                        activeVideo = null;
                    }
                }
            });
        }, options);
        document.querySelectorAll('.video-slide').forEach(slide => observer.observe(slide));
        setInterval(syncWatchTime, 5000);
    }

    async function fetchUserProfile(userId) {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    }

    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            userProfile = await fetchUserProfile(currentUser.id);
            if (userProfile) {
                updateUI();
                initializeFeed();
                showPage(adFeedPage);
            } else {
                alert("Error: No se pudo cargar el perfil del usuario.");
                await supabase.auth.signOut();
                showPage(authPage);
            }
        } else {
            showPage(authPage);
        }
    }

    // Initial check
    checkSession();
});
