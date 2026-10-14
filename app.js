const MODULES=[
{name:"商业与赚钱",icon:"💰"}, {name:"销售与获客",icon:"🎯"}, {name:"表达与沟通",icon:"🗣️"}, {name:"广告与增长",icon:"📈"},
{name:"AI与自动化",icon:"🤖"}, {name:"产品与一人公司",icon:"🧩"}, {name:"财务与投资基础",icon:"📊"}, {name:"团队与组织管理",icon:"👥"}
];
const KEY="laohou-training-final-v6";
const emptyState=()=>({answers:{},attempts:0,correct:0,dates:{},completedLessons:[],caseAnswers:{},checks:{},legacy:null,rotation:[],recent:[]});
function loadState(){
 let s;
 try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
 if(s&&s.answers&&typeof s.answers==="object")return {...emptyState(),...s};
 const next=emptyState();
 try{let old=JSON.parse(localStorage.getItem("laohouQuizState")||'null');if(old){next.legacy={attempts:Number(old.total)||0,correct:Number(old.correct)||0};(old.wrong||[]).forEach(id=>{if(QUESTION_BANK.some(q=>q.id===id))next.answers[id]={lastCorrect:false,streak:0,due:new Date().toISOString(),last:new Date().toISOString(),count:1}})}}catch(e){}
 return next;
}
let state=loadState(),view="home",quiz=[],qi=0,session={},lessonId=1;
const el=id=>document.getElementById(id);
const today=()=>new Date().toLocaleDateString("en-CA");
const now=()=>new Date().toISOString();
const safe=(s)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){alert("浏览器存储空间不可用，请及时导出备份。")}renderStats()}
function dueDate(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString()}
function isDue(r){return !!r&&!!r.due&&new Date(r.due).getTime()<=Date.now()}
function wrongQuestions(){return QUESTION_BANK.filter(q=>state.answers[q.id]&&!state.answers[q.id].lastCorrect)}
function dueQuestions(){return QUESTION_BANK.filter(q=>isDue(state.answers[q.id]))}
function moduleStats(name){const a=QUESTION_BANK.filter(q=>q.module===name);const known=a.filter(q=>(state.answers[q.id]?.streak||0)>=2).length;return {count:a.length,known,percent:a.length?Math.round(known/a.length*100):0}}
function renderStats(){
 const a=Object.values(state.answers);const total=state.attempts+(state.legacy?.attempts||0),correct=state.correct+(state.legacy?.correct||0);
 el("statToday").textContent=state.dates[today()]||0;
 el("statAccuracy").textContent=total?Math.round(correct/total*100)+"%":"—";
 el("statDue").textContent=dueQuestions().length;
 const known=a.filter(x=>x.streak>=2).length;el("statMastery").textContent=Math.round(known/QUESTION_BANK.length*100)+"%";
}
function init(){
 const names=[["home","首页"],["courses","课程"],["bank","题库"],["cases","实战"],["review","复习"],["management","管理"],["progress","学习数据"]];
 el("nav").innerHTML=names.map(([id,t])=>`<button data-nav="${id}" onclick="showView('${id}')">${t}</button>`).join("");
 const options='<option value="">全部模块</option>'+MODULES.map(m=>`<option>${m.name}</option>`).join("");
 el("courseFilter").innerHTML=options;el("bankModule").innerHTML=options;
 el("homeModules").innerHTML=MODULES.map(m=>{const st=moduleStats(m.name);return `<button class="card module" onclick="openModule('${m.name}')"><span class="emoji">${m.icon}</span><h3>${m.name}</h3><small>${st.count}题 · 已掌握 ${st.known}</small><div class="bar"><div class="fill" style="width:${st.percent}%"></div></div></button>`}).join("");
 el("caseSelect").innerHTML=CASES.map((c,i)=>`<option value="${i}">${i+1}. ${c.category} · ${c.q.slice(0,17)}…</option>`).join("");
 renderManagement();renderStats();showView("home");
}
function showView(id){view=id;document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));if(id==="courses")renderCourses();if(id==="bank")renderBank();if(id==="cases")renderCase();if(id==="review")renderReview();if(id==="progress")renderProgress();if(id==="management")renderManagement();if(id==="home"){initHome();renderStats()}window.scrollTo({top:0,behavior:"instant"})}
function initHome(){el("homeModules").innerHTML=MODULES.map(m=>{const st=moduleStats(m.name);return `<button class="card module" onclick="openModule('${m.name}')"><span class="emoji">${m.icon}</span><h3>${m.name}</h3><small>${st.count}题 · 已掌握 ${st.known}</small><div class="bar"><div class="fill" style="width:${st.percent}%"></div></div></button>`}).join("")}
function openModule(m){el("bankModule").value=m;showView("bank")}
function renderCourses(){
 const m=el("courseFilter").value,k=el("courseSearch").value.trim().toLowerCase();
 const list=COURSES.filter(c=>(!m||c.module===m)&&(!k||(c.title+c.content+c.module).toLowerCase().includes(k)));
 el("courseList").innerHTML=list.length?list.map(c=>`<div class="card lesson"><div><span class="tag">${c.module}</span><h3>${safe(c.title)}</h3><p>${safe(c.content.slice(0,62))}…</p></div><button class="btn ${state.completedLessons.includes(c.id)?"light":""}" onclick="openLesson(${c.id})">${state.completedLessons.includes(c.id)?"已学习 · 复习":"开始学习"}</button></div>`).join(""):'<div class="card empty">没有找到相关课程</div>';
}
function openLesson(id){lessonId=id;const c=COURSES.find(c=>c.id===id);el("lessonTag").textContent=c.module;el("lessonTitle").textContent=c.title;el("lessonContent").textContent=c.content;el("lessonTask").textContent=c.task;el("lessonDone").textContent=state.completedLessons.includes(id)?"已完成 ✓":"标记已学完";showView("lesson")}
function finishLesson(){if(!state.completedLessons.includes(lessonId))state.completedLessons.push(lessonId);persist();el("lessonDone").textContent="已完成 ✓"}
function filteredQuestions(){let m=el("bankModule").value,l=el("bankLevel").value,k=el("bankSearch").value.trim().toLowerCase();return QUESTION_BANK.filter(q=>(!m||q.module===m)&&(!l||q.level===l)&&(!k||(q.q+q.explain).toLowerCase().includes(k)))}
function renderBank(){const list=filteredQuestions();el("bankTitle").textContent=el("bankModule").value||"全部知识题库";el("bankCount").textContent=`符合条件 ${list.length} 题，包含基础理解和应用判断。`;el("bankPreview").innerHTML=list.slice(0,8).map(q=>`<div class="card" style="padding:16px"><span class="tag">${q.module} · ${q.level}</span><div>${safe(q.q)}</div></div>`).join("")}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// 普通训练采用全局轮换队列：先出未展示过的题，全部展示后才开启下一轮。
// 复习/错题属于明确选择的训练，不影响普通题库轮换。
function rotatingPick(pool,count){
 const unique=[...new Map(pool.map(q=>[q.id,q])).values()];
 const seen=new Set(state.rotation||[]),recent=new Set((state.recent||[]).slice(-20));
 let fresh=shuffle(unique.filter(q=>!seen.has(q.id)));
 let selected=fresh.slice(0,count);
 if(selected.length<count){
   // 当前范围已轮换完毕时，优先选择最近未出现的题。
   const picked=new Set(selected.map(q=>q.id));
   const old=unique.filter(q=>!picked.has(q.id));
   const ordered=[...shuffle(old.filter(q=>!recent.has(q.id))),...shuffle(old.filter(q=>recent.has(q.id)))];
   selected.push(...ordered.slice(0,count-selected.length));
 }
 // 全局题库完整轮换后重新开始，保留最近记录用于避免跨轮紧邻重复。
 const globalIds=new Set(QUESTION_BANK.map(q=>q.id));
 const updated=new Set([...(state.rotation||[]).filter(id=>globalIds.has(id)),...selected.map(q=>q.id)]);
 state.rotation=updated.size>=globalIds.size?selected.map(q=>q.id):[...updated];
 state.recent=[...(state.recent||[]),...selected.map(q=>q.id)].slice(-40);
 persist();
 return selected;
}
function startQuiz(mode){
 let list=[];
 if(mode==="daily")list=rotatingPick(QUESTION_BANK,10);
 if(mode==="random")list=rotatingPick(filteredQuestions(),10);
 if(mode==="filtered")list=rotatingPick(filteredQuestions(),Math.min(10,filteredQuestions().length));
 if(mode==="lesson")list=rotatingPick(QUESTION_BANK.filter(q=>q.module===COURSES.find(c=>c.id===lessonId).module),10);
 if(mode==="due")list=shuffle(dueQuestions());
 if(mode==="wrong")list=shuffle(wrongQuestions());
 if(mode==="management")list=rotatingPick(QUESTION_BANK.filter(q=>q.module==="团队与组织管理"),10);
 if(!list.length){alert(mode==="due"?"目前没有到期的复习题。":mode==="wrong"?"当前没有错题。":"没有符合条件的题目。");return}
 quiz=list;qi=0;session={};showView("quiz");renderQuiz();
}
function renderQuiz(){
 const q=quiz[qi],ans=session[q.id];
 el("quizProgress").textContent=`${qi+1} / ${quiz.length}`;el("quizTag").textContent=q.module+" · "+q.level;el("quizQuestion").textContent=q.q;
 el("quizOptions").innerHTML=q.options.map((o,i)=>{let cls="opt";if(ans!==undefined){if(i===q.answer)cls+=" correct";else if(i===ans)cls+=" wrong"}return `<button class="${cls}" ${ans!==undefined?"disabled":""} onclick="answerQuestion(${i})">${"ABCD"[i]}. ${safe(o)}</button>`}).join("");
 el("quizExplain").classList.toggle("hidden",ans===undefined);
 if(ans!==undefined)el("quizExplain").textContent=(ans===q.answer?"回答正确。":"正确答案："+("ABCD"[q.answer])+"。")+q.explain;
 el("quizPrev").disabled=qi===0;el("quizNext").textContent=qi===quiz.length-1?"完成训练":"下一题";
}
function answerQuestion(choice){
 const q=quiz[qi];if(session[q.id]!==undefined)return;session[q.id]=choice;
 const ok=choice===q.answer,old=state.answers[q.id]||{streak:0,count:0};
 const streak=ok?(old.streak||0)+1:0;
 state.answers[q.id]={lastCorrect:ok,streak,count:(old.count||0)+1,last:now(),due:dueDate(ok?[1,3,7,14][Math.min(streak-1,3)]:1)};
 state.attempts++;if(ok)state.correct++;state.dates[today()]=(state.dates[today()]||0)+1;
 persist();renderQuiz();
}
function quizPrev(){if(qi>0){qi--;renderQuiz()}}
function quizNext(){if(qi<quiz.length-1){qi++;renderQuiz();return}const done=Object.keys(session).length,correct=quiz.filter(q=>session[q.id]===q.answer).length;el("resultScore").textContent=done?Math.round(correct/done*100)+"%":"未作答";el("resultText").textContent=`本轮共 ${quiz.length} 题，已作答 ${done} 题，答对 ${correct} 题。未作答题目不计入正确率。`;showView("quizResult")}
function renderCase(){const c=CASES[Number(el("caseSelect").value)||0];el("caseCategory").textContent=c.category;el("caseQuestion").textContent=c.q;el("caseAnswer").value=state.caseAnswers[c.id]||"";el("caseGuide").classList.add("hidden");el("caseGuide").textContent="参考框架："+c.guide}
function saveCaseDraft(){const c=CASES[Number(el("caseSelect").value)||0];state.caseAnswers[c.id]=el("caseAnswer").value;persist()}
function revealCase(){el("caseGuide").classList.remove("hidden")}
function nextCase(){el("caseSelect").value=(Number(el("caseSelect").value)+1)%CASES.length;renderCase()}
function renderReview(){
 const due=dueQuestions(),wrong=wrongQuestions();el("reviewHeadline").textContent=`${due.length} 道到期复习 · ${wrong.length} 道当前错题`;
 const list=QUESTION_BANK.filter(q=>state.answers[q.id]).sort((a,b)=>new Date(state.answers[a.id].due)-new Date(state.answers[b.id].due)).slice(0,15);
 el("reviewList").innerHTML=list.length?list.map(q=>{const a=state.answers[q.id];return `<div class="card" style="padding:17px"><div class="inline"><span class="tag">${q.module}</span><small class="muted">${isDue(a)?"已到期":"下次："+new Date(a.due).toLocaleDateString("zh-CN")}</small></div><div>${safe(q.q)}</div><small class="muted">${a.lastCorrect?"上次答对":"上次答错"} · 连续答对 ${a.streak} 次</small></div>`}).join(""):'<div class="card empty">还没有复习记录。先做一轮题吧。</div>';
}
const checkItems=["本周目标与完成率是否清晰？","是否找到了前三个关键业务瓶颈？","是否对需要帮助的成员进行了一对一沟通？","是否明确跨部门协作的责任和期限？","是否更新至少一项可复用的SOP？","下周任务是否明确负责人、截止时间和验收标准？"];
function renderManagement(){el("managementChecks").innerHTML=checkItems.map((t,i)=>`<label class="checkrow"><input type="checkbox" ${state.checks[i]?"checked":""} onchange="toggleCheck(${i},this.checked)"><span>${t}</span></label>`).join("")}
function toggleCheck(i,v){state.checks[i]=v;persist()}
function resetChecks(){if(!confirm("重置本周管理清单？"))return;state.checks={};persist();renderManagement()}
function renderProgress(){
 const total=state.attempts+(state.legacy?.attempts||0),correct=state.correct+(state.legacy?.correct||0),known=Object.values(state.answers).filter(x=>x.streak>=2).length;
 el("progressStats").innerHTML=[["累计答题",total+"次"],["累计正确率",total?Math.round(correct/total*100)+"%":"—"],["已掌握知识点",known+" / "+QUESTION_BANK.length],["完成课程",state.completedLessons.length+" / "+COURSES.length]].map(([k,v])=>`<div class="card stat"><small>${k}</small><b>${v}</b></div>`).join("");
 el("progressModules").innerHTML=MODULES.map(m=>{const st=moduleStats(m.name);return `<div class="card" style="padding:18px"><div class="inline"><b>${m.icon} ${m.name}</b><small class="muted">${st.known}/${st.count} 已掌握</small></div><div class="bar"><div class="fill" style="width:${st.percent}%"></div></div></div>`}).join("");
}
function exportData(){const data={format:"laohou-training-v6",exportedAt:now(),state};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="老侯知识训练场_学习记录_"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importData(e){const f=e.target.files[0];if(!f)return;try{if(f.size>3e6)throw Error("文件过大");const d=JSON.parse(await f.text());if(d.format!=="laohou-training-v6"||!d.state||!d.state.answers||!Array.isArray(d.state.completedLessons)||typeof d.state.attempts!=="number")throw Error("备份格式不正确");if(!confirm("导入将覆盖当前浏览器的学习记录，确定继续？"))return;state={...emptyState(),...d.state};persist();renderProgress();el("dataMessage").textContent="导入成功。"}catch(err){el("dataMessage").textContent="导入失败："+err.message}finally{e.target.value=""}}
function resetAll(){if(!confirm("确认清空当前浏览器的所有学习记录？此操作无法撤销。请先导出备份。"))return;state=emptyState();persist();renderProgress();el("dataMessage").textContent="本机学习数据已清空。"}
init();
