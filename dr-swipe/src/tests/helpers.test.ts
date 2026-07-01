import { describe, it, expect } from 'vitest';
import { cleanMentorComment, shuffleBossQuestion } from '../utils/formatters';
import { parseVitalsFromText } from '../utils/vitalsParser';
import type { BossQuestion, Card } from '../types/game';

describe('formatters unit tests', () => {
  describe('cleanMentorComment', () => {
    const mockCard: Pick<Card, 'expected_action' | 'safety_flags'> = {
      expected_action: "keep",
      safety_flags: {}
    };

    it('should format correct response comments cleanly', () => {
      const comment = '¡Excelente! El paciente muestra mejoría con la dosis estándar.';
      const result = cleanMentorComment(comment, true, mockCard);
      expect(result).toBe('Correcto. El paciente muestra mejoría con la dosis estándar.');
    });

    it('should format wrong response comments with critical alert', () => {
      const comment = 'Se debe intubar de inmediato.';
      const criticalCard = { ...mockCard, safety_flags: { lethal_risk: true } };
      const result = cleanMentorComment(comment, false, criticalCard);
      expect(result).toBe('☠️ LETAL SI SE ACEPTA: Se debe intubar de inmediato.');
    });

    it('should format wrong response comment for key data omission', () => {
      const comment = 'Es un signo de alarma importante.';
      const result = cleanMentorComment(comment, false, mockCard);
      expect(result).toBe('🎯 DATO CLAVE OMITIDO: Es un signo de alarma importante.');
    });
  });

  describe('shuffleBossQuestion', () => {
    it('should shuffle options and update correct_index correctly', () => {
      const question: BossQuestion = {
        question: "Select A",
        options: ["Option A", "Option B", "Option C"],
        correct_index: 0
      };
      
      const shuffled = shuffleBossQuestion(question);
      
      expect(shuffled.options).toHaveLength(3);
      // Correct option should match the index of "Option A" in shuffled options
      const expectedCorrectOption = shuffled.options[shuffled.correct_index];
      expect(expectedCorrectOption).toBe("Option A");
    });
  });
});

describe('vitalsParser unit tests', () => {
  describe('parseVitalsFromText', () => {
    it('should parse simple vitals and label status', () => {
      const text = "El paciente reporta TA 120/80, FC 80, y T 36.5";
      const result = parseVitalsFromText(text);
      expect(result).not.toBeNull();
      expect(result?.ta).toBe("120/80");
      expect(result?.fc).toBe(80);
      expect(result?.temp).toBe(36.5);
      expect(result?.status).toBe("normal");
    });

    it('should return critical status for extreme heart rate', () => {
      const text = "Paciente inconsciente con FC 130 y TA 90/50";
      const result = parseVitalsFromText(text);
      expect(result?.status).toBe("critical");
    });

    it('should return alert status for mild fever', () => {
      const text = "Temperatura de T 37.8";
      const result = parseVitalsFromText(text);
      expect(result?.status).toBe("alert");
    });
  });
});
