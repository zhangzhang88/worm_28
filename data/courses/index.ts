import { LessonConfig } from '../types';
import { sentences as courseId1Lesson1 } from './courseId_1/lesson1';

interface CourseConfig {
  courseId: string;
  title: string;
  lessons: LessonConfig[];
}

const courseId1Lessons: LessonConfig[] = [
  {
    lessonNumber: 1,
    title: 'Lesson 1 - 基础英语句子学习',
    sentences: courseId1Lesson1
  },
];

export const courseConfigs: Record<string, CourseConfig> = {

  courseId_1: {
    courseId: 'courseId_1',
    title: '零基础学英语',
    lessons: courseId1Lessons
  },
};

export const getCourseById = (courseId: string): CourseConfig | undefined =>
  courseConfigs[courseId];

export const getLessonByCourse = (courseId: string, lessonNumber: number): LessonConfig | undefined => {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  return course.lessons.find((lesson) => lesson.lessonNumber === lessonNumber);
};