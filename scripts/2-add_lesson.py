#!/usr/bin/env python3
import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
SCRIPTS_DIR = SCRIPT_PATH.parent
ROOT = SCRIPTS_DIR.parent
INDEX_FILE = ROOT / "data" / "courses" / "index.ts"
RAW_DATA_FILE = SCRIPTS_DIR / "1-new_data.txt"
GENERATED_FILE = SCRIPTS_DIR / "generated_lesson.ts"
CONVERTER_SCRIPT = SCRIPTS_DIR / "convert_new_data.py"
PUBLIC_TTS_ROOT = ROOT / "public" / "tts"

TTS_ENDPOINT = "https://edge.ztr8.uk/v1/audio/speech"
TTS_API_KEY = "your_api_key_here"
TTS_VOICES = ("en-US-JennyNeural", "en-US-GuyNeural")
TTS_MAX_RETRIES = 3
TTS_RETRY_DELAY = 2


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

  block_pattern = re.compile(
    rf"(const {re.escape(const_name)}: LessonConfig\[] = \[)([\s\S]*?)(\];)",
    re.MULTILINE,
  )
  match = block_pattern.search(content)
  if match:
    block_body = match.group(2)
    entry_pattern = re.compile(rf"\s*\{{\s*lessonNumber:\s*{lesson_num},[\s\S]*?\}},\s*\n", re.MULTILINE)
    entry_match = entry_pattern.search(block_body)
    if entry_match:
      block_body = block_body[:entry_match.start()] + lesson_snippet + block_body[entry_match.end():]
    else:
      trimmed_body = block_body.rstrip()
      if trimmed_body:
        if not trimmed_body.endswith(","):
          trimmed_body += ","
        trimmed_body += "\n"
      block_body = trimmed_body + lesson_snippet
    updated_block = match.group(1) + block_body + match.group(3)
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


def extract_sentences_from_ts(content: str) -> list[str]:
  marker = "export const"
  marker_pos = content.find(marker)
  if marker_pos == -1:
    raise ValueError("未找到导出的句子数组")

  equals_pos = content.find("=", marker_pos)
  if equals_pos == -1:
    raise ValueError("未找到赋值运算符")

  start = content.find("[", equals_pos)
  if start == -1:
    raise ValueError("未找到句子数组的起始括号")

  end_marker = content.rfind("];")
  if end_marker != -1:
    end = end_marker
  else:
    end = content.rfind("]")
  if end == -1:
    raise ValueError("未找到句子数组的结束括号")

  array_text = content[start:end + 1]
  records = json.loads(array_text)
  sentences = []
  for record in records:
    sentence = record.get("sentence", "").strip()
    if sentence:
      sentences.append(sentence)
  return sentences


def request_tts_audio(text: str, voice: str) -> bytes:
  payload = {
    "model": "tts-1",
    "input": text,
    "voice": voice,
    "response_format": "mp3",
  }
  body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
  req = urllib.request.Request(TTS_ENDPOINT, data=body, method="POST")
  req.add_header("Content-Type", "application/json")
  req.add_header("Authorization", f"Bearer {TTS_API_KEY}")

  last_error = None
  for attempt in range(1, TTS_MAX_RETRIES + 1):
    try:
      with urllib.request.urlopen(req, timeout=180) as resp:
        if resp.status != 200:
          raise RuntimeError(f"TTS 接口返回异常状态码 {resp.status}")
        return resp.read()
    except urllib.error.HTTPError as error:
      message = error.read().decode("utf-8", errors="ignore")
      last_error = RuntimeError(f"TTS 请求失败：{error.code} {message.strip()}")
    except urllib.error.URLError as error:
      last_error = RuntimeError(f"TTS 请求失败：{error.reason}")
    except Exception as error:
      last_error = RuntimeError(f"TTS 请求异常：{error}")

    if attempt < TTS_MAX_RETRIES:
      print(f"[提示] 第 {attempt} 次尝试失败，{voice} 语音将在 {TTS_RETRY_DELAY}s 后重试...")
      time.sleep(TTS_RETRY_DELAY)

  raise last_error or RuntimeError("未知的 TTS 请求失败")


def generate_lesson_audio(course_id: str, lesson_number: int, sentences: list[str]) -> None:
  if not sentences:
    print("[提示] 未能从 lesson 内容中提取句子，跳过语音生成。")
    return

  for idx, sentence in enumerate(sentences, 1):
    trimmed_sentence = sentence.strip()
    hash_name = hashlib.sha256(trimmed_sentence.encode("utf-8")).hexdigest()[:16]
    for voice in TTS_VOICES:
      dest_dir = PUBLIC_TTS_ROOT / course_id / f"lesson{lesson_number}" / voice
      dest_dir.mkdir(parents=True, exist_ok=True)
      dest_file = dest_dir / f"{hash_name}.mp3"
      if dest_file.exists():
        print(f"[跳过] {voice} 第 {idx} 条语音已存在，路径: {dest_file}")
        continue

      while True:
        try:
          audio = request_tts_audio(trimmed_sentence, voice)
        except Exception as error:
          print(f"[错误] {voice} 第 {idx} 条语音生成失败：{error}，{TTS_RETRY_DELAY}s 后重试...")
          time.sleep(TTS_RETRY_DELAY)
          continue
        dest_file.write_bytes(audio)
        print(f"[完成] {voice} 第 {idx} 条语音保存到 {dest_file}")
        break


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

  try:
    lesson_file_content = lesson_file.read_text(encoding="utf-8")
    sentences = extract_sentences_from_ts(lesson_file_content)
  except Exception as error:
    print(f"[错误] 解析 lesson 内容失败，无法生成语音：{error}")
    return

  generate_lesson_audio(course_id, lesson_number, sentences)

  if not course_exists:
    print(f"[提示] 新课程 {course_id} 的中文名为 '{course_title}'，请确保后台也同步了该名称。")

  print("[完成] data/courses/index.ts 已更新。")


if __name__ == "__main__":
  main()
