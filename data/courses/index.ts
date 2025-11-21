import { LessonConfig } from '../types';
import { sentences as course1Lesson1 } from './courseId_1/lesson1';
import { sentences as course1Lesson2 } from './courseId_1/lesson2';
import { sentences as courseId1Lesson2 } from './courseId_1/lesson2';
import { sentences as courseId1Lesson1 } from './courseId_1/lesson1';
import { sentences as courseId1Lesson3 } from './courseId_1/lesson3';
import { sentences as courseId1Lesson4 } from './courseId_1/lesson4';

interface CourseConfig {
  courseId: string;
  title: string;
  lessons: LessonConfig[];
}

const courseId1Lessons: LessonConfig[] = [  {
    lessonNumber: 1,
    title: 'Lesson 1 - 基础英语句子学习',
    sentences: courseId1Lesson1
  },
  {
    lessonNumber: 2,
    title: 'Lesson 2 - 基础英语句子学习',
    sentences: courseId1Lesson2
  },
  {
    lessonNumber: 3,
    title: 'Lesson 3 - 基础英语句子学习',
    sentences: courseId1Lesson3
  },  {
    lessonNumber: 4,
    title: 'Lesson 4 - 基础英语句子学习',
    sentences: courseId1Lesson4
  },
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