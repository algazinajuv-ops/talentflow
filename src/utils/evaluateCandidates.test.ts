
import { describe, expect, it } from 'vitest';

import {
  evaluateCandidate,
  applyEvaluation,
} from './evaluateCandidate';

import type { Candidate } from '../types';
import type { VacancyCriteria } from '../types/vacancy';

const vacancy: VacancyCriteria = {
  title: 'Менеджер по продажам',
  maxSalary: 100000,
  minExperienceYears: 3,
  requiredSkills: ['CRM', 'Excel', 'B2B-продажи'],
  workFormat: 'any',
  flagShortJobs: false,
};

const candidate: Candidate = {
  id: 100001,
  name: 'Тестовый кандидат',
  position: 'Менеджер по продажам',
  experienceYears: 5,
  salary: 90000,
  confirmedCriteria: 0,
  totalCriteria: 0,
  status: 'review',
  skills: ['CRM', 'Excel', 'B2B'],
  notes: [],
  summary: 'Тестовое резюме',
};

describe('TalentFlow: проверка кандидатов', () => {
  it('подтверждает зарплату в пределах бюджета', () => {
    const result = evaluateCandidate(candidate, vacancy);

    expect(
      result.checks.find(
        check => check.name === 'Зарплатные ожидания'
      )?.status
    ).toBe('match');
  });

  it('помечает зарплату выше бюджета', () => {
    const result = evaluateCandidate(
      { ...candidate, salary: 130000 },
      vacancy
    );

    expect(
      result.checks.find(
        check => check.name === 'Зарплатные ожидания'
      )?.status
    ).toBe('mismatch');
  });

  it('не считает неизвестную зарплату нарушением', () => {
    const result = evaluateCandidate(
      { ...candidate, salary: null },
      vacancy
    );

    expect(
      result.checks.find(
        check => check.name === 'Зарплатные ожидания'
      )?.status
    ).toBe('unknown');
  });

  it('не путает общий стаж с релевантным', () => {
    const result = evaluateCandidate(candidate, vacancy);

    expect(
      result.checks.find(
        check => check.name === 'Релевантный опыт'
      )?.status
    ).toBe('unknown');
  });

  it('распознаёт известные навыки', () => {
    const result = evaluateCandidate(candidate, vacancy);

    expect(
      result.checks.find(
        check => check.name === 'Навык: CRM'
      )?.status
    ).toBe('match');

    expect(
      result.checks.find(
        check => check.name === 'Навык: Excel'
      )?.status
    ).toBe('match');
  });

  it('не считает ненайденный навык доказанным отсутствием', () => {
    const result = evaluateCandidate(
      { ...candidate, skills: [] },
      vacancy
    );

    expect(
      result.checks.find(
        check => check.name === 'Навык: CRM'
      )?.status
    ).toBe('unknown');
  });

  it('пересчитывает количество подтверждений', () => {
    const result = evaluateCandidate(candidate, vacancy);

    expect(result.total).toBe(5);
    expect(result.confirmed).toBe(4);
  });

  it('не изменяет исходного кандидата', () => {
    const original = structuredClone(candidate);

    const evaluated = applyEvaluation(candidate, vacancy);

    expect(candidate).toEqual(original);
    expect(evaluated.confirmedCriteria).toBe(4);
    expect(evaluated.totalCriteria).toBe(5);
  });

  it('отдельно отмечает неизвестный формат работы', () => {
    const result = evaluateCandidate(candidate, {
      ...vacancy,
      workFormat: 'remote',
    });

    expect(
      result.checks.find(
        check => check.name === 'Формат работы'
      )?.status
    ).toBe('unknown');
  });
});
