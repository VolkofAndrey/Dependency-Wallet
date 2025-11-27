
const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'; // Positive Chime
const FAIL_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2841/2841-preview.mp3'; // Cartoon Spring Boing
const ACHIEVEMENT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'; // Celebration Fanfare

const audioCache: Record<string, HTMLAudioElement> = {};

const preloadAudio = (url: string) => {
    try {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audioCache[url] = audio;
    } catch (e) {
        console.error("Audio preload failed", e);
    }
};

// Preload sounds
preloadAudio(SUCCESS_SOUND);
preloadAudio(FAIL_SOUND);
preloadAudio(ACHIEVEMENT_SOUND);

export const playSound = (type: 'success' | 'fail' | 'achievement') => {
    let url = '';
    switch (type) {
        case 'success': url = SUCCESS_SOUND; break;
        case 'fail': url = FAIL_SOUND; break;
        case 'achievement': url = ACHIEVEMENT_SOUND; break;
    }

    if (url) {
        try {
            const audio = audioCache[url] || new Audio(url);
            audio.currentTime = 0;
            audio.volume = 0.5;
            audio.play().catch(err => console.warn('Audio play prevented:', err));
        } catch (e) {
            console.error("Error playing sound", e);
        }
    }
};
