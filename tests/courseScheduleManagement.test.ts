import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act, useState } from 'react';
import { JSDOM } from 'jsdom';
import { buildCourseDevelopmentTimeline, Category1CourseDev } from '../src/components/Category1_CourseDev';
import { CourseManagementControls } from '../src/components/CourseManagementControls';
import { prepareCourseSchedule } from '../src/utils/courseScheduleManagement';
import { recalculateCourse } from '../src/utils/forwardSchedule';
import { OFFICIAL_TERM_PLANNING, fscjCalendar } from '../src/utils/termPlanning';
import { inclusiveDue, offsetWorkdays } from '../src/utils/fscjCalendar';
import type { CourseDevelopment } from '../src/types';
const settings={...structuredClone(OFFICIAL_TERM_PLANNING),multimediaWorkdays:5};
const calendar=fscjCalendar(settings);
const source=(onboarding=true,id='one'):CourseDevelopment=>({id,courseNumber:id==='one'?'ABC1234':'DEF1234',courseTitle:'Course',program:'Test',canvasVersion:'v1',workshopCourse:'',devType:'Original',versionNumber:1,termRelease:'Summer Term',targetTermYear:2027,termDeadline:'2027-05-10',devStagger:0,onboarding,deptTeam:{} as any,celTeam:{} as any,hideCompletedTasks:false,alertStatus:'No Concerns',scheduleVersion:1,projectStartDate:'2026-10-05',tasks:buildCourseDevelopmentTimeline('2027-03-26',onboarding)});
const course=(onboarding=true,id='one')=>recalculateCourse(source(onboarding,id),settings);
const task=(c:CourseDevelopment,id:number)=>c.tasks.find(t=>Number(t.id)===id)!;
function adopted(){const original=source();delete original.scheduleVersion;delete original.projectStartDate;const snapshot=structuredClone(original.tasks);return recalculateCourse({...original,projectStartDate:'2026-10-05',legacyScheduleSnapshot:snapshot,tasks:original.tasks.map(t=>({...t,manualStartDate:t.startDate||null,manualDueDate:t.dueDate||null,subtasks:t.subtasks?.map(s=>({...s,manualStartDate:s.startDate||null,manualDueDate:s.dueDate||null}))}))},settings);}

test('new project start updates onboarding root and all downstream projections without mutating saved input',()=>{
 const original=course(),before=JSON.stringify(original);
 const next=prepareCourseSchedule(original,'2026-11-09',settings);
 assert.equal(next.id,original.id);assert.equal(next.projectStartDate,'2026-11-09');assert.equal(task(next,2).startDate,'2026-11-09');
 assert.equal(task(next,4).startDate,offsetWorkdays('2026-11-09',5,calendar));
 assert.notEqual(task(next,11).startDate,task(original,11).startDate);
 assert.notEqual(task(next,13).subtasks![0].dueDate,task(original,13).subtasks![0].dueDate);
 assert.equal(next.calculatedDeadline,task(next,39).dueDate);assert.notEqual(next.calculatedDeadline,original.calculatedDeadline);
 assert.equal(JSON.stringify(original),before);
});
test('no onboarding starts Task 5 and respects holiday and weekend exclusions',()=>{
 const next=prepareCourseSchedule(course(false),'2026-11-10',settings);
 assert.equal(task(next,5).startDate,'2026-11-10');assert.equal(task(next,2).status,'Not Applicable');
 assert.equal(task(next,6).startDate,'2026-11-18');
 assert.equal(task(next,13).subtasks![0].dueDate,inclusiveDue(task(next,11).startDate!,5,calendar));
});
test('Task 1 remains independent and all notes, materials, owners, progress and source records survive',()=>{
 const original=course();Object.assign(task(original,1),{startDate:'2025-01-01',dueDate:'2025-02-01',notes:'Independent',manualStartDate:'2025-01-01'});
 original.instructionalMaterials='OER';original.courseNotes='Keep';task(original,13).subtasks![0].details='Preserve module notes';
 task(original,14).subtasks![1].complete=true;
 const before=JSON.stringify(original),next=prepareCourseSchedule(original,'2026-10-26',settings);
 assert.deepEqual(task(next,1),task(original,1));assert.equal(next.instructionalMaterials,'OER');assert.equal(next.courseNotes,'Keep');
 assert.equal(task(next,13).subtasks![0].details,'Preserve module notes');assert(task(next,14).subtasks![1].complete);
 assert.deepEqual(task(next,13).subtasks![0].sourceTask,task(original,13).subtasks![0].sourceTask);
 assert.equal(JSON.stringify(original),before);
});
test('manual meetings and module dates persist with conflicts instead of being silently discarded',()=>{
 const original=course();Object.assign(task(original,37),{manualStartDate:'2026-11-02',manualDueDate:'2026-11-02',isManualOverride:true});
 const sub=task(original,25).subtasks![0];sub.manualDueDate='2027-04-01';
 const next=prepareCourseSchedule(original,'2026-11-09',settings);
 assert.equal(task(next,37).startDate,'2026-11-02');assert.equal(task(next,25).subtasks![0].dueDate,'2027-04-01');
 assert(next.schedulingWarnings!.some(w=>w.includes('final-readiness')));assert(next.schedulingWarnings!.some(w=>w.includes('dependency')));
});
test('repairs snapshot-derived bulk pins once, while keeping changed, flagged and completed dates',()=>{
 const original=adopted();const compensation=structuredClone(task(original,1));
 task(original,11).manualStartDate='2026-12-07';task(original,11).manualDueDate='2026-12-07';
 task(original,21).isManualOverride=true;const midpoint=task(original,21).manualStartDate;
 task(original,6).status='Complete';const initial=task(original,6).startDate;
 const child=task(original,14).subtasks![0];child.complete=true;const reviewed=child.dueDate;
 const next=prepareCourseSchedule(original,'2026-11-09',settings);
 assert.equal(task(next,2).startDate,'2026-11-09');assert.equal(task(next,2).manualStartDate,null);
 assert.equal(task(next,11).startDate,'2026-12-07');assert.equal(task(next,21).startDate,midpoint);
 assert.equal(task(next,6).startDate,initial);assert.equal(task(next,14).subtasks![0].dueDate,reviewed);
 assert.deepEqual(task(next,1),compensation);assert.deepEqual(next.legacyScheduleSnapshot,original.legacyScheduleSnapshot);
 assert.equal(next.scheduleOverrideVersion,1);
 // Subsequent deliberate overrides matching the old snapshot are never released again.
 task(next,4).manualStartDate=original.legacyScheduleSnapshot!.find(t=>Number(t.id)===4)!.startDate;
 const again=prepareCourseSchedule(next,'2026-11-16',settings);
 assert.equal(task(again,4).manualStartDate,task(next,4).manualStartDate);
});
test('original explicit overrides present before adoption are retained',()=>{
 const original=adopted();const snapshot=original.legacyScheduleSnapshot!.find(t=>Number(t.id)===4)!;
 snapshot.manualStartDate=snapshot.startDate;
 const next=prepareCourseSchedule(original,'2026-11-09',settings);
 assert.equal(task(next,4).manualStartDate,snapshot.manualStartDate);
});
test('first explicit legacy recalculation keeps a snapshot without pinning all projected dates',()=>{
 const legacy=source();delete legacy.scheduleVersion;delete legacy.projectStartDate;
 const before=JSON.stringify(legacy);const next=prepareCourseSchedule(legacy,'2026-11-09',settings);
 assert.equal(task(next,2).startDate,'2026-11-09');assert(!task(next,2).manualStartDate);
 assert.deepEqual(next.legacyScheduleSnapshot,legacy.tasks);assert.equal(JSON.stringify(legacy),before);
});
test('legacy completed module dates survive structural migration before forward scheduling',()=>{
 const legacy=source();delete legacy.scheduleVersion;
 const child=task(legacy,13).subtasks![1];child.complete=true;child.startDate='2026-08-03';child.dueDate='2026-08-07';
 const next=prepareCourseSchedule(legacy,'2026-11-09',settings);
 const preserved=task(next,13).subtasks!.find(s=>s.id===child.id)!;
 assert.equal(preserved.startDate,'2026-08-03');assert.equal(preserved.dueDate,'2026-08-07');assert(preserved.complete);
});
test('invalid or missing dates fail before persistence and produce an actionable error',()=>{
 for(const date of ['', 'not-a-date','2026-02-30','2026-2-3'])assert.throws(()=>prepareCourseSchedule(course(),date,settings),/valid Project Start Date/);
 assert.throws(()=>prepareCourseSchedule({...course(),id:undefined},'2026-11-09',settings),/saved course/);
});
test('late completion and unknown institutional deadlines produce warnings without rejecting the saved schedule',()=>{
 const late=prepareCourseSchedule(course(),'2027-04-01',settings);
 assert(late.calculatedDeadline!>'2027-03-26');assert(late.schedulingWarnings!.some(w=>w.includes('[deadline]')));
 const unknown=prepareCourseSchedule({...course(),targetTermYear:2029},'2026-11-09',settings);
 assert(unknown.schedulingWarnings!.some(w=>w.includes('Session A start date requires confirmation')));
});
test('removing the per-course estimate field leaves shared, saved and provisional multimedia dependencies intact',()=>{
 const saved=course();saved.multimediaWorkdays=40;
 const next=prepareCourseSchedule(saved,'2026-10-26',settings);
 assert.equal(next.multimediaWorkdays,40);
 const multimedia=task(next,24).subtasks!.find(s=>s.id==='multimedia-module-7')!;
 assert.equal(multimedia.dueDate,inclusiveDue(multimedia.startDate!,40,calendar));assert(task(next,37).startDate!>=multimedia.dueDate!);
 const shared=prepareCourseSchedule(source(),'2026-10-26',settings);assert.equal(task(shared,15).subtasks![0].durationDays,5);
 const provisional=prepareCourseSchedule(source(),'2026-10-26',{...settings,multimediaWorkdays:undefined});
 assert(provisional.schedulingWarnings!.some(w=>w.includes('[estimate]')));assert(Number.isFinite(task(provisional,15).subtasks![0].durationDays));
 assert(task(provisional,37).startDate!>=task(provisional,24).dueDate!);
});

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const input=(container:HTMLElement)=>container.querySelector<HTMLInputElement>('input[aria-label="Project Start Date"]')!;
async function changeDate(element:HTMLInputElement,date:string){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(element,date);element.dispatchEvent(new dom.window.Event('input',{bubbles:true}));element.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});}
async function submit(container:HTMLElement){await act(async()=>{container.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});}
async function mount(initial:CourseDevelopment=course(),options:{reject?:boolean;defer?:boolean}={}){
 const container=document.createElement('div');document.body.appendChild(container);let persisted=structuredClone(initial),saveCount=0,release=()=>{};
 const gate=options.defer?new Promise<void>(resolve=>{release=resolve;}):Promise.resolve();
 function Harness(){const [record,setRecord]=useState(initial);return React.createElement(CourseManagementControls,{course:record,settings,customBlocked:[],onSave:async(next:CourseDevelopment)=>{saveCount++;await gate;if(options.reject)throw new Error('Connection failed.');persisted=JSON.parse(JSON.stringify(next));setRecord(persisted);},onEdit:()=>{},onArchive:()=>{},onToggleArchived:()=>{},showArchived:false,activeCount:2,archivedCount:1});}
 const root=createRoot(container);await act(async()=>root.render(React.createElement(Harness)));
 return{container,get persisted(){return persisted;},get saveCount(){return saveCount;},release,async close(){await act(async()=>root.unmount());container.remove();}};
}
test('DOM: Project Start is a draft until Save & Recalculate, persists after remount, and removes the numeric estimate',async()=>{
 const view=await mount();let saved:CourseDevelopment;
 try{
  assert(!view.container.textContent!.includes('Multimedia estimate (workdays per module)'));assert(!view.container.querySelector('input[type="number"]'));
  assert(view.container.textContent!.includes('Save & Recalculate Schedule'));assert(view.container.textContent!.includes('Schedule Warnings'));
  await changeDate(input(view.container),'2026-11-09');assert.equal(view.saveCount,0);assert.equal(view.persisted.projectStartDate,'2026-10-05');
  await submit(view.container);assert.equal(view.saveCount,1);assert.equal(view.persisted.projectStartDate,'2026-11-09');
  assert.equal(input(view.container).value,'2026-11-09');assert(view.container.querySelector('[role="status"]')!.textContent!.includes('Schedule updated'));
  assert.equal(task(view.persisted,2).startDate,'2026-11-09');saved=view.persisted;
 }finally{await view.close();}
 const reloaded=await mount(saved!);try{assert.equal(input(reloaded.container).value,'2026-11-09');}finally{await reloaded.close();}
});
test('DOM: failures retain the draft, show an actionable error, and never report saved success',async()=>{
 const view=await mount(course(),{reject:true});try{await changeDate(input(view.container),'2026-11-09');await submit(view.container);
 assert.equal(view.persisted.projectStartDate,'2026-10-05');assert.equal(input(view.container).value,'2026-11-09');
 assert(view.container.querySelector('[role="alert"]')!.textContent!.includes('Connection failed'));assert(!view.container.querySelector('[role="status"]')!.textContent!.includes('Schedule updated'));
 }finally{await view.close();}
});
test('DOM: empty start is validated without calling save and duplicate submissions are ignored',async()=>{
 const invalid=await mount();try{await changeDate(input(invalid.container),'');await submit(invalid.container);assert.equal(invalid.saveCount,0);assert(invalid.container.querySelector('[role="alert"]'));}finally{await invalid.close();}
 const pending=await mount(course(),{defer:true});try{await changeDate(input(pending.container),'2026-11-09');await submit(pending.container);await submit(pending.container);assert.equal(pending.saveCount,1);assert(input(pending.container).disabled);assert(!pending.container.textContent!.includes('Schedule updated'));await act(async()=>{pending.release();});assert(pending.container.textContent!.includes('Schedule updated'));}finally{await pending.close();}
});
test('DOM: warning schedules remain saved and show the new completion and warnings immediately',async()=>{
 const view=await mount();try{await changeDate(input(view.container),'2027-04-01');await submit(view.container);
 assert.equal(view.persisted.projectStartDate,'2027-04-01');assert(view.persisted.calculatedDeadline!>'2027-03-26');assert(view.container.textContent!.includes('deadline'));assert(view.container.textContent!.includes('Review the scheduling warnings'));
 }finally{await view.close();}
});
test('DOM: full course management updates the selected course only and switching courses resets drafts',async()=>{
 const first=course(),second=course(false,'two');const originalFirst=JSON.stringify(first);let saved=[first,second],updatedId='';
 localStorage.clear();window.prompt=()=>{throw new Error('Recalculation must not open a separate prompt.');};
 const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
 function Harness(){const [records,setRecords]=useState(saved);return React.createElement(Category1CourseDev,{courseDevelopments:records,termPlanning:settings,customBlocked:[],onAddCourse:async()=>{},onDeleteCourse:async()=>{},onUpdateCourse:async(next:CourseDevelopment)=>{updatedId=next.id!;saved=records.map(record=>record.id===next.id?JSON.parse(JSON.stringify(next)):record);setRecords(saved);}});}
 try{
  await act(async()=>root.render(React.createElement(Harness)));
  await changeDate(input(container),'2026-11-09');
  const secondButton=container.querySelector<HTMLButtonElement>('button[title="DEF1234: Course"]')!;await act(async()=>secondButton.click());
  assert.equal(input(container).value,'2026-10-05');
  await changeDate(input(container),'2026-11-10');
  const form=input(container).closest('form')!;await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(updatedId,'two');assert.equal(saved[1].projectStartDate,'2026-11-10');assert.equal(task(saved[1],5).startDate,'2026-11-10');assert.equal(JSON.stringify(saved[0]),originalFirst);
  const completion = saved[1].calculatedDeadline!;
  const dateParts=completion.split('-');
  assert(container.textContent!.includes(`${dateParts[1]}/${dateParts[2]}/${dateParts[0].slice(-2)}`));
 }finally{await act(async()=>root.unmount());container.remove();localStorage.clear();}
});
