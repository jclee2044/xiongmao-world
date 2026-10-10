"""Bind each spoken Hanzi to its contextual phones, without editing models."""
from contextlib import contextmanager
from pathlib import Path
import re
import tempfile


def contextual_entries(pronunciation, lexicon, key_base=0xE000):
    entries, text = [], []
    for index, row in enumerate(pronunciation):
        zh, reading = row["zh"], row["pinyin"]
        if not re.fullmatch(r"[a-zü]+[0-4]", reading):
            text.append(zh)
            continue
        if row["carrier"] not in lexicon:
            text.append(zh)
            continue
        phones = list(lexicon[row["carrier"]])
        tone = int(reading[-1])
        # 得's modal reading děi has a different final from de.
        if reading == "dei3":
            phones = (["d", "ei3", "#0"] if "#0" in phones else
                      ["ㄉ", "ㄟ", "3"] if phones[-1].isdigit() else
                      ["ㄉ", "ㄟ", "ˇ"])
        elif "#0" in phones:
            phones = [re.sub(r"[1-5]$", str(tone or 5), phone) for phone in phones]
        elif phones[-1].isdigit():
            # Kokoro uses separate numeric tone tokens; VITS uses tone marks.
            phones[-1] = str(tone or 5)
        else:
            phones[-1] = ["˙", "ˉ", "ˊ", "ˇ", "ˋ"][tone]
        # Unique keys preserve different readings of the same character in
        # one utterance, and bypass the model's phrase matcher.
        key = chr(key_base + index)
        entries.append(f"{key} {' '.join(phones)}")
        text.append(key)
    return "".join(text), entries


@contextmanager
def contextual_lexicon(path, text, pronunciation, key_base=0xE000):
    if not pronunciation:
        yield str(path), text
        return
    if "".join(row["zh"] for row in pronunciation) != text:
        raise ValueError("Pronunciation does not match the spoken text")
    original = Path(path).read_text(encoding="utf-8")
    lexicon = {parts[0]: parts[1:] for line in original.splitlines()
               if (parts := line.split())}
    spoken, entries = contextual_entries(pronunciation, lexicon, key_base)
    if key_base != 0xE000:
        # Kokoro's Chinese frontend skips private-use characters. Use Hanzi
        # keys and remove any original words containing those temporary keys
        # so its phrase matcher cannot override the contextual phones.
        keys = {entry.split()[0] for entry in entries}
        original = "\n".join(line for line in original.splitlines()
                             if not keys.intersection(line.split()[0]))
    with tempfile.TemporaryDirectory(prefix="lotus-pronunciation-") as directory:
        target = Path(directory) / "lexicon.txt"
        target.write_text(original + "\n" + "\n".join(entries) + "\n", encoding="utf-8")
        yield str(target), spoken
