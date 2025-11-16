export interface SentenceData {
  id: string;
  sentence: string;
  chinese: string;
  pronunciation: string;
}

export interface LessonConfig {
  lessonNumber: number;
  title: string;
  sentences: SentenceData[];
}
