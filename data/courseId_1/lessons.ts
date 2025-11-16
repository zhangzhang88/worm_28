import { LessonConfig } from '../types';
import { sentences as lesson1Sentences } from './lesson1';
import { sentences as lesson2Sentences } from './lesson2';

export const courseLessons: LessonConfig[] = [
  {
    lessonNumber: 1,
    title: 'Lesson 1 - 基础句子',
    sentences: lesson1Sentences
  },
  {
    lessonNumber: 2,
    title: 'Lesson 2 - This/That 练习',
    sentences: lesson2Sentences
  }
];

export const getLessonByNumber = (lessonNumber: number): LessonConfig | undefined =>
  courseLessons.find(lesson => lesson.lessonNumber === lessonNumber);
