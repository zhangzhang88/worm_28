import { supabase } from "./supabaseClient";

const TABLE_NAME = "learning_progress";

export interface LessonProgress {
  currentSentenceIndex: number;
  completionCount: number;
}

export async function saveLearningProgress({
  userId,
  courseId,
  lessonNumber,
  currentSentenceIndex
}: {
  userId: string;
  courseId: string;
  lessonNumber: number;
  currentSentenceIndex: number;
}) {
  if (!userId) {
    return;
  }

  const payload: Record<string, unknown> = {
    user_id: userId,
    course_id: courseId,
    lesson_number: lessonNumber,
    current_sentence_index: currentSentenceIndex
  };

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, {
    onConflict: "user_id,course_id,lesson_number",
    ignoreDuplicates: false
  });

  if (error) {
    console.error("Failed to save learning progress:", error);
  }

  return error;
}

export async function fetchLessonProgress({
  userId,
  courseId,
  lessonNumber
}: {
  userId: string;
  courseId: string;
  lessonNumber: number;
}): Promise<LessonProgress | null> {
  if (!userId) {
    return null;
  }

  const query = () =>
    supabase
      .from(TABLE_NAME)
      .select("current_sentence_index,completion_count")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("lesson_number", lessonNumber)
      .maybeSingle();

  let { data, error } = await query();

  if (error && error.message?.includes("completion_count")) {
    const fallbackResult = await supabase
      .from(TABLE_NAME)
      .select("current_sentence_index")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("lesson_number", lessonNumber)
      .maybeSingle();

    if (!fallbackResult.error) {
      const fallbackData = fallbackResult.data ?? null;
      if (fallbackData) {
        error = null;
        data = {
          ...fallbackData,
          completion_count: 0
        };
      } else {
        data = null;
      }
    }
  }

  if (error) {
    console.error("Failed to load learning progress:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    currentSentenceIndex: data.current_sentence_index ?? 0,
    completionCount: data.completion_count ?? 0
  };
}

export async function fetchCourseProgress({
  userId
}: {
  userId: string;
}): Promise<Record<string, LessonProgress>> {
  if (!userId) {
    return {};
  }

  const query = () =>
    supabase
      .from(TABLE_NAME)
      .select("course_id,lesson_number,current_sentence_index,completion_count")
      .eq("user_id", userId);

  let { data, error } = await query();

  if (error && error.message?.includes("completion_count")) {
    const fallback = await supabase
      .from(TABLE_NAME)
      .select("course_id,lesson_number,current_sentence_index")
      .eq("user_id", userId);
    if (!fallback.error) {
      error = null;
      const fallbackData = fallback.data ?? [];
      data = fallbackData.map((record) => ({ ...record, completion_count: 0 }));
    }
  }

  if (error) {
    console.error("Failed to load course progress:", error);
    return {};
  }

  if (!data) {
    return {};
  }

  return data.reduce<Record<string, LessonProgress>>((acc, record) => {
    const key = `${record.course_id}_${record.lesson_number}`;
    acc[key] = {
      currentSentenceIndex: record.current_sentence_index ?? 0,
      completionCount: record.completion_count ?? 0
    };
    return acc;
  }, {});
}

export async function incrementLessonCompletion({
  userId,
  courseId,
  lessonNumber,
  currentSentenceIndex
}: {
  userId: string;
  courseId: string;
  lessonNumber: number;
  currentSentenceIndex?: number;
}) {
  if (!userId) {
    return;
  }

  const { data, error: readError } = await supabase
    .from(TABLE_NAME)
    .select("completion_count")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("lesson_number", lessonNumber)
    .maybeSingle();

  if (readError) {
    console.error("Failed to read completion count:", readError);
  }

  const nextCount = (data?.completion_count ?? 0) + 1;
  const payload: Record<string, unknown> = {
    user_id: userId,
    course_id: courseId,
    lesson_number: lessonNumber,
    completion_count: nextCount
  };

  if (typeof currentSentenceIndex === "number") {
    payload.current_sentence_index = currentSentenceIndex;
  }

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, {
    onConflict: "user_id,course_id,lesson_number",
    ignoreDuplicates: false
  });

  if (error) {
    console.error("Failed to increment completion count:", error);
  }

  return nextCount;
}
