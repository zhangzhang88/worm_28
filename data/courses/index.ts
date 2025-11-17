import { LessonConfig } from '../types';
import { sentences as course1Lesson1 } from './courseId_1/lesson1';
import { sentences as course1Lesson2 } from './courseId_1/lesson2';

interface CourseConfig {
  courseId: string;
  title: string;
  lessons: LessonConfig[];
}

const courseId1Lessons: LessonConfig[] = [
  {
    lessonNumber: 1,
    title: 'Lesson 1 - 基础句子',
    sentences: course1Lesson1
  },
  {
    lessonNumber: 2,
    title: 'Lesson 2 - jukebu',
    sentences: course1Lesson2
  }
];

export const courseConfigs: Record<string, CourseConfig> = {
  courseId_1: {
    courseId: 'courseId_1',
    title: '课程 1',
    lessons: courseId1Lessons
  }
};

export const getCourseById = (courseId: string): CourseConfig | undefined =>
  courseConfigs[courseId];

export const getLessonByCourse = (courseId: string, lessonNumber: number): LessonConfig | undefined => {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  return course.lessons.find((lesson) => lesson.lessonNumber === lessonNumber);
};
