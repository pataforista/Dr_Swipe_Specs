import fs from 'fs';
import path from 'path';

const casesDir = path.join(process.cwd(), 'cases');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

const stats = {
  difficulty: {} as Record<string, number>,
  specialties: {} as Record<string, number>,
  totalCards: 0,
  bossFights: 0
};

files.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(casesDir, f), 'utf8'));
    
    // Difficulty
    const diff = data.difficulty || 'unknown';
    stats.difficulty[diff] = (stats.difficulty[diff] || 0) + 1;
    
    // Theme/Specialty
    const theme = data.theme_config || 'unknown';
    stats.specialties[theme] = (stats.specialties[theme] || 0) + 1;

    // Total Cards
    if (data.card_stream) {
      stats.totalCards += data.card_stream.length;
    }

    // Boss fights
    if (data.boss_fight_triad && data.boss_fight_triad.questions && data.boss_fight_triad.questions.length > 0) {
      stats.bossFights++;
    }
  } catch (e) {
    // skip
  }
});

console.log(JSON.stringify(stats, null, 2));
