import Link from "next/link";
import { courseConfigs } from "../data/courses";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", backgroundColor: "#05051d", color: "#fff", padding: "2rem" }}>
      <h1>Worm 28 - 智能语音课程系统</h1>
      <p>请选择课程和课次开始练习：</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "400px" }}>
        {Object.values(courseConfigs).map((course) => (
          <div key={course.courseId} style={{ border: "1px solid #333", borderRadius: "8px", padding: "1rem" }}>
            <h2 style={{ margin: "0 0 0.5rem 0" }}>{course.title}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {course.lessons.map((lesson) => (
                <li key={lesson.lessonNumber}>
                  <Link href={`/courses/${course.courseId}/lessons/${lesson.lessonNumber}`} style={{ color: "#00ff66" }}>
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
