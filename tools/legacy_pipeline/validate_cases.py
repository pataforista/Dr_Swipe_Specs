#!/usr/bin/env python3
"""
Double Check Validation Script for Dr. Swipe Cases
Validates structure, integrity, and consistency of all test cases.
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Tuple
import sys

class CaseValidator:
    def __init__(self, cases_dir: str):
        self.cases_dir = Path(cases_dir)
        self.errors = []
        self.warnings = []
        self.validated_count = 0
        self.total_cases = 0

    def validate_all(self):
        """Validate all cases in the directory."""
        case_files = sorted([f for f in self.cases_dir.glob("*.json") if f.name.startswith("CASE_")])
        self.total_cases = len(case_files)

        print(f"🔍 Iniciando validación de {self.total_cases} casos...\n")

        for idx, case_file in enumerate(case_files, 1):
            try:
                with open(case_file, 'r', encoding='utf-8') as f:
                    case_data = json.load(f)

                # Validate case structure
                self._validate_case_structure(case_file.name, case_data)
                self.validated_count += 1

                # Progress indicator
                if idx % 100 == 0:
                    print(f"  ✓ {idx}/{self.total_cases} casos validados...")

            except json.JSONDecodeError as e:
                self.errors.append(f"{case_file.name}: JSON inválido - {str(e)}")
            except Exception as e:
                self.errors.append(f"{case_file.name}: Error inesperado - {str(e)}")

        return self.generate_report()

    def _validate_case_structure(self, filename: str, case: Dict):
        """Validate the structure of a single case."""
        # Required top-level fields
        required_fields = ['case_id', 'version', 'theme_config', 'patient_intro', 'card_stream']
        for field in required_fields:
            if field not in case:
                self.errors.append(f"{filename}: Falta campo requerido '{field}'")
                return

        # Validate patient_intro
        self._validate_patient_intro(filename, case.get('patient_intro', {}))

        # Validate card_stream
        self._validate_card_stream(filename, case.get('card_stream', []))

        # Validate boss_fight_triad if exists
        if 'boss_fight_triad' in case:
            self._validate_boss_fight(filename, case['boss_fight_triad'])

        # Validate enarm_pearl if exists
        if 'enarm_pearl' in case:
            self._validate_enarm_pearl(filename, case['enarm_pearl'])

        # Validate case_id format
        if not isinstance(case.get('case_id'), str) or not case['case_id'].strip():
            self.errors.append(f"{filename}: case_id vacío o inválido")

    def _validate_patient_intro(self, filename: str, patient_intro: Dict):
        """Validate patient_intro section."""
        if not isinstance(patient_intro, dict):
            self.errors.append(f"{filename}: patient_intro debe ser un objeto")
            return

        required = ['name', 'arrival_scenario']
        for field in required:
            if field not in patient_intro:
                self.errors.append(f"{filename}: Falta campo '{field}' en patient_intro")
            elif not isinstance(patient_intro[field], str) or not patient_intro[field].strip():
                self.errors.append(f"{filename}: '{field}' vacío en patient_intro")

        # Validate time_limit_sec if present
        if 'time_limit_sec' in patient_intro:
            if not isinstance(patient_intro['time_limit_sec'], int) or patient_intro['time_limit_sec'] <= 0:
                self.errors.append(f"{filename}: time_limit_sec debe ser un entero positivo")

    def _validate_card_stream(self, filename: str, card_stream: List):
        """Validate card_stream array."""
        if not isinstance(card_stream, list) or len(card_stream) == 0:
            self.errors.append(f"{filename}: card_stream debe ser un array no vacío")
            return

        valid_actions = {'keep', 'discard'}

        for idx, card in enumerate(card_stream):
            if not isinstance(card, dict):
                self.errors.append(f"{filename}: card[{idx}] debe ser un objeto")
                continue

            # Required card fields
            card_required = ['card_id', 'category', 'card_text', 'expected_action', 'scoring']
            for field in card_required:
                if field not in card:
                    self.errors.append(f"{filename}: card[{idx}] falta campo '{field}'")

            # Validate expected_action
            if card.get('expected_action') not in valid_actions:
                self.errors.append(f"{filename}: card[{idx}] expected_action inválido: {card.get('expected_action')}")

            # Validate scoring
            self._validate_scoring(filename, idx, card.get('scoring', {}))

            # Check safety_flags consistency if present
            if 'safety_flags' in card:
                if not isinstance(card['safety_flags'], dict):
                    self.errors.append(f"{filename}: card[{idx}] safety_flags debe ser un objeto")

    def _validate_scoring(self, filename: str, card_idx: int, scoring: Dict):
        """Validate scoring section."""
        if not isinstance(scoring, dict):
            self.errors.append(f"{filename}: card[{card_idx}] scoring debe ser un objeto")
            return

        if 'points' not in scoring:
            self.errors.append(f"{filename}: card[{card_idx}] falta 'points' en scoring")
        elif not isinstance(scoring['points'], int) or scoring['points'] < 0:
            self.errors.append(f"{filename}: card[{card_idx}] points debe ser un entero no negativo")

        if 'error_type' in scoring:
            valid_error_types = {'none', 'hoarding', 'omission', 'lethal_omission', 'wrong_action', 'lethal_hazard', 'lethal_commission'}
            if scoring['error_type'] not in valid_error_types:
                self.warnings.append(f"{filename}: card[{card_idx}] error_type inusual: {scoring['error_type']}")

    def _validate_boss_fight(self, filename: str, boss_fight: Dict):
        """Validate boss_fight_triad section."""
        if not isinstance(boss_fight, dict):
            self.errors.append(f"{filename}: boss_fight_triad debe ser un objeto")
            return

        if 'questions' not in boss_fight:
            self.errors.append(f"{filename}: boss_fight_triad falta 'questions'")
            return

        questions = boss_fight['questions']
        if not isinstance(questions, list) or len(questions) == 0:
            self.errors.append(f"{filename}: boss_fight_triad 'questions' debe ser un array no vacío")
            return

        for q_idx, question in enumerate(questions):
            if not isinstance(question, dict):
                self.errors.append(f"{filename}: question[{q_idx}] debe ser un objeto")
                continue

            if 'question' not in question:
                self.errors.append(f"{filename}: question[{q_idx}] falta 'question'")

            if 'options' not in question or not isinstance(question['options'], list):
                self.errors.append(f"{filename}: question[{q_idx}] 'options' debe ser un array")
                continue

            if 'correct_index' not in question:
                self.errors.append(f"{filename}: question[{q_idx}] falta 'correct_index'")
            elif not isinstance(question['correct_index'], int):
                self.errors.append(f"{filename}: question[{q_idx}] 'correct_index' debe ser un entero")
            elif question['correct_index'] >= len(question.get('options', [])):
                self.errors.append(f"{filename}: question[{q_idx}] 'correct_index' fuera de rango")

    def _validate_enarm_pearl(self, filename: str, pearl: Dict):
        """Validate enarm_pearl section."""
        if not isinstance(pearl, dict):
            self.errors.append(f"{filename}: enarm_pearl debe ser un objeto")
            return

        required = ['title', 'text']
        for field in required:
            if field not in pearl:
                self.warnings.append(f"{filename}: enarm_pearl falta '{field}'")
            elif not isinstance(pearl[field], str) or not pearl[field].strip():
                self.warnings.append(f"{filename}: enarm_pearl '{field}' vacío")

    def generate_report(self) -> Tuple[int, List, List]:
        """Generate validation report."""
        print("\n" + "="*70)
        print("📊 REPORTE DE VALIDACIÓN DE CASOS")
        print("="*70)

        print(f"\n✓ Casos validados exitosamente: {self.validated_count}/{self.total_cases}")

        if self.errors:
            print(f"\n❌ ERRORES ENCONTRADOS: {len(self.errors)}")
            print("-" * 70)
            # Group errors by type
            error_groups = {}
            for error in self.errors:
                error_type = error.split(':')[1].strip().split()[0] if ':' in error else 'Otro'
                if error_type not in error_groups:
                    error_groups[error_type] = []
                error_groups[error_type].append(error)

            for error_type, errors in sorted(error_groups.items()):
                print(f"\n  {error_type} ({len(errors)}):")
                for error in errors[:5]:  # Show first 5 of each type
                    print(f"    • {error}")
                if len(errors) > 5:
                    print(f"    ... y {len(errors) - 5} más")
        else:
            print(f"\n✅ ¡Sin errores detectados!")

        if self.warnings:
            print(f"\n⚠️  ADVERTENCIAS: {len(self.warnings)}")
            print("-" * 70)
            for warning in self.warnings[:10]:
                print(f"  • {warning}")
            if len(self.warnings) > 10:
                print(f"  ... y {len(self.warnings) - 10} más")

        print("\n" + "="*70)
        return self.validated_count, self.errors, self.warnings

def main():
    validator = CaseValidator("c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases")
    validated, errors, warnings = validator.validate_all()

    # Exit with appropriate code
    sys.exit(0 if not errors else 1)

if __name__ == "__main__":
    main()
