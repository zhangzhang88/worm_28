#!/usr/bin/env python3
import re
import subprocess
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
SCRIPTS_DIR = SCRIPT_PATH.parent
ROOT = SCRIPTS_DIR.parent
INDEX_FILE = ROOT / "data" / "courses" / "index.ts"
RAW_DATA_FILE = SCRIPTS_DIR / "1-new_data.txt"
GENERATED_FILE = SCRIPTS_DIR / "generated_lesson.ts"
CONVERTER_SCRIPT = SCRIPTS_DIR / "convert_new_data.py"


def sanitize_identifier(value: str) -> str:
  cleaned = re.sub(r'[^0-9a-zA-Z]+', '', value)
  if not cleaned:
    raise ValueError("课程 ID 无效，无法生成变量名")
  if cleaned[0].isdigit():
    cleaned = f"course{cleaned}"
  return cleaned


def lesson_const_name(course_id: str) -> str:
  base = sanitize_identifier(course_id)
  return f"{base}Lessons"


def prompt_input(prompt: str) -> str:
  value = input(prompt).strip()
  if not value:
    raise ValueError(f"{prompt} 不能为空")
  return value


def ensure_import(content: str, course_id: str, lesson_num: int, var_name: str) -> str:
  import_line = f"import {{ sentences as {var_name} }} from './{course_id}/lesson{lesson_num}';"
  if import_line in content:
    return content

  lines = content.splitlines()
  last_import_idx = max(idx for idx, line in enumerate(lines) if line.startswith('import '))
  lines.insert(last_import_idx + 1, import_line)
  return "\n".join(lines)


def insert_lesson_block(content: str, course_id: str, lesson_num: int, lesson_title: str, var_name: str) -> str:
  const_name = lesson_const_name(course_id)
  lesson_snippet = (
    f"  {{\n"
    f"    lessonNumber: {lesson_num},\n"
    f"    title: 'Lesson {lesson_num} - {lesson_title}',\n"
    f"    sentences: {var_name}\n"
    f"  }},\n"
  )

  pattern = re.compile(rf"(const {re.escape(const_name)}: LessonConfig\[] = \[)([\s\S]*?)(\];)", re.MULTILINE)
  match = pattern.search(content)
  if match:
    updated_block = match.group(1) + match.group(2) + lesson_snippet + match.group(3)
    return content[:match.start()] + updated_block + content[match.end():]

  block = f"const {const_name}: LessonConfig[] = [\n{lesson_snippet}];\n\n"
  insert_pos = content.find("export const courseConfigs")
  if insert_pos == -1:
    raise ValueError("未找到 courseConfigs 定义")
  return content[:insert_pos] + block + content[insert_pos:]


def ensure_course_entry(content: str, course_id: str, course_title: str) -> str:
  if f"{course_id}:" in content:
    return content

  const_name = lesson_const_name(course_id)
  entry = (
    f"  {course_id}: {{\n"
    f"    courseId: '{course_id}',\n"
    f"    title: '{course_title}',\n"
    f"    lessons: {const_name}\n"
    f"  }},\n"
  )

  marker = "export const courseConfigs"
  start_idx = content.find(marker)
  if start_idx == -1:
    raise ValueError("未找到 courseConfigs 定义")

  brace_idx = content.find("{", start_idx)
  if brace_idx == -1:
    raise ValueError("courseConfigs 缺少大括号")

  brace_level = 1
  pos = brace_idx + 1
  while pos < len(content) and brace_level > 0:
    char = content[pos]
    if char == "{":
      brace_level += 1
    elif char == "}":
      brace_level -= 1
    pos += 1

  if brace_level != 0:
    raise ValueError("无法解析 courseConfigs 的大括号")

  insert_pos = pos - 1
  return content[:insert_pos] + "\n" + entry + content[insert_pos:]


def ensure_raw_data() -> None:
  if not RAW_DATA_FILE.exists():
    raise FileNotFoundError(f"未找到 {RAW_DATA_FILE}")
  if not RAW_DATA_FILE.read_text(encoding="utf-8").strip():
    raise ValueError(f"{RAW_DATA_FILE} 为空，请先粘贴原始句子数据。")


def generate_lesson_content() -> str:
  ensure_raw_data()
  if not CONVERTER_SCRIPT.exists():
    raise FileNotFoundError(f"未找到转换脚本：{CONVERTER_SCRIPT}")

  cmd = [
    sys.executable,
    str(CONVERTER_SCRIPT),
    "-i",
    str(RAW_DATA_FILE),
    "-o",
    str(GENERATED_FILE),
  ]
  subprocess.run(cmd, check=True, cwd=str(SCRIPTS_DIR))

  if not GENERATED_FILE.exists():
    raise FileNotFoundError(f"转换输出缺失：{GENERATED_FILE}")
  return GENERATED_FILE.read_text(encoding="utf-8").strip()


def main():
  try:
    lesson_content = generate_lesson_content()
  except Exception as error:
    print(f"[错误] 无法生成 lesson 数据：{error}")
    return

  course_number = prompt_input("请输入课程编号（纯数字，例如 1 表示 courseId_1）: ")
  course_id = f"courseId_{course_number}"
  lesson_number = int(prompt_input("请输入 lesson 编号（数字）: "))
  lesson_title = prompt_input("请输入 lesson 简介（用于标题）: ").replace("'", "\\'")

  index_content = INDEX_FILE.read_text(encoding="utf-8")
  var_name = f"{sanitize_identifier(course_id)}Lesson{lesson_number}"

  index_content = ensure_import(index_content, course_id, lesson_number, var_name)

  course_exists = f"{course_id}:" in index_content
  if not course_exists:
    course_title = prompt_input("检测到新课程，请输入课程标题: ").replace("'", "\\'")
  else:
    course_title = ""

  index_content = insert_lesson_block(index_content, course_id, lesson_number, lesson_title, var_name)
  if not course_exists:
    index_content = ensure_course_entry(index_content, course_id, course_title)

  INDEX_FILE.write_text(index_content, encoding="utf-8")

  lesson_file = ROOT / "data" / "courses" / course_id / f"lesson{lesson_number}.ts"
  lesson_file.parent.mkdir(parents=True, exist_ok=True)
  if lesson_file.exists():
    print(f"[提示] {lesson_file} 已存在，未覆盖。请手动粘贴 {GENERATED_FILE} 中的内容。")
  else:
    lesson_file.write_text(lesson_content + "\n", encoding="utf-8")
    print(f"[完成] 已创建 {lesson_file} 并写入 {GENERATED_FILE} 的内容。")

  if not course_exists:
    print(f"[提示] 新课程 {course_id} 的中文名为 '{course_title}'，请确保后台也同步了该名称。")

  print("[完成] data/courses/index.ts 已更新。")


if __name__ == "__main__":
  main()
