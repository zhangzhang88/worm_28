#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT / "data" / "courses" / "index.ts"
COURSES_DIR = ROOT / "data" / "courses"


def prompt_numeric(prompt: str) -> int:
  value = input(prompt).strip()
  if not value.isdigit():
    raise ValueError(f"{prompt} 请输入数字")
  return int(value)


def sanitize_identifier(value: str) -> str:
  cleaned = re.sub(r'[^0-9a-zA-Z]+', '', value)
  if not cleaned:
    raise ValueError("无效的 courseId")
  if cleaned[0].isdigit():
    cleaned = f"course{cleaned}"
  return cleaned


def lesson_const_name(course_id: str) -> str:
  base = sanitize_identifier(course_id)
  return f"{base}Lessons"


def lesson_var_name(course_id: str, lesson_num: int) -> str:
  base = sanitize_identifier(course_id)
  return f"{base}Lesson{lesson_num}"


def remove_import_line(content: str, course_id: str, lesson_num: int) -> str:
  var_name = lesson_var_name(course_id, lesson_num)
  pattern = re.compile(rf"import {{ sentences as {re.escape(var_name)} }} from './{re.escape(course_id)}/lesson{lesson_num}';\n?")
  return pattern.sub("", content, count=1)


def remove_lesson_entry(content: str, course_id: str, lesson_num: int) -> str:
  const_name = lesson_const_name(course_id)
  block_pattern = re.compile(
    rf"(const {re.escape(const_name)}: LessonConfig\[] = \[)([\s\S]*?)(\];)",
    re.MULTILINE
  )
  match = block_pattern.search(content)
  if not match:
    raise ValueError(f"未找到 {const_name} 定义")

  block_body = match.group(2)
  entry_pattern = re.compile(
    rf"\s*{{\s*lessonNumber:\s*{lesson_num},[\s\S]*?  }},\n",
    re.MULTILINE
  )
  new_body, count = entry_pattern.subn("", block_body, count=1)
  if count == 0:
    raise ValueError(f"{const_name} 中未找到 lessonNumber {lesson_num}")

  updated_block = match.group(1) + new_body + match.group(3)
  return content[:match.start()] + updated_block + content[match.end():]


def clean_blank_lines(content: str) -> str:
  return re.sub(r"\n{3,}", "\n\n", content).strip() + "\n"


def delete_lesson_file(course_id: str, lesson_num: int) -> None:
  lesson_file = COURSES_DIR / course_id / f"lesson{lesson_num}.ts"
  if lesson_file.exists():
    lesson_file.unlink()
    print(f"[完成] 已删除文件 {lesson_file}")
  else:
    print(f"[提示] 未找到文件 {lesson_file}")


def main() -> None:
  course_num = prompt_numeric("请输入课程编号（数字，例如 1 表示 courseId_1）: ")
  lesson_num = prompt_numeric("请输入要删除的 lesson 编号（数字）: ")
  course_id = f"courseId_{course_num}"

  if not INDEX_FILE.exists():
    raise FileNotFoundError(f"未找到 {INDEX_FILE}")

  content = INDEX_FILE.read_text(encoding="utf-8")
  if f"{course_id}:" not in content:
    raise ValueError(f"{course_id} 不存在")

  original_content = content
  content = remove_import_line(content, course_id, lesson_num)
  content = remove_lesson_entry(content, course_id, lesson_num)
  content = clean_blank_lines(content)

  if content == original_content:
    raise ValueError("未检测到任何修改，可能未找到对应的 lesson。")

  INDEX_FILE.write_text(content, encoding="utf-8")
  print(f"[完成] 已更新 {INDEX_FILE}，移除 {course_id} lesson {lesson_num}")

  delete_lesson_file(course_id, lesson_num)


if __name__ == "__main__":
  try:
    main()
  except Exception as error:
    print(f"[错误] {error}")
