import { LessonConfig } from '../types';

interface CourseConfig {
  courseId: string;
  title: string;
  lessons: LessonConfig[];
}

export const courseConfigs: Record<string, CourseConfig> = {
};

export const getCourseById = (courseId: string): CourseConfig | undefined =>
  courseConfigs[courseId];

export const getLessonByCourse = (courseId: string, lessonNumber: number): LessonConfig | undefined => {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  return course.lessons.find((lesson) => lesson.lessonNumber === lessonNumber);
};
