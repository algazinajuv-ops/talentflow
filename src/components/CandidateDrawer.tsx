
import type { Candidate } from '../types';

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, onClose }: Props) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="candidate-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Резюме ${candidate.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="drawer-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <p className="eyebrow">Карточка кандидата</p>
        <h2>{candidate.name}</h2>
        <p>{candidate.position}</p>

        <div className="drawer-metrics">
          <div>
            <span>Опыт</span>
            <strong>{candidate.experienceYears} лет</strong>
          </div>
          <div>
            <span>Ожидания</span>
            <strong>
              {candidate.salary === null
                ? 'Не указаны'
                : `${candidate.salary.toLocaleString('ru-RU')} ₽`}
            </strong>
          </div>
        </div>

        <h3>Краткое резюме</h3>
        <p>{candidate.summary}</p>

        <h3>Навыки</h3>
        <div className="skill-list">
          {candidate.skills.map(skill => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>

        <h3>Проверка требований</h3>
        <p>
          Подтверждено {candidate.confirmedCriteria} из{' '}
          {candidate.totalCriteria} тестовых критериев
        </p>

        {candidate.notes.length > 0 ? (
          <div className="review-notes">
            {candidate.notes.map(note => (
              <p key={note}>⚠ {note}</p>
            ))}
          </div>
        ) : (
          <div className="review-success">
            Замечаний по тестовым критериям нет.
          </div>
        )}

        <button className="view-button" onClick={onClose}>
          Вернуться к кандидатам
        </button>
      </aside>
    </div>
  );
}
