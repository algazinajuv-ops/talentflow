
import type { Candidate } from '../types';

interface Props {
  candidate: Candidate;
  onOpen: (candidate: Candidate) => void;
}

export function CandidateCard({ candidate, onOpen }: Props) {
  const isEvaluated = candidate.totalCriteria > 0;

  return (
    <article className="candidate-card">
      <div className="candidate-avatar">✦</div>

      <div className="candidate-card-body">
        <span className="candidate-status">
          {candidate.status === 'clean'
            ? 'Без замечаний'
            : 'Нужна проверка'}
        </span>

        <h3>{candidate.name}</h3>
        <p>{candidate.position}</p>

        <div className="candidate-info">
          <span>
            {candidate.experienceYears > 0
              ? `${candidate.experienceYears} лет общего опыта`
              : 'Опыт не указан'}
          </span>

          <strong>
            {isEvaluated
              ? `${candidate.confirmedCriteria}/${candidate.totalCriteria}`
              : 'Не оценено'}
          </strong>
        </div>

        <button
          type="button"
          className="view-button"
          onClick={() => onOpen(candidate)}
        >
          Посмотреть резюме
        </button>
      </div>
    </article>
  );
}
