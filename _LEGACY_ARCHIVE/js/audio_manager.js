export class AudioManager {
    constructor() {
        this.sounds = {
            swipe: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Simple pop
            correct: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Ding
            wrong: 'https://assets.mixkit.co/active_storage/sfx/21/21-preview.mp3', // Buzzish
            finish: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' // Fanfare
        };
        this.audioObjects = {};
        this.init();
    }

    init() {
        for (const [key, url] of Object.entries(this.sounds)) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            this.audioObjects[key] = audio;
        }
    }

    play(soundName) {
        const audio = this.audioObjects[soundName];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio play failed:", e));
        }
    }
}
