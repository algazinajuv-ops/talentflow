
import type { Candidate } from '../types';
import type { VacancyCriteria } from '../types/vacancy';

export type CheckStatus = 'match' | 'mismatch' | 'unknown';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  explanation: string;
}

export interface Evaluation {
  checks: CheckResult[];
  confirmed: number;
  total: number;
  questions: string[];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9+#]+/g, ' ')
    .trim();
}

function skillMatches(
  required: string,
  detectedSkills: string[]
): boolean {
  const requiredNormalized = normalize(required);

  return detectedSkills.some(skill => {
    const found = normalize(skill);

    if (found === requiredNormalized) return true;

    // Пример: "B2B" и "B2B-продажи".
    // Это простое эвристическое сопоставление,
    // а не семантическое понимание навыков.
    if (
      requiredNormalized === 'b2b продажи' &&
      found === 'b2b'
    ) {
      return true;
    }

    return false;
  });
}

export function evaluateCandidate(
  candidate: Candidate,
  criteria: VacancyCriteria
): Evaluation {
  const checks: CheckResult[] = [];

  // 1. Зарплата
  if (criteria.maxSalary !== null) {
    if (candidate.salary === null) {
      checks.push({
        name: 'Зарплатные ожидания',
        status: 'unknown',
        explanation: 'Зарплата не найдена в резюме.',
      });
    } else if (candidate.salary <= criteria.maxSalary) {
      checks.push({
        name: 'Зарплатные ожидания',
        status: 'match',
        explanation:
          `${candidate.salary.toLocaleString('ru-RU')} ₽ — ` +
          `в пределах бюджета.`,
      });
    } else {
      checks.push({
        name: 'Зарплатные ожидания',
        status: 'mismatch',
        explanation:
          `${candidate.salary.toLocaleString('ru-RU')} ₽ — ` +
          `выше бюджета ${criteria.maxSalary.toLocaleString('ru-RU')} ₽.`,
      });
    }
  }

  // 2. Релевантный опыт
  if (criteria.minExperienceYears !== null) {
    checks.push({
      name: 'Релевантный опыт',
      status: 'unknown',
      explanation:
        candidate.experienceYears > 0
          ? `Найден общий стаж ${candidate.experienceYears} лет. ` +
            'Релевантность опыта пока не определена.'
          : 'Нужные сведения о релевантном опыте не извлечены.',
    });
  }

  // 3. Профессиональные навыки
  for (const skill of criteria.requiredSkills) {
    const found = skillMatches(skill, candidate.skills);

    checks.push({
      name: `Навык: ${skill}`,
      status: found ? 'match' : 'unknown',
      explanation: found
        ? 'Навык найден в извлечённых данных.'
        : 'Навык не найден автоматически. Это не доказывает его отсутствие.',
    });
  }

  // 4. Формат работы
  if (criteria.workFormat !== 'any') {
    checks.push({
      name: 'Формат работы',
      status: 'unknown',
      explanation:
        'Текущий PDF-парсер не определяет готовность ' +
        'к требуемому формату работы.',
    });
  }

  const confirmed = checks.filter(
    check => check.status === 'match'
  ).length;

  const questions = checks
    .filter(check => check.status !== 'match')
    .map(check => `${check.name}: ${check.explanation}`);

  if (criteria.flagShortJobs) {
    questions.push(
      'Стабильность занятости: требуется проверка дат ' +
      'трудоустройства. Автоматически не оценивалась.'
    );
  }

  return {
    checks,
    confirmed,
    total: checks.length,
    questions,
  };
}

export function applyEvaluation(
  candidate: Candidate,
  criteria: VacancyCriteria
): Candidate {
  const evaluation = evaluateCandidate(candidate, criteria);

  return {
    ...candidate,
    confirmedCriteria: evaluation.confirmed,
    totalCriteria: evaluation.total,
    status: 'review',
    notes: evaluation.questions,
  };
}
