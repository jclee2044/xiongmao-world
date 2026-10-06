"""One bounded local transcription; audio arrives on stdin and is never saved."""
import io, json, sys
from pathlib import Path
from faster_whisper import WhisperModel
raw = sys.stdin.buffer.read(2_000_001)
if len(raw) > 2_000_000:
    raise ValueError('Recording too large')
model = WhisperModel(str(Path(__file__).resolve().parents[1] / 'tools/whisper-base'), device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
segments, info = model.transcribe(io.BytesIO(raw), language='zh', beam_size=3, vad_filter=True, condition_on_previous_text=False)
parts=[]
for segment in segments:
    if segment.end > 22: raise ValueError('Recording too long')
    if segment.no_speech_prob < .65: parts.append(segment.text)
print(json.dumps({'text': ''.join(parts)[:300]}, ensure_ascii=False))
