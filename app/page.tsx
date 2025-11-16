import Link from "next/link";
import { courseLessons } from "../data/courseId_1/lessons";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", backgroundColor: "#05051d", color: "#fff", padding: "2rem" }}>
      <h1>Worm 28 - 智能语音课程系统</h1>
      <p>请选择课程开始练习：</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {courseLessons.map((lesson) => (
          <li key={lesson.lessonNumber} style={{ textAlign: "center" }}>
            <Link href={`/courses/courseId_1/lessons/${lesson.lessonNumber}`} style={{ color: "#00ff66" }}>
              {lesson.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
