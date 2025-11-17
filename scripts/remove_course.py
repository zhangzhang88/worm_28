#!/usr/bin/env python3
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT / "data" / "courses" / "index.ts"
COURSES_DIR = ROOT / "data" / "courses"


def prompt_course_number() -> str:
  value = input("请输入要删除的课程编号（纯数字，例如 4 表示 courseId_4）: ").strip()
  if not value.isdigit():
    raise ValueError("课程编号必须是数字")
  return value


def sanitize_identifier(value: str) -> str:
  cleaned = re.sub(r'[^0-9a-zA-Z]+', '', value)
  if not cleaned:
    raise ValueError("课程 ID 无效")
  if cleaned[0].isdigit():
    cleaned = f"course{cleaned}"
  return cleaned


def lesson_const_name(course_id: str) -> str:
  base = sanitize_identifier(course_id)
  return f"{base}Lessons"


def remove_imports(content: str, course_id: str) -> str:
  pattern = re.compile(rf"import[^\n]+./{course_id}/[^\n]+;\n?", re.MULTILINE)
  new_content, _ = pattern.subn("", content)
  return new_content


def remove_lessons_block(content: str, course_id: str) -> str:
  const_name = lesson_const_name(course_id)
  pattern = re.compile(
    rf"\n?const {re.escape(const_name)}: LessonConfig\[] = \[[\s\S]*?\];\n\n",
    re.MULTILINE
  )
  new_content, _ = pattern.subn("\n", content, count=1)
  return new_content


def remove_course_entry(content: str, course_id: str) -> str:
  pattern = re.compile(
    rf"\n\s*{re.escape(course_id)}:\s*\{{[\s\S]*?}},?\n",
    re.MULTILINE
  )
  new_content, count = pattern.subn("\n", content, count=1)
  if count == 0:
    raise ValueError(f"未能在 courseConfigs 中找到 {course_id}")
  return new_content


def clean_blank_lines(content: str) -> str:
  content = re.sub(r",\n(\s*};)", r"\n\1", content)
  return re.sub(r"\n{3,}", "\n\n", content).strip() + "\n"


def delete_course_dir(course_id: str) -> None:
  target = COURSES_DIR / course_id
  if target.exists():
    shutil.rmtree(target)
    print(f"[完成] 已删除目录 {target}")
  else:
    print(f"[提示] 未找到目录 {target}")


def main() -> None:
  course_number = prompt_course_number()
  course_id = f"courseId_{course_number}"

  if not INDEX_FILE.exists():
    raise FileNotFoundError(f"未找到索引文件：{INDEX_FILE}")

  content = INDEX_FILE.read_text(encoding="utf-8")
  if f"{course_id}:" not in content:
    print(f"[提示] {course_id} 未在索引中找到，无需修改。")
    delete_course_dir(course_id)
    return

  content = remove_imports(content, course_id)
  content = remove_lessons_block(content, course_id)
  content = remove_course_entry(content, course_id)
  content = clean_blank_lines(content)

  INDEX_FILE.write_text(content, encoding="utf-8")
  print(f"[完成] 已更新 {INDEX_FILE}，移除 {course_id} 的配置。")

  delete_course_dir(course_id)


if __name__ == "__main__":
  try:
    main()
  except Exception as error:
    print(f"[错误] {error}")
