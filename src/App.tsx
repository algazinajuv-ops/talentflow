
import { useEffect, useState } from 'react';
import { CandidateCard } from './components/CandidateCard';
import { CandidateDrawer } from './components/CandidateDrawer';
import { CriteriaPage } from './pages/CriteriaPage';
import { ImportPage } from './pages/ImportPage';
import { mockCandidates } from './data/mockCandidates';
import type { Candidate } from './types';
import {
  defaultCriteria,
  type VacancyCriteria,
} from './types/vacancy';

type Filter = 'all' | 'clean' | 'review';
type Page = 'candidates' | 'criteria' | 'import' | 'kanban';
type HiringStatus = 'new' | 'review' | 'next' | 'rejected';
type StatusMap = Record<number, HiringStatus>;

const STATUS_KEY = 'talentflow-hiring-statuses';
const CRITERIA_KEY = 'talentflow-vacancy-criteria';

const columns: { id: HiringStatus; title: string }[] = [
  { id: 'new', title: 'Новые' },
  { id: 'review', title: 'На проверке' },
  { id: 'next', title: 'Следующий этап' },
  { id: 'rejected', title: 'Отклонены' },
];

function loadStatuses(): StatusMap {
  try {
    const saved = localStorage.getItem(STATUS_KEY);
    if (!saved) return {};

    const parsed: unknown = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const valid = new Set([
      'new', 'review', 'next', 'rejected'
    ]);

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => valid.has(value as string)
      )
    ) as StatusMap;
  } catch {
    return {};
  }
}

function loadCriteria(): VacancyCriteria {
  try {
    const saved = localStorage.getItem(CRITERIA_KEY);
    if (!saved) return defaultCriteria;

    const parsed: unknown = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return defaultCriteria;
    }

    const value = parsed as Partial<VacancyCriteria>;
    const formats = ['any', 'remote', 'office', 'hybrid'];

    const validNumber = (number: unknown): number | null =>
      typeof number === 'number' &&
      Number.isFinite(number) &&
      number >= 0
        ? number
        : null;

    return {
      title:
        typeof value.title === 'string' && value.title.trim()
          ? value.title
          : defaultCriteria.title,

      maxSalary: validNumber(value.maxSalary),

      minExperienceYears: validNumber(value.minExperienceYears),

      requiredSkills: Array.isArray(value.requiredSkills)
        ? value.requiredSkills.filter(
            (skill): skill is string =>
              typeof skill === 'string'
          )
        : defaultCriteria.requiredSkills,

      workFormat:
        typeof value.workFormat === 'string' &&
        formats.includes(value.workFormat)
          ? value.workFormat as VacancyCriteria['workFormat']
          : defaultCriteria.workFormat,

      flagShortJobs: value.flagShortJobs === true,
    };
  } catch {
    return defaultCriteria;
  }
}

function App() {
  const [page, setPage] = useState<Page>('candidates');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [statuses, setStatuses] = useState<StatusMap>(loadStatuses);
  const [criteria, setCriteria] =
    useState<VacancyCriteria>(loadCriteria);

  const [importedCandidates, setImportedCandidates] =
    useState<Candidate[]>([]);

  const allCandidates = [
    ...mockCandidates,
    ...importedCandidates,
  ];

  useEffect(() => {
    try {
      localStorage.setItem(
        STATUS_KEY,
        JSON.stringify(statuses)
      );
    } catch {
      console.warn('Не удалось сохранить статусы');
    }
  }, [statuses]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CRITERIA_KEY,
        JSON.stringify(criteria)
      );
    } catch {
      console.warn('Не удалось сохранить критерии');
    }
  }, [criteria]);

  const getStatus = (id: number): HiringStatus =>
    statuses[id] ?? 'new';

  function updateStatus(id: number, status: HiringStatus) {
    setStatuses(previous => ({
      ...previous,
      [id]: status,
    }));

    setSelectedId(null);
  }

  function handleImportedCandidates(candidates: Candidate[]) {
    setImportedCandidates(previous => [
      ...previous,
      ...candidates.map(candidate => ({
        ...candidate,
        id: candidate.id + Date.now(),
      })),
    ]);
  }

  const selectedCandidate =
    allCandidates.find(candidate => candidate.id === selectedId)
    ?? null;

  const filteredCandidates = allCandidates.filter(candidate => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      candidate.name.toLowerCase().includes(query) ||
      candidate.position.toLowerCase().includes(query) ||
      candidate.skills.some(skill =>
        skill.toLowerCase().includes(query)
      );

    const matchesFilter =
      filter === 'all' || candidate.status === filter;

    return matchesSearch && matchesFilter;
  });

  const countStatus = (status: HiringStatus) =>
    allCandidates.filter(
      candidate => getStatus(candidate.id) === status
    ).length;

  const pageNames: Record<Page, string> = {
    candidates: 'Кандидаты',
    criteria: 'Критерии',
    import: 'Импорт PDF',
    kanban: 'Канбан',
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">✦ TalentFlow</h2>

        <nav className="navigation" aria-label="Навигация">
          <button
            className={page === 'candidates' ? 'active' : ''}
            onClick={() => setPage('candidates')}
          >
            ◇ Кандидаты
          </button>

          <button
            className={page === 'criteria' ? 'active' : ''}
            onClick={() => setPage('criteria')}
          >
            ☷ Критерии
          </button>

          <button
            className={page === 'import' ? 'active' : ''}
            onClick={() => setPage('import')}
          >
            ↥ Импорт PDF
          </button>

          <button
            className={page === 'kanban' ? 'active' : ''}
            onClick={() => setPage('kanban')}
          >
            ▦ Канбан
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            Хорошие люди меняют компании к лучшему.
            <span>✳</span>
          </div>
          <p>TalentFlow · Demo workspace</p>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <span>
            Рабочее пространство / {pageNames[page]}
          </span>
          <span className="demo-label">Демоверсия</span>
        </div>

        {page === 'criteria' && (
          <CriteriaPage
            criteria={criteria}
            onSave={setCriteria}
          />
        )}

        {page === 'import' && (
          <ImportPage
            onCandidatesImported={handleImportedCandidates}
            onOpenCandidates={() => setPage('candidates')}
          />
        )}

        {page === 'candidates' && (
          <>
            <section className="heading">
              <p className="eyebrow">Подбор персонала</p>
              <h1>Кандидаты</h1>
              <p>
                Вакансия: {criteria.title}. Отклики и
                предварительные результаты обработки.
              </p>
            </section>

            <section className="stats">
              <div className="stat-card">
                <span>Всего откликов</span>
                <strong>{allCandidates.length}</strong>
              </div>

              <div className="stat-card">
                <span>На проверке</span>
                <strong>{countStatus('review')}</strong>
              </div>

              <div className="stat-card">
                <span>Следующий этап</span>
                <strong>{countStatus('next')}</strong>
              </div>
            </section>

            <section className="candidates">
              <div className="section-heading">
                <h2>Последние отклики</h2>
                <span>
                  {filteredCandidates.length} найдено
                </span>
              </div>

              <div className="candidate-toolbar">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Поиск по должности, номеру или навыкам..."
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                />

                <div className="filter-buttons">
                  <button
                    className={
                      filter === 'all' ? 'selected' : ''
                    }
                    onClick={() => setFilter('all')}
                  >
                    Все
                  </button>

                  <button
                    className={
                      filter === 'clean' ? 'selected' : ''
                    }
                    onClick={() => setFilter('clean')}
                  >
                    Без замечаний
                  </button>

                  <button
                    className={
                      filter === 'review' ? 'selected' : ''
                    }
                    onClick={() => setFilter('review')}
                  >
                    Есть вопросы
                  </button>
                </div>
              </div>

              {filteredCandidates.length > 0 ? (
                <div className="candidate-grid">
                  {filteredCandidates.map(candidate => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onOpen={candidate =>
                        setSelectedId(candidate.id)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Кандидаты не найдены</h3>
                  <p>Измени запрос или сбрось фильтры.</p>
                  <button
                    className="view-button"
                    onClick={() => {
                      setSearch('');
                      setFilter('all');
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {page === 'kanban' && (
          <>
            <section className="heading">
              <p className="eyebrow">Этапы отбора</p>
              <h1>Канбан</h1>
              <p>
                Кандидаты распределены по этапам работы HR.
              </p>
            </section>

            <div className="board-intro">
              <span>
                {allCandidates.length} кандидатов
              </span>
              <button
                onClick={() => setPage('candidates')}
              >
                ← К галерее
              </button>
            </div>

            <div className="kanban-board">
              {columns.map(column => (
                <section
                  className={`kanban-column column-${column.id}`}
                  key={column.id}
                >
                  <div className="column-heading">
                    <h2>{column.title}</h2>
                    <span>
                      {countStatus(column.id)}
                    </span>
                  </div>

                  <div className="kanban-items">
                    {allCandidates
                      .filter(candidate =>
                        getStatus(candidate.id) === column.id
                      )
                      .map(candidate => (
                        <button
                          className="kanban-card"
                          key={candidate.id}
                          onClick={() =>
                            setSelectedId(candidate.id)
                          }
                        >
                          <span className="kanban-card-icon">
                            ✦
                          </span>

                          <strong>{candidate.name}</strong>
                          <small>{candidate.position}</small>

                          <span className="kanban-card-footer">
                            {candidate.experienceYears > 0
                              ? `${candidate.experienceYears} лет опыта`
                              : 'Опыт неизвестен'}

                            <b>
                              {candidate.totalCriteria > 0
                                ? `${candidate.confirmedCriteria}/${candidate.totalCriteria}`
                                : 'Не оценено'}
                            </b>
                          </span>
                        </button>
                      ))}

                    {countStatus(column.id) === 0 && (
                      <p className="column-empty">
                        Здесь пока никого нет
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          hiringStatus={getStatus(selectedCandidate.id)}
          onClose={() => setSelectedId(null)}
          onChangeStatus={status =>
            updateStatus(selectedCandidate.id, status)
          }
        />
      )}
    </div>
  );
}

export default App;
