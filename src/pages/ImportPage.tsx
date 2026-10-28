
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Candidate } from '../types';
import './ImportPage.css';

type FileStatus = 'ready' | 'loading' | 'success' | 'error';

interface QueueItem {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

interface AnalyzeResponse {
  filename: string;
  salary: number | null;
  total_experience_years: number | null;
  skills: string[];
  text_preview: string;
  warnings: string[];
}

interface ImportPageProps {
  onCandidatesImported: (candidates: Candidate[]) => void;
  onOpenCandidates: () => void;
}

export function ImportPage({
  onCandidatesImported,
  onOpenCandidates,
}: ImportPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    const items: QueueItem[] = selected.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'ready',
    }));

    setQueue(previous => [...previous, ...items]);
    setFinished(false);

    event.target.value = '';
  }

  function removeFile(id: string) {
    if (processing) return;
    setQueue(previous =>
      previous.filter(item => item.id !== id)
    );
  }

  function updateItem(
    id: string,
    status: FileStatus,
    error?: string
  ) {
    setQueue(previous =>
      previous.map(item =>
        item.id === id
          ? { ...item, status, error }
          : item
      )
    );
  }

  function makeCandidate(
    result: AnalyzeResponse
  ): Candidate {
    const name = result.filename.replace(/\.pdf$/i, '');

    const detectedSkills = Array.isArray(result.skills)
      ? result.skills
      : [];

    return {
      id: 0,
      name,
      position: 'Должность требует уточнения',
      experienceYears:
        result.total_experience_years ?? 0,
      salary: result.salary ?? null,
      confirmedCriteria: 0,
      totalCriteria: 0,
      status: 'review',
      skills: detectedSkills,
      notes: Array.isArray(result.warnings)
        ? result.warnings
        : [],
      summary:
        result.text_preview ||
        'Резюме загружено. Проверьте сведения вручную.',
    };
  }

  async function startAnalysis() {
    if (processing) return;

    const pending = queue.filter(
      item => item.status === 'ready' ||
        item.status === 'error'
    );

    if (pending.length === 0) return;

    setProcessing(true);
    setFinished(false);

    let completed = 0;

    for (const item of pending) {
      updateItem(item.id, 'loading');

      try {
        const form = new FormData();
        form.append('file', item.file);

        // Один адрес для локальной и публичной версии.
        const response = await fetch(
          '/api/resumes/analyze',
          {
            method: 'POST',
            body: form,
          }
        );

        if (!response.ok) {
          let message = `Ошибка сервера: ${response.status}`;

          try {
            const body = await response.json();
            if (typeof body.detail === 'string') {
              message = body.detail;
            }
          } catch {
            // Оставляем стандартное сообщение.
          }

          throw new Error(message);
        }

        const result =
          (await response.json()) as AnalyzeResponse;

        onCandidatesImported([makeCandidate(result)]);
        updateItem(item.id, 'success');
        completed += 1;
      } catch (error) {
        updateItem(
          item.id,
          'error',
          error instanceof Error
            ? error.message
            : 'Не удалось обработать файл'
        );
      }
    }

    setSuccessCount(completed);
    setFinished(true);
    setProcessing(false);
  }

  const readyCount = queue.filter(
    item => item.status === 'ready' ||
      item.status === 'error'
  ).length;

  const completedCount = queue.filter(
    item => item.status === 'success' ||
      item.status === 'error'
  ).length;

  const progress = queue.length
    ? (completedCount / queue.length) * 100
    : 0;

  return (
    <div className="import-page">
      <div className="import-intro">
        <p className="eyebrow">РАБОТА С РЕЗЮМЕ</p>
        <h1>Импорт PDF</h1>
        <p>
          Загрузите резюме, чтобы извлечь сведения
          и подготовить их к проверке HR.
        </p>
      </div>

      <div className="import-upload-card">
        <div className="import-upload-symbol">↥</div>

        <h2>Добавьте резюме</h2>

        <p>
          Выберите один или несколько PDF-файлов.
          Максимум 5 МБ на файл.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={selectFiles}
        />

        <button
          className="import-select-button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          + Выбрать PDF-файлы
        </button>
      </div>

      <p className="import-privacy-note">
        Демонстрационная версия. Используйте
        обезличенные тестовые резюме, не содержащие
        персональных данных.
      </p>

      <section className="import-queue">
        <div className="import-section-header">
          <h2>Очередь обработки</h2>
          <span>{queue.length} файлов</span>
        </div>

        {queue.length === 0 ? (
          <div className="import-empty">
            Пока нет выбранных файлов
          </div>
        ) : (
          queue.map(item => (
            <div className="import-file" key={item.id}>
              <div className="import-file-icon">PDF</div>

              <div className="import-file-details">
                <strong>{item.file.name}</strong>

                <span>
                  {(item.file.size / 1024).toFixed(0)} КБ
                  {' · '}
                  {item.status === 'ready' && 'Ожидает'}
                  {item.status === 'loading' && 'Анализ...'}
                  {item.status === 'success' && 'Готово'}
                  {item.status === 'error' && 'Ошибка'}
                </span>

                {item.error && (
                  <p className="import-error">
                    {item.error}
                  </p>
                )}
              </div>

              {!processing && item.status !== 'success' && (
                <button
                  className="import-remove"
                  title="Удалить из очереди"
                  onClick={() => removeFile(item.id)}
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </section>

      {queue.length > 0 && (
        <>
          <div className="import-progress-area">
            <div className="import-progress-label">
              <span>Прогресс обработки</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="import-progress-track">
              <div
                className="import-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="import-actions">
            <button
              className="import-start-button"
              disabled={processing || readyCount === 0}
              onClick={startAnalysis}
            >
              {processing
                ? 'Обрабатываем...'
                : 'Начать анализ'}
            </button>

            <button
              className="import-secondary-button"
              onClick={onOpenCandidates}
            >
              Смотреть кандидатов
            </button>
          </div>
        </>
      )}

      {finished && (
        <div className="import-complete">
          <strong>
            Обработка завершена: {successCount} новых карточек
          </strong>

          <p>
            Результаты доступны в галерее кандидатов.
            Неизвестные сведения нужно проверить вручную.
          </p>

          <button onClick={onOpenCandidates}>
            Перейти к кандидатам
          </button>
        </div>
      )}
    </div>
  );
}
