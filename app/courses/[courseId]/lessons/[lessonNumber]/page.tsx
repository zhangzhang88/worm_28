import { notFound } from "next/navigation";
import TypingGame from "../../../../../components/TypingGame";
import { courseConfigs, getLessonByCourse } from "../../../../../data/courses";

interface LessonPageProps {
  params: {
    courseId: string;
    lessonNumber: string;
  };
}

export function generateStaticParams() {
  return Object.values(courseConfigs).flatMap((course) =>
    course.lessons.map((lesson) => ({
      courseId: course.courseId,
      lessonNumber: lesson.lessonNumber.toString()
    }))
  );
}

const LESSON_TITLE_REGEX = /^Lesson\s*\d+\s*-\s*/i;

export default function LessonPage({ params }: LessonPageProps) {
  const courseId = params.courseId;
  const lessonNumber = Number(params.lessonNumber);
  const lessonData = getLessonByCourse(courseId, lessonNumber);
  const courseData = courseConfigs[courseId];

  if (!lessonData || !courseData) {
    notFound();
  }

  const normalizedLessonTitle = lessonData.title.replace(LESSON_TITLE_REGEX, "").trim();

  return (
    <TypingGame
      courseId={courseId}
      lessonNumber={lessonData.lessonNumber}
      sentences={lessonData.sentences}
      totalLessons={courseData.lessons.length}
      lessonTitle={`${courseId} - Lesson${lessonNumber} - ${normalizedLessonTitle}`}
    />
  );
}
