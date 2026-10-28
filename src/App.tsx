
import { useState } from 'react';
import { CandidateCard } from './components/CandidateCard';
import { CandidateDrawer } from './components/CandidateDrawer';
import { mockCandidates } from './data/mockCandidates';
import type { Candidate } from './types';

type Filter = 'all' | 'clean' | 'review';

function App() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const filteredCandidates = mockCandidates.filter(candidate => {
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

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">✦ TalentFlow</h2>

        <nav className="navigation">
          <button>Главная</button>
          <button className="active">Кандидаты</button>
          <button>Вакансии</button>
          <button>Аналитика</button>
          <button>Канбан</button>
        </nav>

        <div className="sidebar-bottom">HR Workspace</div>
      </aside>

      <main className="content">
        <div className="topbar">
          <span>Рабочее пространство / Кандидаты</span>
          <span className="demo-label">Демоверсия</span>
        </div>

        <section className="heading">
          <p className="eyebrow">Подбор персонала</p>
          <h1>Кандидаты</h1>
          <p>Отклики и результаты проверки требований.</p>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>Всего откликов</span>
            <strong>{mockCandidates.length}</strong>
          </div>

          <div className="stat-card">
            <span>Без замечаний</span>
            <strong>
              {mockCandidates.filter(c => c.status === 'clean').length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Нужна проверка</span>
            <strong>
              {mockCandidates.filter(c => c.status === 'review').length}
            </strong>
          </div>
        </section>

        <section className="candidates">
          <div className="section-heading">
            <h2>Последние отклики</h2>
            <span>{filteredCandidates.length} найдено</span>
          </div>

          <div className="candidate-toolbar">
            <input
              className="search-input"
              type="search"
              placeholder="Поиск по должности, номеру или навыкам..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />

            <div className="filter-buttons">
              <button
                className={filter === 'all' ? 'selected' : ''}
                onClick={() => setFilter('all')}
              >
                Все
              </button>

              <button
                className={filter === 'clean' ? 'selected' : ''}
                onClick={() => setFilter('clean')}
              >
                Без замечаний
              </button>

              <button
                className={filter === 'review' ? 'selected' : ''}
                onClick={() => setFilter('review')}
              >
                На проверку
              </button>
            </div>
          </div>

          {filteredCandidates.length > 0 ? (
            <div className="candidate-grid">
              {filteredCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onOpen={setSelectedCandidate}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Кандидаты не найдены</h3>
              <p>Попробуй изменить запрос или сбросить фильтры.</p>
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
      </main>

      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}

export default App;
