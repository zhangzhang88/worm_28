import Link from "next/link";
import { courseConfigs } from "../data/courses";

const PLACEHOLDER_IMAGE = "https://pub-8d9c7b440bdc4316a94cd1a6ec45d0ce.r2.dev/lingq.png";

const buildCourseLabel = (courseId: string, title?: string) => `${courseId}${title ?? ""}`;

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        backgroundColor: "#05051d",
        color: "#fff",
        padding: "2rem"
      }}
    >
      <h1>学英语 - 智能语音课程系统</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "1100px",
          justifyItems: "center"
        }}
      >
        {Object.values(courseConfigs).map((course) => (
          <Link
            key={course.courseId}
            href={`/courses/${course.courseId}`}
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
                alt={buildCourseLabel(course.courseId, course.title)}
                style={{ width: "250px", height: "180px", objectFit: "cover", borderRadius: "8px" }}
              />
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0.4rem 0 0.2rem" }}>{buildCourseLabel(course.courseId, course.title)}</h2>
                <p style={{ margin: "0", color: "#a8ffa8" }}>共{course.lessons.length}课</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
