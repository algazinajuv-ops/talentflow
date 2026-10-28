
import type { Candidate } from '../types';
import type { VacancyCriteria } from '../types/vacancy';

export type HiringStatus = 'new' | 'review' | 'next' | 'rejected';
export type HiringStatusMap = Record<number, HiringStatus>;

const statusNames: Record<HiringStatus, string> = {
  new: 'Новый',
  review: 'На проверке',
  next: 'Следующий этап',
  rejected: 'Отклонён',
};

export async function exportCandidatesToExcel(
  candidates: Candidate[],
  criteria: VacancyCriteria,
  statuses: HiringStatusMap
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TalentFlow';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Кандидаты', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Кандидат', key: 'name', width: 27 },
    { header: 'Должность', key: 'position', width: 30 },
    { header: 'Общий опыт, лет', key: 'experience', width: 20 },
    { header: 'Зарплата, ₽', key: 'salary', width: 19 },
    { header: 'Подтверждено', key: 'confirmed', width: 19 },
    { header: 'Всего проверок', key: 'total', width: 20 },
    { header: 'Навыки', key: 'skills', width: 42 },
    { header: 'Вопросы для HR', key: 'notes', width: 65 },
    { header: 'Этап HR', key: 'hiringStatus', width: 22 },
  ];

  for (const candidate of candidates) {
    sheet.addRow({
      id: candidate.id,
      name: candidate.name,
      position: candidate.position,
      experience: candidate.experienceYears || null,
      salary: candidate.salary,
      confirmed: candidate.totalCriteria
        ? candidate.confirmedCriteria
        : null,
      total: candidate.totalCriteria || null,
      skills: candidate.skills.join(', '),
      notes: candidate.notes.join('; '),
      hiringStatus: statusNames[statuses[candidate.id] ?? 'new'],
    });
  }

  const header = sheet.getRow(1);
  header.height = 30;

  header.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF485242' },
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    cell.alignment = {
      vertical: 'middle',
      wrapText: true,
    };
  });

  for (let row = 2; row <= sheet.rowCount; row++) {
    const current = sheet.getRow(row);
    current.height = 38;

    current.eachCell({ includeEmpty: true }, cell => {
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      };

      if (row % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F2EB' },
        };
      }
    });
  }

  sheet.autoFilter = {
    from: 'A1',
    to: 'J1',
  };

  sheet.getColumn('salary').numFmt = '#,##0 "₽"';

  // Отдельный лист с требованиями вакансии.
  const vacancy = workbook.addWorksheet('Вакансия');

  vacancy.columns = [
    { header: 'Параметр', key: 'name', width: 33 },
    { header: 'Значение', key: 'value', width: 55 },
  ];

  const workFormats = {
    any: 'Любой',
    remote: 'Удалённо',
    office: 'Офис',
    hybrid: 'Гибрид',
  };

  vacancy.addRows([
    {
      name: 'Название вакансии',
      value: criteria.title,
    },
    {
      name: 'Максимальная зарплата',
      value: criteria.maxSalary ?? 'Не задано',
    },
    {
      name: 'Минимальный релевантный опыт',
      value: criteria.minExperienceYears ?? 'Не задано',
    },
    {
      name: 'Необходимые навыки',
      value: criteria.requiredSkills.join(', '),
    },
    {
      name: 'Формат работы',
      value: workFormats[criteria.workFormat],
    },
    {
      name: 'Проверка коротких периодов работы',
      value: criteria.flagShortJobs ? 'Да' : 'Нет',
    },
    {
      name: 'Примечание',
      value:
        'Автоматическая проверка помогает HR, ' +
        'но не является решением о найме.',
    },
  ]);

  vacancy.getRow(1).font = {
    bold: true,
    color: { argb: 'FF485242' },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer as BlobPart], {
    type:
      'application/vnd.openxmlformats-officedocument.' +
      'spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `TalentFlow_${date}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
