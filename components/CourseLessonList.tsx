"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { fetchCourseProgress, LessonProgress } from "../lib/learningProgress";
import { getLocalLessonProgress, LocalLessonProgress, setLocalLessonProgress } from "../lib/localProgress";
import { LessonConfig } from "../data/types";

const PLACEHOLDER_IMAGE = "https://pub-8d9c7b440bdc4316a94cd1a6ec45d0ce.r2.dev/lingq.png";

interface CourseLessonListProps {
  courseId: string;
  lessons: LessonConfig[];
}

export function CourseLessonList({ courseId, lessons }: CourseLessonListProps) {
  const { user } = useAuth();
  const [progressByLesson, setProgressByLesson] = useState<Record<number, LocalLessonProgress>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  const loadProgress = useCallback(async () => {
    setLoadingProgress(true);
    const nextProgress: Record<number, LocalLessonProgress> = {};
    try {
      let remoteRecords: Record<string, LessonProgress> | null = null;
      if (user?.id) {
        remoteRecords = await fetchCourseProgress({ userId: user.id });
      }
      lessons.forEach((lesson) => {
        const local = getLocalLessonProgress(courseId, lesson.lessonNumber);
        const remoteKey = `${courseId}_${lesson.lessonNumber}`;
        const remote = remoteRecords?.[remoteKey];
        const chosen = remote
          ? { currentSentenceIndex: remote.currentSentenceIndex, completionCount: remote.completionCount }
          : local;
        nextProgress[lesson.lessonNumber] = chosen;
        if (remote) {
          setLocalLessonProgress(courseId, lesson.lessonNumber, chosen);
        }
      });
      setProgressByLesson(nextProgress);
    } finally {
      setLoadingProgress(false);
    }
  }, [courseId, lessons, user?.id]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const handleUpdate = () => {
      void loadProgress();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("progressUpdated", handleUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("progressUpdated", handleUpdate);
      }
    };
  }, [loadProgress]);

  const getProgressPercent = (lesson: LessonConfig) => {
    const lessonProgress = progressByLesson[lesson.lessonNumber];
    if (!lesson.sentences.length) {
      return 0;
    }
    const percent = Math.round(
      ((lessonProgress?.currentSentenceIndex ?? 0) / lesson.sentences.length) * 100
    );
    return Math.min(Math.max(percent, 0), 100);
  };

  const getCompletionText = (lesson: LessonConfig) => {
    const lessonProgress = progressByLesson[lesson.lessonNumber];
    if (!lessonProgress?.completionCount) {
      return "尚未学习";
    }
    return `已学习${lessonProgress.completionCount}遍`;
  };

  return (
    <div style={{ width: "100%" }}>
      {loadingProgress && (
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#c8d2ff" }}>同步进度中...</span>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "0.8rem",
          width: "100%",
          justifyItems: "center"
        }}
      >
        {lessons.map((lesson) => {
          const percent = getProgressPercent(lesson);

          return (
            <Link
              key={lesson.lessonNumber}
              href={`/courses/${courseId}/lessons/${lesson.lessonNumber}`}
              style={{ textDecoration: "none", color: "inherit", width: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.35rem",
                  width: "100%",
                  minHeight: "360px",
                  borderRadius: "16px",
                  background: "#070717",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <img
                  src={PLACEHOLDER_IMAGE}
                  alt={lesson.title}
                  style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px" }}
                />
                <div style={{ textAlign: "center", width: "100%" }}>
                  <h2 style={{ margin: "0.15rem 0 0.3rem" }}>{lesson.title}</h2>
                  <p style={{ margin: "0", color: "#a8ffa8" }}>开始练习</p>
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "999px",
                      background: "#14142c",
                      overflow: "hidden",
                      margin: "0.6rem auto 0.35rem",
                      width: "90%"
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percent}%`,
                        background: "#00ff66",
                        transition: "width 0.35s ease"
                      }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#89ffcb" }}>{getCompletionText(lesson)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
