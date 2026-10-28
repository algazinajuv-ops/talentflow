
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Candidate } from '../types';
import './ImportPage.css';

const API_URL = 'http://127.0.0.1:8000/api/resumes/analyze';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type FileState = 'waiting' | 'processing' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  state: FileState;
  error?: string;
}

interface AnalysisResponse {
  filename: string;
  salary: number | null;
  total_experience_years: number | null;
  skills: string[];
  text_preview: string;
  warnings: string[];
}

interface Props {
  onCandidatesImported: (candidates: Candidate[]) => void;
  onOpenCandidates: () => void;
}

function extractErrorMessage(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'detail' in value &&
    typeof value.detail === 'string'
  ) {
    return value.detail;
  }

  return 'Не удалось обработать PDF.';
}

export function ImportPage({
  onCandidatesImported,
  onOpenCandidates,
}: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const nextId = useRef(100000);
  const inputRef = useRef<HTMLInputElement>(null);

  const processedCount = queue.filter(
    item => item.state === 'done' || item.state === 'error'
  ).length;

  const successfulCount = queue.filter(
    item => item.state === 'done'
  ).length;

  function updateFile(id: string, patch: Partial<QueueItem>) {
    setQueue(previous =>
      previous.map(item =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    const items: QueueItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      state: 'waiting',
    }));

    setQueue(previous => [...previous, ...items]);
    setCompleted(false);

    // Позволяет повторно выбрать файл с тем же именем.
    event.target.value = '';
  }

  function removeFile(id: string) {
    if (isProcessing) return;

    setQueue(previous => previous.filter(item => item.id !== id));
    setCompleted(false);
  }

  async function analyzeFile(file: File): Promise<AnalysisResponse> {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Можно загрузить только PDF.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Файл превышает 5 МБ.');
    }

    const formData = new FormData();
    formData.append('file', file);

    let response: Response;

    try {
      response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
    } catch {
      throw new Error(
        'Не удалось подключиться к Python-серверу. Проверь, что FastAPI запущен на порту 8000.'
      );
    }

    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => null);
      throw new Error(extractErrorMessage(errorBody));
    }

    return (await response.json()) as AnalysisResponse;
  }

  function toCandidate(
    result: AnalysisResponse,
    id: number
  ): Candidate {
    const filenameWithoutExtension =
      result.filename.replace(/\.pdf$/i, '');

    return {
      id,
      name: filenameWithoutExtension || `Резюме №${id}`,
      position: 'Должность не определена',
      experienceYears: result.total_experience_years ?? 0,
      salary: result.salary,
      confirmedCriteria: 0,
      totalCriteria: 0,
      status: 'review',
      skills: result.skills,
      notes: [
        'Резюме пока не сравнивалось с требованиями вакансии.',
        ...(result.total_experience_years === null
          ? ['Общий стаж не найден.']
          : ['Указан общий стаж, не подтверждён релевантный.']),
        ...(result.warnings ?? []),
      ],
      summary:
        result.text_preview ||
        'Текст резюме не извлечён.',
    };
  }

  async function startAnalysis() {
    if (isProcessing) return;

    const pending = queue.filter(item =>
      item.state === 'waiting' || item.state === 'error'
    );

    if (pending.length === 0) return;

    setIsProcessing(true);
    setCompleted(false);

    const imported: Candidate[] = [];

    for (const item of pending) {
      updateFile(item.id, {
        state: 'processing',
        error: undefined,
      });

      try {
        const result = await analyzeFile(item.file);
        const candidate = toCandidate(result, nextId.current++);

        imported.push(candidate);

        updateFile(item.id, { state: 'done' });
      } catch (error) {
        updateFile(item.id, {
          state: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка',
        });
      }
    }

    if (imported.length > 0) {
      onCandidatesImported(imported);
    }

    setIsProcessing(false);
    setCompleted(true);
  }

  function clearFinished() {
    if (isProcessing) return;

    setQueue(previous =>
      previous.filter(
        item => item.state !== 'done'
      )
    );
    setCompleted(false);
  }

  return (
    <section className="import-page">
      <div className="import-intro">
        <p className="eyebrow">Работа с откликами</p>
        <h1>Импорт резюме</h1>
        <p>
          Загрузи PDF-файлы. TalentFlow извлечёт доступную
          информацию и подготовит карточки кандидатов.
        </p>
      </div>

      <div className="import-upload-card">
        <div className="import-upload-symbol">↥</div>

        <h2>Добавить резюме</h2>
        <p>
          Можно выбрать сразу несколько PDF.
          Максимальный размер каждого — 5 МБ.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          disabled={isProcessing}
          onChange={handleFileSelection}
        />

        <button
          type="button"
          className="import-select-button"
          disabled={isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          + Выбрать PDF-файлы
        </button>
      </div>

      <div className="import-privacy-note">
        Сейчас файлы отправляются на локальный Python-сервер.
        Для тестирования используй только вымышленные резюме.
      </div>

      <div className="import-queue">
        <div className="import-section-header">
          <h2>Выбранные файлы</h2>
          <span>{queue.length} файлов</span>
        </div>

        {queue.length === 0 ? (
          <div className="import-empty">
            Здесь появятся выбранные PDF-файлы.
          </div>
        ) : (
          <>
            {queue.map(item => (
              <div className="import-file" key={item.id}>
                <div className="import-file-icon">PDF</div>

                <div className="import-file-details">
                  <strong>{item.file.name}</strong>
                  <span>
                    {(item.file.size / 1024).toFixed(1)} КБ
                    {' · '}
                    {item.state === 'waiting' && 'Ожидает'}
                    {item.state === 'processing' && 'Обрабатывается...'}
                    {item.state === 'done' && 'Готово'}
                    {item.state === 'error' && 'Ошибка'}
                  </span>

                  {item.error && (
                    <p className="import-error" role="alert">
                      {item.error}
                    </p>
                  )}
                </div>

                <button
                  className="import-remove"
                  disabled={isProcessing}
                  onClick={() => removeFile(item.id)}
                  aria-label={`Убрать ${item.file.name}`}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="import-progress-area">
              <div className="import-progress-label">
                <span>Прогресс обработки</span>
                <strong>{processedCount} / {queue.length}</strong>
              </div>

              <div className="import-progress-track">
                <div
                  className="import-progress-fill"
                  style={{
                    width: `${
                      queue.length
                        ? (processedCount / queue.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className="import-actions">
          <button
            className="import-start-button"
            disabled={
              isProcessing ||
              !queue.some(item =>
                item.state === 'waiting' || item.state === 'error'
              )
            }
            onClick={startAnalysis}
          >
            {isProcessing
              ? 'Анализ выполняется...'
              : 'Начать анализ →'}
          </button>

          {queue.some(item => item.state === 'done') && (
            <button
              className="import-secondary-button"
              onClick={clearFinished}
              disabled={isProcessing}
            >
              Очистить завершённые
            </button>
          )}
        </div>

        {completed && (
          <div className="import-complete" role="status">
            <strong>Обработка завершена.</strong>
            <p>
              Успешно в последней партии: {
                successfulCount
              } из {queue.length} файлов в списке.
              Успешные резюме добавлены в галерею.
            </p>
            <button onClick={onOpenCandidates}>
              Открыть кандидатов →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
