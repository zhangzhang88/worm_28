export interface LocalLessonProgress {
  currentSentenceIndex: number;
  completionCount: number;
}

const STORAGE_PREFIX = "lessonProgress";

const DEFAULT_PROGRESS: LocalLessonProgress = {
  currentSentenceIndex: 0,
  completionCount: 0
};

const buildKey = (courseId: string, lessonNumber: number) => `${STORAGE_PREFIX}_${courseId}_${lessonNumber}`;

function parseProgress(value: string | null): LocalLessonProgress {
  if (!value) {
    return { ...DEFAULT_PROGRESS };
  }
  try {
    const parsed = JSON.parse(value);
    return {
      currentSentenceIndex: typeof parsed?.currentSentenceIndex === "number" ? parsed.currentSentenceIndex : 0,
      completionCount: typeof parsed?.completionCount === "number" ? parsed.completionCount : 0
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function getLocalLessonProgress(courseId: string, lessonNumber: number): LocalLessonProgress {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PROGRESS };
  }
  const stored = localStorage.getItem(buildKey(courseId, lessonNumber));
  return parseProgress(stored);
}

export function setLocalLessonProgress(
  courseId: string,
  lessonNumber: number,
  progress: Partial<LocalLessonProgress>
) {
  if (typeof window === "undefined") {
    return;
  }

  const merged: LocalLessonProgress = {
    ...DEFAULT_PROGRESS,
    ...getLocalLessonProgress(courseId, lessonNumber),
    ...progress
  };

  localStorage.setItem(buildKey(courseId, lessonNumber), JSON.stringify(merged));
}

export function incrementLocalLessonCompletion(
  courseId: string,
  lessonNumber: number,
  currentSentenceIndex?: number
): LocalLessonProgress {
  const existing = getLocalLessonProgress(courseId, lessonNumber);
  const nextCount = existing.completionCount + 1;
  const nextProgress: LocalLessonProgress = {
    currentSentenceIndex: typeof currentSentenceIndex === "number" ? currentSentenceIndex : existing.currentSentenceIndex,
    completionCount: nextCount
  };
  setLocalLessonProgress(courseId, lessonNumber, nextProgress);
  return nextProgress;
}
