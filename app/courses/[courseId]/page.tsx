import Link from "next/link";
import { notFound } from "next/navigation";
import { courseConfigs } from "../../../data/courses";

const PLACEHOLDER_IMAGE = "https://pub-8d9c7b440bdc4316a94cd1a6ec45d0ce.r2.dev/lingq.png";

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
        <h1 style={{ margin: "0.25rem 0" }}>{course.title}</h1>
        <p style={{ marginTop: 0, color: "#b2b2ff" }}>
          选择课次开始练习，共 {course.lessons.length} 课。
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "1200px",
          justifyItems: "center"
        }}
      >
        {course.lessons.map((lesson) => (
          <Link
            key={lesson.lessonNumber}
            href={`/courses/${course.courseId}/lessons/${lesson.lessonNumber}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.5rem"
              }}
            >
              <img
                src={PLACEHOLDER_IMAGE}
                alt={lesson.title}
                style={{ width: "250px", height: "180px", objectFit: "cover", borderRadius: "8px" }}
              />
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0.4rem 0 0.2rem" }}>{lesson.title}</h2>
                <p style={{ margin: "0", color: "#a8ffa8" }}>开始练习</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
