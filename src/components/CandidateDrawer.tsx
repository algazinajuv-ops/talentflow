
import type { Candidate } from '../types';

type HiringStatus = 'new' | 'review' | 'next' | 'rejected';

interface Props {
  candidate: Candidate;
  hiringStatus: HiringStatus;
  onClose: () => void;
  onChangeStatus: (status: HiringStatus) => void;
}

const statusLabels: Record<HiringStatus, string> = {
  new: 'Новый',
  review: 'На проверке',
  next: 'Следующий этап',
  rejected: 'Отклонён',
};

export function CandidateDrawer({
  candidate,
  hiringStatus,
  onClose,
  onChangeStatus,
}: Props) {
  function rejectCandidate() {
    const confirmed = window.confirm(
      `Отклонить ${candidate.name}? Это изменит статус в канбане.`
    );

    if (confirmed) {
      onChangeStatus('rejected');
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="candidate-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Резюме ${candidate.name}`}
        onClick={event => event.stopPropagation()}
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

        <div className="current-status">
          <span>Текущий этап</span>
          <strong>{statusLabels[hiringStatus]}</strong>
        </div>

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
            <span key={skill} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>

        <h3>Проверка требований</h3>
        <p>
          Подтверждено {candidate.confirmedCriteria} из{' '}
          {candidate.totalCriteria} тестовых критериев.
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

        <div className="drawer-actions">
          <h3>Решение HR</h3>
          <p>
            Выбери дальнейший этап. Изменение сохранится
            в браузере и отобразится на канбане.
          </p>

          <button
            className="action-primary"
            onClick={() => onChangeStatus('next')}
            disabled={hiringStatus === 'next'}
          >
            {hiringStatus === 'next'
              ? 'Уже на следующем этапе'
              : 'На следующий этап →'}
          </button>

          <button
            className="action-secondary"
            onClick={() => onChangeStatus('review')}
            disabled={hiringStatus === 'review'}
          >
            Отправить на проверку
          </button>

          <button
            className="action-danger"
            onClick={rejectCandidate}
            disabled={hiringStatus === 'rejected'}
          >
            Отклонить
          </button>

          {hiringStatus !== 'new' && (
            <button
              className="action-text"
              onClick={() => onChangeStatus('new')}
            >
              Вернуть в новые
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
