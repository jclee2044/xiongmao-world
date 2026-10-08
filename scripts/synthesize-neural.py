"""Offline Mandarin TTS. JSON on stdin, PCM WAV on stdout."""
import io, json, sys, wave
from pathlib import Path
import numpy as np
import sherpa_onnx
r=json.load(sys.stdin)
aishell=r.get('model') == 'aishell3'
root=Path(__file__).resolve().parents[1]/'tools'/('vits-icefall-zh-aishell3' if aishell else 'vits-zh-hf-fanchen-wnj')
model='model.onnx' if aishell else 'vits-zh-hf-fanchen-wnj.onnx'
config=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(root/model),lexicon=str(root/'lexicon.txt'),tokens=str(root/'tokens.txt')),num_threads=2,debug=False),max_num_sentences=1)
tts=sherpa_onnx.OfflineTts(config)
# Speaker IDs are selected by the server from the shared voice profile allowlist.
audio=tts.generate(r['text'],sid=r.get('sid', 0),speed=.8 if r.get('slow') else 1.0)
samples=np.asarray(audio.samples)
# Trim only trailing silence, preserve final syllables, then fade the final 12ms.
active=np.flatnonzero(np.abs(samples)>.007)
if len(active): samples=samples[:min(len(samples),active[-1]+int(audio.sample_rate*.13))]
n=min(len(samples),int(audio.sample_rate*.012))
if n:samples[-n:]*=np.linspace(1,0,n)
b=io.BytesIO()
with wave.open(b,'wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(audio.sample_rate);f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
sys.stdout.buffer.write(b.getvalue())
