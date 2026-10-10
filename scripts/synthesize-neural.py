"""Offline Mandarin TTS. JSON on stdin, PCM WAV on stdout."""
import io, json, subprocess, sys, wave
from pathlib import Path
import numpy as np
import sherpa_onnx
from pronunciation_lexicon import contextual_lexicon
r=json.load(sys.stdin)
aishell=r.get('model') == 'aishell3'
kokoro=r.get('model') == 'kokoro'
root=Path(__file__).resolve().parents[1]/'tools'/('kokoro-multi-lang-v1_1' if kokoro else 'vits-icefall-zh-aishell3' if aishell else 'vits-zh-hf-fanchen-wnj')
model='model.onnx' if aishell else 'vits-zh-hf-fanchen-wnj.onnx'
with contextual_lexicon(root/('lexicon-zh.txt' if kokoro else 'lexicon.txt'), r['text'], r.get('pronunciation'), key_base=0x9F00 if kokoro else 0xE000) as (lexicon, spoken):
 if kokoro:
  model_config=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=str(root/'model.onnx'),voices=str(root/'voices.bin'),tokens=str(root/'tokens.txt'),data_dir=str(root/'espeak-ng-data'),lexicon=lexicon),num_threads=3,debug=False)
 else:
  model_config=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(root/model),lexicon=lexicon,tokens=str(root/'tokens.txt')),num_threads=2,debug=False)
 config=sherpa_onnx.OfflineTtsConfig(model=model_config,max_num_sentences=1)
 tts=sherpa_onnx.OfflineTts(config)
 # Speaker IDs are selected by the server from the shared voice profile allowlist.
 audio=tts.generate(spoken,sid=r.get('sid', 0),speed=.8 if r.get('slow') and not r.get('effect') else 1.0)
samples=np.asarray(audio.samples)
# Trim only trailing silence, preserve final syllables, then fade the final 12ms.
active=np.flatnonzero(np.abs(samples)>.007)
if len(active): samples=samples[:min(len(samples),active[-1]+int(audio.sample_rate*.13))]
n=min(len(samples),int(audio.sample_rate*.012))
if n:samples[-n:]*=np.linspace(1,0,n)
# Raise quiet character speech, with extra gain for the younger voices.
# Reduce gain for unusually loud phrases so peaks retain headroom without clipping.
peak=float(np.max(np.abs(samples))) if len(samples) else 0
gain=r.get('gain', 1.0)
if peak: samples*=min(gain, .95/peak)
b=io.BytesIO()
with wave.open(b,'wb') as f:
 f.setnchannels(1);f.setsampwidth(2);f.setframerate(audio.sample_rate);f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
output=b.getvalue()
if r.get('effect') == 'panda-light-v1':
 # Exactly audition A, with pitch-preserving slow playback after the voice effect.
 filters='rubberband=pitch=1.155:tempo=1.02,equalizer=f=1250:t=q:w=1.2:g=4,equalizer=f=280:t=q:w=1:g=-2,alimiter=limit=0.92'
 if r.get('slow'): filters+=',atempo=0.8'
 output=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i','pipe:0','-af',filters,'-f','wav','pipe:1'],input=output,stdout=subprocess.PIPE,check=True,timeout=10).stdout
sys.stdout.buffer.write(output)
