import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act, useState } from 'react';
import { JSDOM } from 'jsdom';
import type { CourseDevelopment } from '../src/types';
import { CoursePlanningViews } from '../src/components/CoursePlanningViews';
import { proposedPlanningRows, selectProposalStart } from '../src/utils/proposedPlanning';
import { OFFICIAL_TERM_PLANNING, type ProposedCourse, type TermPlanningSettings } from '../src/utils/termPlanning';
import { forwardSchedule } from '../src/utils/forwardSchedule';

const proposal = (id = 'p1', courseNumber = 'ABC1234'): ProposedCourse => ({ id, courseNumber, termRelease: 'Summer Term', targetTermYear: 2027, onboarding: true });
const config = (proposals = [proposal()]): TermPlanningSettings => ({ ...structuredClone(OFFICIAL_TERM_PLANNING), multimediaWorkdays: 5, proposals });
const activeCourse = (date: string): CourseDevelopment => {
  const schedule = forwardSchedule({start:date,onboarding:true,settings:config()});
  return {id:'active',courseNumber:'DEF1234',courseTitle:'Active',onboarding:true,projectStartDate:date,tasks:[{id:12,name:'Create module templates',startDate:schedule.templatePeriod.start,dueDate:schedule.templatePeriod.end,phase:'Development',assignedTo:'Instructional Designer',status:'In Progress'},{id:39,name:'Course completion',dueDate:schedule.completion,phase:'Completion',assignedTo:'Instructional Designer',status:'Not Started'}]} as CourseDevelopment;
};

test('only unconverted proposals are returned, including when converted projects are archived', () => {
  const courses = [{...activeCourse('2026-11-02'),proposalId:'converted-by-project',archived:true}];
  const settings=config([proposal(),{...proposal('converted','GHI1234'),convertedProjectId:'old-project'},proposal('converted-by-project','JKL1234')]);
  const before=JSON.stringify({courses,settings});
  assert.deepEqual(proposedPlanningRows(courses,settings).map(r=>r.id),['p1']);
  assert.equal(JSON.stringify({courses,settings}),before);
});

test('hidden active projects still change feasible suggested dates and generate template conflicts', () => {
  const settings=config();
  const alone=proposedPlanningRows([],settings)[0];
  const active=activeCourse(alone.suggested);
  const before=JSON.stringify(active);
  const planned=proposedPlanningRows([active],settings)[0];
  assert.notEqual(planned.suggested,alone.suggested);
  const accepted=selectProposalStart(settings,'p1',planned.suggested);
  assert(!proposedPlanningRows([active],accepted)[0].warnings.some(w=>w.includes('template preparation overlaps')));
  const overlapping=selectProposalStart(settings,'p1',alone.suggested);
  assert(proposedPlanningRows([active],overlapping)[0].warnings.some(w=>w.includes('DEF1234')&&w.includes('template preparation overlaps')));
  assert.equal(JSON.stringify(active),before);
});

test('selected proposal date persists through JSON reload, recomputes schedule, and preserves all other selected dates', () => {
  const settings=config([proposal(),{...proposal('p2','GHI1234'),projectStartDate:'2026-10-26'}]);
  const before=JSON.stringify(settings);
  const row=proposedPlanningRows([],settings)[0];
  const next=selectProposalStart(settings,row.id,row.suggested);
  assert.equal(next.proposals![1],settings.proposals![1]);
  assert.equal(JSON.stringify(settings),before);
  const reloaded=JSON.parse(JSON.stringify(next));
  const projection=proposedPlanningRows([],reloaded)[0];
  assert.equal(projection.selected,row.suggested);
  assert.equal(projection.completion,forwardSchedule({start:row.suggested,onboarding:true,settings:reloaded}).completion);
  const late=selectProposalStart(reloaded,row.id,'2027-04-01');
  const lateRow=proposedPlanningRows([],late)[0];
  assert.notEqual(lateRow.completion,projection.completion);
  assert(lateRow.warnings.some(w=>w.includes('deadline')));
  assert.equal(late.proposals![1].projectStartDate,'2026-10-26');
});

test('missing, converted and invalid-date selections fail explicitly without changing settings', () => {
  const settings=config([{...proposal(),convertedProjectId:'old'}]);
  const before=JSON.stringify(settings);
  assert.throws(()=>selectProposalStart(settings,'missing','2026-10-26'),/no longer available/);
  assert.throws(()=>selectProposalStart(settings,'p1','2026-10-26'),/no longer available/);
  assert.throws(()=>selectProposalStart(settings,'p1','2026-02-30'),/valid project start/);
  assert.equal(JSON.stringify(settings),before);
});

// Mount real React DOM controls so tests exercise event handlers and state updates.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const { createRoot } = await import('react-dom/client');
async function mount(initial: TermPlanningSettings, courses: CourseDevelopment[] = [], options: {reject?:boolean;defer?:boolean} = {}) {
  const container=document.createElement('div');document.body.appendChild(container);
  let persisted=structuredClone(initial),saveCount=0,created:ProposedCourse|undefined,resolveSave:()=>void=()=>{};
  const gate=options.defer?new Promise<void>(resolve=>{resolveSave=resolve;}):Promise.resolve();
  function Harness(){const [settings,setSettings]=useState(initial);return React.createElement(CoursePlanningViews,{courses,settings,onSave:async next=>{saveCount++;await gate;if(options.reject)throw new Error('Save failed. Please try again.');persisted=JSON.parse(JSON.stringify(next));setSettings(persisted);},onCreateProject:p=>{created=p;}});}
  const root=createRoot(container);await act(async()=>root.render(React.createElement(Harness)));
  return {container,root,get persisted(){return persisted;},get saveCount(){return saveCount;},get created(){return created;},resolveSave,async close(){await act(async()=>root.unmount());container.remove();}};
}
const button=(container:HTMLElement,name:string)=>container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
const selected=(container:HTMLElement,name='ABC1234')=>container.querySelector<HTMLInputElement>(`input[aria-label="${name} selected start"]`)!;
const click=async(element:HTMLElement)=>act(async()=>element.click());

// React's controlled input value tracker requires using the browser's native setter.
async function dateChange(input:HTMLInputElement,date:string){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,date);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});}

test('DOM: table only, proposal-only terms, empty state and working Compare term filter',async()=>{
  const settings=config([proposal(),{...proposal('p2','GHI1234'),termRelease:'Spring Term'}]);
  const view=await mount(settings,[activeCourse('2026-10-26')]);
  try {
    assert(view.container.querySelector('table'));
    assert(!view.container.textContent!.includes('Timeline'));
    assert(!view.container.querySelector('[aria-label="Planning view"]'));
    assert(!view.container.querySelector('tbody')!.textContent!.includes('DEF1234'));
    const filter=view.container.querySelector('select')!;
    await act(async()=>{filter.value='Spring Term 2027';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
    assert(view.container.querySelector('tbody')!.textContent!.includes('GHI1234'));
    assert(!view.container.querySelector('tbody')!.textContent!.includes('ABC1234'));
    await act(async()=>{filter.value='';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
    assert(view.container.querySelector('tbody')!.textContent!.includes('ABC1234'));
  }finally{await view.close();}
  const empty=await mount(config([]),[activeCourse('2026-10-26')]);
  try{assert(empty.container.textContent!.includes('No proposed courses yet. Add a proposed course above'));assert(empty.container.querySelector('form'));}finally{await empty.close();}
});

test('DOM: Accept Suggestion saves only its proposal, shows applied state, survives remount and prefills Create Project',async()=>{
  const settings=config([proposal(),{...proposal('p2','GHI1234'),projectStartDate:'2026-10-26'}]);
  const expected=proposedPlanningRows([],settings)[0].suggested;
  const view=await mount(settings);
  let saved:TermPlanningSettings;
  try {
    const accept=button(view.container,'Accept Suggestion for ABC1234');assert(accept);assert.equal(accept.disabled,false);
    await click(accept);
    assert.equal(view.saveCount,1);
    assert.equal(selected(view.container).value,expected);
    assert.equal(view.persisted.proposals![0].projectStartDate,expected);
    assert.equal(view.persisted.proposals![1].projectStartDate,'2026-10-26');
    assert(button(view.container,'Suggestion Applied for ABC1234').disabled);
    assert(view.container.querySelector('[role="status"]')!.textContent!.includes('selected start saved'));
    const create=Array.from(view.container.querySelectorAll<HTMLButtonElement>('tbody tr:first-child button')).find(b=>b.textContent==='Create Project')!;
    await click(create);assert.equal(view.created!.projectStartDate,expected);assert.equal(view.created!.id,'p1');
    saved=view.persisted;
  }finally{await view.close();}
  const reopened=await mount(saved!);
  try{assert.equal(selected(reopened.container).value,expected);}finally{await reopened.close();}
});

test('DOM: optimistic selection is visible during save, duplicate clicks are ignored, and failures roll back with feedback',async()=>{
  const settings=config([{...proposal(),projectStartDate:'2026-10-26'}]);
  const view=await mount(settings,[],{reject:true,defer:true});
  try {
    const expected=proposedPlanningRows([],settings)[0].suggested;
    const accept=button(view.container,'Accept Suggestion for ABC1234');
    await click(accept);
    assert.equal(selected(view.container).value,expected);
    assert(selected(view.container).disabled);
    assert(view.container.querySelector('[role="status"]')!.textContent!.includes('Saving'));
    await click(accept);assert.equal(view.saveCount,1);
    await act(async()=>{view.resolveSave();});
    assert(view.container.querySelector('[role="alert"]')!.textContent!.includes('Save failed'));
    assert.equal(selected(view.container).value,'2026-10-26');
    assert.equal(view.persisted.proposals![0].projectStartDate,'2026-10-26');
    assert.equal(button(view.container,'Accept Suggestion for ABC1234').disabled,false);
  }finally{await view.close();}
});

test('DOM: manual override remains editable after acceptance and recalculates completion and deadline warnings',async()=>{
  const view=await mount(config());
  try{
    await click(button(view.container,'Accept Suggestion for ABC1234'));
    const oldCompletion=proposedPlanningRows([],view.persisted)[0].completion;
    await dateChange(selected(view.container),'2027-04-01');
    assert.equal(view.saveCount,2);
    assert.equal(selected(view.container).value,'2027-04-01');
    const row=proposedPlanningRows([],view.persisted)[0];
    assert.notEqual(row.completion,oldCompletion);
    assert(view.container.querySelector('tbody')!.textContent!.includes(row.completion));
    assert(view.container.querySelector('tbody')!.textContent!.includes('deadline'));
  }finally{await view.close();}
});

test('DOM: no feasible suggestion disables the action and conversion removes the row',async()=>{
  const settings=config([{...proposal(),targetTermYear:2029}]);
  const view=await mount(settings);
  try{assert.equal(button(view.container,'Accept Suggestion for ABC1234').disabled,true);assert.equal(view.saveCount,0);}finally{await view.close();}
  const converted=await mount(config([{...proposal(),convertedProjectId:'active'}]));
  try{assert.equal(converted.container.querySelectorAll('tbody tr').length,0);}finally{await converted.close();}
});

test('DOM: Add Proposed Course still persists a new course without changing active data',async()=>{
 const active=activeCourse('2026-10-26'),before=JSON.stringify(active);
 const view=await mount(config([]),[active]);
 try{
   const input=view.container.querySelector<HTMLInputElement>('input[aria-label="Proposed course number"]')!;
   await dateChange(input,'JKL1234');
   await act(async()=>{view.container.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
   assert.equal(view.saveCount,1);assert.equal(view.persisted.proposals!.length,1);
   assert.equal(view.persisted.proposals![0].courseNumber,'JKL1234');
   assert(view.container.querySelector('tbody')!.textContent!.includes('JKL1234'));
   assert.equal(JSON.stringify(active),before);
 }finally{await view.close();}
});
