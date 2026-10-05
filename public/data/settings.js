export const defaultSettings={outfit:'#b4a6c3',hair:'bun',pace:'normal',motion:true,pinyin:true,translation:true,challenge:'standard',help:'standard',textSize:'normal',voice:true,voiceVolume:0.75,music:0.15,ambience:0.25};
const options={outfit:['#b4a6c3','#899b7c','#d3a890','#8ca6a2'],hair:['bun','short'],pace:['slow','normal'],motion:[true,false],pinyin:[true,false],translation:[true,false],challenge:['gentler','standard','challenging'],help:['more','standard','less'],textSize:['normal','large'],voice:[true,false]};
export function validatePatch(patch){
  if(!patch||Array.isArray(patch)||typeof patch!=='object'||Object.keys(patch).length===0)throw new Error('Choose a supported change.');
  const result={};
  for(const [key,value]of Object.entries(patch)){
    if(options[key]?.includes(value))result[key]=value;
    else if(['voiceVolume','music','ambience'].includes(key)&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1)result[key]=value;
    else throw new Error(`Unsupported setting: ${key}`);
  }
  return result;
}
export function parseCustomization(text){
  const patch={};
  // This intentionally small parser edits supported appearance/settings only.
  if(/script|javascript|execute|delete|system|file|install|sudo|地图|城市|地图|代码|new (?:city|map|mechanic)|build|add.*(?:city|map|mechanic)/i.test(text))return {patch:null,pending:true};
  if(/lavender|purple|紫/i.test(text))patch.outfit='#b4a6c3';
  else if(/sage|green|绿/i.test(text))patch.outfit='#899b7c';
  else if(/peach|pink|粉/i.test(text))patch.outfit='#d3a890';
  else if(/teal|青/i.test(text))patch.outfit='#8ca6a2';
  if(/short hair|短发/i.test(text))patch.hair='short';else if(/bun|发髻/i.test(text))patch.hair='bun';
  if(/slow|slower|慢/i.test(text))patch.pace='slow';
  if(/more help|更多帮助/i.test(text))patch.help='more';
  if(/less help|更少帮助/i.test(text))patch.help='less';
  if(/gentler|easier|简单/i.test(text))patch.challenge='gentler';
  if(/challenging|harder|更难/i.test(text))patch.challenge='challenging';
  return Object.keys(patch).length?{patch:validatePatch(patch),pending:false}:{patch:null,pending:true};
}
