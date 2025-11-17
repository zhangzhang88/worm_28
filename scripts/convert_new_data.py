#!/usr/bin/env python3
"""
Utility script that converts the raw data file into a TypeScript lesson file.

The parser is designed for text copied from course pages where each entry
contains the English sentence, its Chinese translation, and pronunciation.
Lines that only show navigation labels such as “课程目录” will be ignored.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Optional

DEFAULT_INPUT = "1-new_data.txt"
DEFAULT_OUTPUT = "generated_lesson.ts"

IGNORE_KEYWORDS = {"课程目录", "所有内容", "显示全部信息", "当前练习"}
PRON_PATTERN = re.compile(r"^(?:/[^\s/]+/ ?)+$")
LABEL_PATTERN = re.compile(r"^(英文|中文|发音|句子)[:：]\s*", re.IGNORECASE)
LEADING_INDEX_PATTERN = re.compile(r"^\s*[\d①②③④⑤⑥⑦⑧⑨⑩]+[.\-:：、\s]+")


def normalize_text(value: str) -> str:
    """Strip numbering / labels and collapse spaces."""
    cleaned = value.strip()
    cleaned = LABEL_PATTERN.sub("", cleaned)
    cleaned = LEADING_INDEX_PATTERN.sub("", cleaned)
    cleaned = cleaned.replace("\u3000", " ").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def should_skip_line(value: str) -> bool:
    stripped = value.strip()
    if not stripped:
        return True
    return any(keyword in stripped for keyword in IGNORE_KEYWORDS)


def try_parse_inline_row(line: str) -> Optional[Dict[str, str]]:
    """Handle rows where a single line contains all columns."""
    for delimiter in ("\t", "|"):
        if delimiter in line:
            parts = [normalize_text(part) for part in line.split(delimiter)]
            parts = [part for part in parts if part]
            if len(parts) >= 2:
                return {
                    "sentence": parts[0],
                    "chinese": parts[1],
                    "pronunciation": parts[2] if len(parts) > 2 else "",
                }

    if re.search(r"\s{2,}", line):
        parts = [normalize_text(part) for part in re.split(r"\s{2,}", line) if part.strip()]
        if len(parts) >= 2:
            return {
                "sentence": parts[0],
                "chinese": parts[1],
                "pronunciation": parts[2] if len(parts) > 2 else "",
            }
    return None


def categorize_line(value: str) -> str:
    if PRON_PATTERN.match(value):
        return "pronunciation"
    if re.search(r"[\u4e00-\u9fff]", value):
        return "chinese"
    return "sentence"


def finalize_entry(current: Dict[str, str], entries: List[Dict[str, str]]) -> None:
    if not current:
        return
    sentence = current.get("sentence", "").strip()
    chinese = current.get("chinese", "").strip()
    pronunciation = current.get("pronunciation", "").strip()
    if not sentence or not chinese:
        print(f"[跳过] 找到不完整的条目：{current}")
    else:
        entries.append(
            {
                "sentence": sentence,
                "chinese": chinese,
                "pronunciation": pronunciation,
            }
        )
    current.clear()


def parse_new_data(lines: List[str]) -> List[Dict[str, str]]:
    entries: List[Dict[str, str]] = []
    current: Dict[str, str] = {}

    for raw_line in lines:
        if should_skip_line(raw_line):
            continue

        inline_row = try_parse_inline_row(raw_line)
        if inline_row:
            finalize_entry(current, entries)
            entries.append(inline_row)
            continue

        cleaned = normalize_text(raw_line)
        if not cleaned:
            continue

        category = categorize_line(cleaned)
        if category == "sentence":
            if "sentence" in current:
                finalize_entry(current, entries)
            current["sentence"] = cleaned
        elif category == "chinese":
            current["chinese"] = cleaned
        else:
            current["pronunciation"] = cleaned

    finalize_entry(current, entries)
    return entries


def to_ts_content(
    records: List[Dict[str, str]],
    start_id: int,
    import_path: str,
    export_name: str,
) -> str:
    payload = []
    for idx, record in enumerate(records, start=start_id):
        payload.append(
            {
                "id": str(idx),
                "sentence": record["sentence"],
                "chinese": record["chinese"],
                "pronunciation": record.get("pronunciation", ""),
            }
        )

    data_literal = json.dumps(payload, ensure_ascii=False, indent=2)
    return (
        f"import {{ SentenceData }} from '{import_path}';\n\n"
        f"export const {export_name}: SentenceData[] = {data_literal};\n"
    )


def resolve_path(base: Path, value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = base / path
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert the raw lesson text file into a TS lesson file.")
    parser.add_argument(
        "-i",
        "--input",
        default=DEFAULT_INPUT,
        help=f"Path to the raw data file (default: {DEFAULT_INPUT}).",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output TS file path (default: {DEFAULT_OUTPUT}).",
    )
    parser.add_argument(
        "--start-id",
        type=int,
        default=1,
        help="Starting id for the generated sentences.",
    )
    parser.add_argument(
        "--import-path",
        default="../../types",
        help="Module path used in the import statement.",
    )
    parser.add_argument(
        "--export-name",
        default="sentences",
        help="Name of the exported SentenceData array.",
    )

    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    input_path = resolve_path(root, args.input)
    output_path = resolve_path(root, args.output)

    if not input_path.exists():
        raise FileNotFoundError(f"未找到输入文件: {input_path}")

    raw_lines = input_path.read_text(encoding="utf-8").splitlines()
    records = parse_new_data(raw_lines)
    if not records:
        raise ValueError("未能从输入文件中解析出任何句子，请检查输入文件格式。")

    ts_content = to_ts_content(records, args.start_id, args.import_path, args.export_name)
    output_path.write_text(ts_content, encoding="utf-8")
    print(f"[完成] 已写入 {len(records)} 条句子到 {output_path}")


if __name__ == "__main__":
    main()
