
import type { Candidate } from '../types';

export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: 'Кандидат №001',
    position: 'Менеджер по продажам',
    experienceYears: 5,
    salary: 90000,
    confirmedCriteria: 3,
    totalCriteria: 3,
    status: 'clean',
    skills: ['B2B-продажи', 'CRM', 'Переговоры'],
    notes: [],
    summary: 'Опыт B2B-продаж — 5 лет. Последнее место работы — 3 года.'
  },
  {
    id: 2,
    name: 'Кандидат №002',
    position: 'Аккаунт-менеджер',
    experienceYears: 4,
    salary: 130000,
    confirmedCriteria: 2,
    totalCriteria: 3,
    status: 'review',
    skills: ['CRM', 'Работа с клиентами', 'Excel'],
    notes: ['Зарплатные ожидания выше бюджета вакансии.'],
    summary: 'Опыт работы с клиентами — 4 года. Требуется уточнить зарплатные ожидания.'
  },
  {
    id: 3,
    name: 'Кандидат №003',
    position: 'Торговый представитель',
    experienceYears: 2,
    salary: 80000,
    confirmedCriteria: 1,
    totalCriteria: 3,
    status: 'review',
    skills: ['Продажи', 'Коммуникация'],
    notes: ['Опыт меньше требуемого.', 'Неизвестны причины коротких периодов работы.'],
    summary: 'Опыт продаж — 2 года. Последнее место работы — 7 месяцев.'
  },
  {
    id: 4,
    name: 'Кандидат №004',
    position: 'Менеджер по продажам',
    experienceYears: 6,
    salary: 95000,
    confirmedCriteria: 3,
    totalCriteria: 3,
    status: 'clean',
    skills: ['B2B', 'CRM', 'Аналитика продаж'],
    notes: [],
    summary: 'Опыт в продажах — 6 лет. Последнее место работы — 4 года.'
  },
  {
    id: 5,
    name: 'Кандидат №005',
    position: 'Специалист по работе с клиентами',
    experienceYears: 3,
    salary: null,
    confirmedCriteria: 2,
    totalCriteria: 3,
    status: 'review',
    skills: ['Поддержка клиентов', 'Переговоры'],
    notes: ['Не указаны зарплатные ожидания.'],
    summary: 'Опыт работы с клиентами — 3 года. Зарплата в резюме не указана.'
  }
];
