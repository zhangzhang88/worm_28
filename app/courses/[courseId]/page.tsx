import Link from "next/link";
import { notFound } from "next/navigation";
import { courseConfigs } from "../../../data/courses";
import { CourseLessonList } from "../../../components/CourseLessonList";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export function generateStaticParams() {
  return Object.values(courseConfigs).map((course) => ({
    courseId: course.courseId
  }));
}

export default function CoursePage({ params }: CoursePageProps) {
  const course = courseConfigs[params.courseId];

  if (!course) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#05051d",
        color: "#fff",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center"
      }}
    >
      <div style={{ width: "100%", maxWidth: "960px" }}>
        <Link
          href="/"
          style={{
            color: "#7fffd4",
            textDecoration: "none",
            fontSize: "0.95rem",
            marginBottom: "0.5rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
        >
          ← 返回课程列表
        </Link>
        <h1 style={{ margin: "0.25rem 0" }}>{`${course.courseId}${course.title ?? ""}`}</h1>
        <p style={{ marginTop: 0, color: "#b2b2ff" }}>
          选择课次开始练习，共 {course.lessons.length} 课。
        </p>
      </div>
      <CourseLessonList courseId={course.courseId} lessons={course.lessons} />
    </main>
  );
}
