
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { VacancyCriteria, WorkFormat } from '../types/vacancy';
import './CriteriaPage.css';

interface Props {
  criteria: VacancyCriteria;
  onSave: (criteria: VacancyCriteria) => void;
}

export function CriteriaPage({ criteria, onSave }: Props) {
  const [title, setTitle] = useState(criteria.title);
  const [salary, setSalary] = useState(
    criteria.maxSalary?.toString() ?? ''
  );
  const [experience, setExperience] = useState(
    criteria.minExperienceYears?.toString() ?? ''
  );
  const [skills, setSkills] = useState<string[]>(criteria.requiredSkills);
  const [newSkill, setNewSkill] = useState('');
  const [workFormat, setWorkFormat] = useState<WorkFormat>(
    criteria.workFormat
  );
  const [flagShortJobs, setFlagShortJobs] = useState(
    criteria.flagShortJobs
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(criteria.title);
    setSalary(criteria.maxSalary?.toString() ?? '');
    setExperience(criteria.minExperienceYears?.toString() ?? '');
    setSkills(criteria.requiredSkills);
    setWorkFormat(criteria.workFormat);
    setFlagShortJobs(criteria.flagShortJobs);
  }, [criteria]);

  function addSkill() {
    const skill = newSkill.trim();

    if (!skill) return;

    if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setError('Такой навык уже добавлен.');
      return;
    }

    setSkills(previous => [...previous, skill]);
    setNewSkill('');
    setError('');
    setMessage('');
  }

  function removeSkill(skill: string) {
    setSkills(previous => previous.filter(s => s !== skill));
    setMessage('');
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!title.trim()) {
      setError('Укажи название вакансии.');
      return;
    }

    const parsedSalary = salary.trim() === '' ? null : Number(salary);
    const parsedExperience =
      experience.trim() === '' ? null : Number(experience);

    if (
      parsedSalary !== null &&
      (!Number.isFinite(parsedSalary) || parsedSalary <= 0)
    ) {
      setError('Зарплата должна быть больше нуля.');
      return;
    }

    if (
      parsedExperience !== null &&
      (!Number.isFinite(parsedExperience) ||
        parsedExperience < 0 ||
        parsedExperience > 60)
    ) {
      setError('Укажи корректный опыт от 0 до 60 лет.');
      return;
    }

    const updated: VacancyCriteria = {
      title: title.trim(),
      maxSalary: parsedSalary,
      minExperienceYears: parsedExperience,
      requiredSkills: skills,
      workFormat,
      flagShortJobs,
    };

    onSave(updated);
    setMessage('Настройки вакансии сохранены!');
  }

  return (
    <section className="criteria-page">
      <div className="criteria-intro">
        <p className="eyebrow">Настройка вакансии</p>
        <h1>Кого мы ищем?</h1>
        <p>
          Опиши профессиональные требования. TalentFlow будет
          использовать эти настройки при будущем анализе резюме.
        </p>
      </div>

      <form onSubmit={handleSave} className="criteria-form">
        <div className="criteria-section">
          <div className="criteria-section-title">
            <span className="criteria-number">01</span>
            <div>
              <h2>Основная информация</h2>
              <p>Название должности и условия вакансии.</p>
            </div>
          </div>

          <label className="criteria-field">
            <span>Название вакансии</span>
            <input
              value={title}
              onChange={event => {
                setTitle(event.target.value);
                setMessage('');
              }}
              placeholder="Например, менеджер по продажам"
            />
          </label>

          <div className="criteria-two-columns">
            <label className="criteria-field">
              <span>Максимальная зарплата, ₽</span>
              <input
                type="number"
                min="1"
                step="1000"
                value={salary}
                onChange={event => {
                  setSalary(event.target.value);
                  setMessage('');
                }}
                placeholder="Не ограничена"
              />
            </label>

            <label className="criteria-field">
              <span>Релевантный опыт от, лет</span>
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={experience}
                onChange={event => {
                  setExperience(event.target.value);
                  setMessage('');
                }}
                placeholder="Не ограничен"
              />
            </label>
          </div>
        </div>

        <div className="criteria-section">
          <div className="criteria-section-title">
            <span className="criteria-number">02</span>
            <div>
              <h2>Профессиональные навыки</h2>
              <p>Добавь технологии и умения, необходимые для работы.</p>
            </div>
          </div>

          <div className="criteria-skill-input">
            <input
              value={newSkill}
              onChange={event => setNewSkill(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Например, Excel"
            />
            <button type="button" onClick={addSkill}>
              + Добавить
            </button>
          </div>

          <div className="criteria-skills">
            {skills.map(skill => (
              <span className="criteria-skill" key={skill}>
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Удалить навык ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <p className="criteria-help">Навыки пока не добавлены.</p>
            )}
          </div>
        </div>

        <div className="criteria-section">
          <div className="criteria-section-title">
            <span className="criteria-number">03</span>
            <div>
              <h2>Условия работы</h2>
              <p>Выбери формат работы, необходимый для вакансии.</p>
            </div>
          </div>

          <div className="criteria-format-grid">
            {([
              ['any', 'Любой формат'],
              ['remote', 'Удалённо'],
              ['office', 'В офисе'],
              ['hybrid', 'Гибрид'],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={
                  workFormat === value ? 'criteria-format selected' : 'criteria-format'
                }
                onClick={() => {
                  setWorkFormat(value);
                  setMessage('');
                }}
              >
                {workFormat === value ? '● ' : '○ '}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="criteria-section">
          <div className="criteria-section-title">
            <span className="criteria-number">04</span>
            <div>
              <h2>Дополнительная проверка</h2>
              <p>Отметим моменты, которые стоит уточнить у кандидата.</p>
            </div>
          </div>

          <label className="criteria-checkbox">
            <input
              type="checkbox"
              checked={flagShortJobs}
              onChange={event => {
                setFlagShortJobs(event.target.checked);
                setMessage('');
              }}
            />
            <span>
              <strong>Отмечать короткие периоды работы</strong>
              <small>
                Показывать HR длительность трудоустройства для
                дополнительного уточнения, не отклоняя автоматически.
              </small>
            </span>
          </label>
        </div>

        {error && <p className="criteria-error" role="alert">{error}</p>}
        {message && <p className="criteria-success" role="status">{message}</p>}

        <div className="criteria-footer">
          <p>Настройки сохраняются только в этом браузере.</p>
          <button type="submit">Сохранить требования →</button>
        </div>
      </form>
    </section>
  );
}
