import { notFound } from "next/navigation";
import TypingGame from "../../../../../components/TypingGame";
import { courseLessons, getLessonByNumber } from "../../../../../data/courseId_1/lessons";

interface LessonPageProps {
  params: {
    lessonNumber: string;
  };
}

export function generateStaticParams() {
  return courseLessons.map((lesson) => ({
    lessonNumber: lesson.lessonNumber.toString()
  }));
}

export default function LessonPage({ params }: LessonPageProps) {
  const lessonNumber = Number(params.lessonNumber);
  const lessonData = getLessonByNumber(lessonNumber);

  if (!lessonData) {
    notFound();
  }

  return (
    <TypingGame
      lessonNumber={lessonData.lessonNumber}
      sentences={lessonData.sentences}
      totalLessons={courseLessons.length}
      lessonTitle={lessonData.title}
    />
  );
}
