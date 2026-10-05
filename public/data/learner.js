import {topics} from './content.js';
export function newLearner(){return {exposures:{},evidence:{}};}
const RECENT_CONTEXTS = 192;
export function expose(learner,wordId,context,assisted=false){
  const key=`${wordId}:${context}`;
  const old=learner.exposures[key]||{count:0,assisted:0};
  const exposures={...learner.exposures};
  // Object insertion order keeps the most recently encountered contexts last.
  // Earlier contexts are summarized by word, retaining every exposure count.
  delete exposures[key];
  exposures[key]={count:old.count+1,assisted:old.assisted+Number(assisted)};
  const recent=Object.keys(exposures).filter(k=>!k.endsWith(':earlier'));
  for(const expired of recent.slice(0,Math.max(0,recent.length-RECENT_CONTEXTS))){
    const summaryKey=`${expired.split(':')[0]}:earlier`,summary=exposures[summaryKey]||{count:0,assisted:0},value=exposures[expired];
    exposures[summaryKey]={count:summary.count+value.count,assisted:summary.assisted+value.assisted};
    delete exposures[expired];
  }
  return {...learner,exposures};
}
export function evidence(learner,{skill,topic,correct,assisted=false,recognitionError=false,source='unvalidated',id}){
  // Display, help, timing, English and unverified transcripts do not grade ability.
  if(!['listening','reading','speaking','typing'].includes(skill)||!topics.includes(topic)||recognitionError||assisted||source!=='verified'||typeof correct!=='boolean'||!id)return learner;
  const key=`${skill}:${topic}`,old=learner.evidence[key]||{band:2,samples:[],lastChange:0,count:0};
  if(old.samples.some(s=>s.id===id))return learner;
  const samples=[...old.samples,{id,correct}].slice(-8),count=old.count+1;
  let band=old.band,lastChange=old.lastChange;
  if(samples.length>=4&&count-lastChange>=4){
    const recent=samples.slice(-4),right=recent.filter(s=>s.correct).length;
    if(right>=3&&band<3){band++;lastChange=count;}
    else if(right===0&&band>1){band--;lastChange=count;}
  }
  return {...learner,evidence:{...learner.evidence,[key]:{band,samples,lastChange,count}}};
}
export function challengeFor(learner,skill,topic,override='standard'){
  if(override==='gentler')return 1;if(override==='challenging')return 3;
  return learner.evidence[`${skill}:${topic}`]?.band||2;
}
export function explicitPreference(text){
  if(/我不(?:太)?(?:喜欢|能吃)辣/.test(text))return {key:'spice',value:'prefers mild food'};
  const match=text.match(/我(?:很)?喜欢(?:吃|喝|看|听|打|做)?([\p{Script=Han}]{1,12})/u);
  return match?{key:'shared preference',value:match[0].slice(0,30)}:null;
}
