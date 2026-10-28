
export type WorkFormat = 'any' | 'remote' | 'office' | 'hybrid';

export interface VacancyCriteria {
  title: string;
  maxSalary: number | null;
  minExperienceYears: number | null;
  requiredSkills: string[];
  workFormat: WorkFormat;
  flagShortJobs: boolean;
}

export const defaultCriteria: VacancyCriteria = {
  title: 'Менеджер по продажам',
  maxSalary: 100000,
  minExperienceYears: 3,
  requiredSkills: ['CRM', 'B2B-продажи', 'Переговоры'],
  workFormat: 'any',
  flagShortJobs: true,
};
