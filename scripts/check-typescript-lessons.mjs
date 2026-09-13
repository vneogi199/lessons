import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { TYPESCRIPT_EXECUTABLE_LESSONS } from "./typescript-review.mjs";

// Requires tsc on PATH; validates the actual generated labs, not a copied fixture.
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("lessons/manifest.json", root), "utf8"));
const scratch = await mkdtemp(join(tmpdir(), "typescript-lessons-"));
const checked = new Set();
// Extra probes keep compact teaching snippets honest without a test framework.
const probes = {
  "0129": `if (catalog.create.method !== "POST") throw new Error("literal changed");`,
  "0139": `const p = move([1, 2]); if (p[0] !== 2 || p[1] !== 3) throw new Error("tuple move");
function negative() {
// @ts-expect-error const assertion preserves readonly literals
routes.projects.method = "POST";
}`,
  "0140": `if (indexById([{id:"x", n:1}, {id:"x", n:2}]).get("x")?.n !== 2) throw new Error("duplicate policy");
if (choose(["north"]) !== "north") throw new Error("selection");
function negative() {
// @ts-expect-error empty tuple cannot promise an element
choose([]);
}`,
  "0142": `const events: ProjectEvents = {onId: value => value.toUpperCase(), onName: value => value.toUpperCase(), onArchived: value => !value};
events.onName("Ada");
const project: Project = {id:"p1", name:"Ada", archived:false};
const selected: boolean = get(project, "archived");
if (selected !== false) throw new Error("lookup");
function negative() {
// @ts-expect-error no unknown event keys
events.onMissing("x");
}`,
  "0144": `type Expect<T extends true> = T;
type ACheck = Expect<[A] extends [string | number] ? ([string | number] extends [A] ? true : false) : false>;
type BCheck = Expect<B extends "other" ? true : false>;
const changedEvent: EventMap<{name:string}> = {nameChanged:"Ada"};
if (changedEvent.nameChanged !== "Ada") throw new Error("event");`,
  "0147": `if (!(animalProducer() instanceof Dog)) throw new Error("producer");
function negative() {
// @ts-expect-error a dog-only callback cannot consume every animal
const unsafe: Consumer<Animal> = (dog: Dog) => dog.bark();
}`,
  "0148": `if (parseUserId("usr_1") !== "usr_1") throw new Error("brand value");
for (const input of [null, 1, "prj_1"]) { let rejected=false; try { parseUserId(input); } catch { rejected=true; } if (!rejected) throw new Error("brand validation"); }
function negative(user: UserId) {
// @ts-expect-error brands are not interchangeable
const project: ProjectId = user;
}`,
  "0150": `if (new ProjectService().create(" Ada ").name !== "Ada") throw new Error("decorator result");`,
  "0151": `for (const value of ["draft", "active", "archived"]) if (parseProjectStatus(value) !== value) throw new Error("status");
for (const value of [null, "toString", "unknown"]) { let rejected=false; try {parseProjectStatus(value);} catch {rejected=true;} if (!rejected) throw new Error("invalid status"); }`
};
probes["0141"] = probes["0140"];
probes["0143"] = probes["0142"];
probes["0145"] = probes["0146"] = probes["0144"];
probes["0149"] = probes["0148"];
try {
  for (const [number, message] of [
    ["0130", "Boundary checks passed"],
    ["0131", "Assignability checks passed"],
    ["0132", "Optional-property checks passed"],
    ["0133", "Composition checks passed"],
    ["0134", "State-machine checks passed"],
    ["0135", "Narrowing checks passed"],
    ["0136", "Guard checks passed"],
    ["0137", "Function-contract checks passed"],
    ["0138", "Object-contract checks passed"],
    ...Object.keys(probes).map(number => [number, "Additional checks passed"]),
    ["0157", "Validation checks passed"],
    ["0158", "Validation checks passed"],
    ["0162", "Type-test checks passed"]
  ]) {
    const lesson = manifest.lessons.find(item => item.number === number);
    assert.ok(lesson, `missing lesson ${number}`);
    const html = await readFile(new URL(lesson.path.replace(/^\.\.\/\.\.\//, ""), root), "utf8");
    const encoded = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code>/)?.[1];
    assert.ok(encoded, `missing lab ${number}`);
    const code = encoded.replace(/&#039;/g, "'").replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    const source = join(scratch, `${number}.ts`);
    await writeFile(source, code + (probes[number] ? "\n" + probes[number] + '\nconsole.log("Additional checks passed");' : ""));
    execFileSync("tsc", ["--strict", "--exactOptionalPropertyTypes", "--noUncheckedIndexedAccess",
      "--target", "ES2022", "--outDir", scratch, source], { stdio: "inherit" });
    const output = execFileSync(process.execPath, [join(scratch, `${number}.js`)], { encoding: "utf8" });
    assert.ok(output.includes(message), `missing success output for ${number}`);
    console.log(`${number}: ${message}`);
    checked.add(number);
  }
  assert.deepEqual(checked, TYPESCRIPT_EXECUTABLE_LESSONS, "documented verification set must match executed labs");
  const designProbes = {
    "0006": `for (const unitPrice of [NaN, Infinity, -1, Number.MAX_VALUE]) { let failed=false; try {orderTotal([{unitPrice,quantity:2}],false);} catch {failed=true;} if(!failed) throw new Error("invalid price or overflow"); }
if(orderTotal([],true)!==0 || orderTotal([{unitPrice:99,quantity:1}],true)!==99 || orderTotal([{unitPrice:100,quantity:1}],false)!==100)throw new Error("discount boundaries");`,
    "0007": `let rejected=false;try {shippingCents("domestic",NaN);}catch {rejected=true;} if(!rejected) throw new Error("NaN weight");`,
    "0008": `let available=1; const inventory:Inventory={async reserveIfAvailable(_id,quantity){if(available<quantity)return false;available-=quantity;return true;}};
const results=await Promise.allSettled([reserveAvailable(inventory,"p",1),reserveAvailable(inventory,"p",1)]);
if(results.filter(r=>r.status==="fulfilled").length!==1 || available!==0) throw new Error("reservation contract");
let invoked=false;let rejected=false;try{await reserveAvailable({async reserveIfAvailable(){invoked=true;return true;}},"p",Number.MAX_SAFE_INTEGER+1);}catch{rejected=true;}if(!rejected||invoked)throw new Error("unsafe quantity reached adapter");`,
    "0009": `if(price({subtotal:100,customer:"member"},[standardPrice,memberDiscount])!==100)throw new Error("rule order");let rejected=false;try{price({subtotal:100,customer:"member"},[]);}catch{rejected=true;}if(!rejected)throw new Error("missing rule");`,
    "0011": `if(composePrice(nonNegative,capAt(80),memberDiscount)(100)!==72)throw new Error("composition order");`,
    "0012": `if(!hasDecisionFields({...decision,evidence:"invented"}))throw new Error("presence is not proof");`,
    "0013": `if(!Object.isFrozen(request.headers)||typeof request.url!=="string")throw new Error("mutable result");
let failed=false;try{new RequestBuilder().timeout(NaN);}catch{failed=true;}if(!failed)throw new Error("invalid timeout");`,
    "0014": `const records:object[]=[]; const model=new AssistantFacade(new TracedModel(new ProviderAdapter({async generate(input){return {output:input.text};}}),event=>{records.push(event);}));
if(await model.answer("hello",new AbortController().signal)!=="Answer briefly: hello"||records.length!==1)throw new Error("wrapper contract");
const fault=new Error("provider");const recorder=()=>{throw new Error("recorder");};
if(await new TracedModel({async complete(){return "ok";}},recorder).complete("x",new AbortController().signal)!=="ok")throw new Error("lost result");
let caught:unknown;try{await new TracedModel({async complete(){throw fault;}},recorder).complete("x",new AbortController().signal);}catch(error){caught=error;}if(caught!==fault)throw new Error("masked provider error");`,
    "0015": `const w=new Workflow();let later=false;w.subscribe(()=>{throw new Error("listener");});w.subscribe(()=>{later=true;});let failed=false;try{w.dispatch({type:"approve"});}catch{failed=true;}if(!failed || w.status!=="approved" || later)throw new Error("fail-fast transition semantics");
let invalid=false;try{new Workflow().dispatch({type:"send"});}catch{invalid=true;}if(!invalid)throw new Error("invalid transition");`,
    "0017": `const calls:string[]=[]; let invalid=false;const useCase=new PlaceOrder(async()=>({orders:{async find(id){return invalid?undefined:{id,status:"draft" as const};},async save(){calls.push("save");}},async commit(){calls.push("commit");},async rollback(){calls.push("rollback");}}));
await useCase.execute("a");invalid=true;try{await useCase.execute("missing");}catch{}if(calls.join()!=="save,commit,rollback")throw new Error("transaction branching");
const original=new Error("save");const cleanup=new Error("rollback");let caught:unknown;try{await new PlaceOrder(async()=>({orders:{async find(id){return {id,status:"draft"};},async save(){throw original;}},async commit(){throw new Error("must not commit");},async rollback(){throw cleanup;}})).execute("a");}catch(error){caught=error;}if(!(caught instanceof AggregateError)||caught.errors[0]!==original||caught.errors[1]!==cleanup)throw new Error("lost transaction errors");`,
    "0591": `const bytes=new TextEncoder().encode('id:  a\\ndata: {"word":"café"}\\n\\ndata: {"n":2}\\n\\n');
const chunks=Array.from(bytes,byte=>new Uint8Array([byte]));
const response=new Response(new ReadableStream({pull(controller){const chunk=chunks.shift();if(chunk)controller.enqueue(chunk);else controller.close();}}));
const observed:StreamEvent[]=[];for await(const event of readSse(response))observed.push(event);
if(observed.length!==2 || observed[0]?.id!==" a" || observed[1]?.id!==" a" || (observed[0]?.data as {word:string}).word!=="café")throw new Error("chunk/UTF8/id handling");
for(const body of ['data: {}\\r\\n\\r\\n','x'.repeat(65537),'data: invalid\\n\\n']) {let rejected=false;try{for await(const event of readSse(new Response(body)))void event;}catch{rejected=true;}if(!rejected)throw new Error("invalid fixture accepted");}
let count=0;for await(const event of readSse(new Response('data: {}')))count++;if(count!==0)throw new Error("incomplete frame dispatched");
let cancelled=false;const open=new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('data: {}\\n\\n'));},cancel(){cancelled=true;}}));
for await(const event of readSse(open))break;if(!cancelled)throw new Error("early exit did not cancel reader");`
  };
  const designLessons = manifest.lessons.filter(lesson => lesson.trackId === "software-design" || ["0456","0457","0458","0460","0591"].includes(lesson.number));
  const sources = [];
  for (const lesson of designLessons) {
    const html = await readFile(new URL(lesson.path.replace(/^\.\.\/\.\.\//, ""), root), "utf8");
    const encoded = html.match(/<pre aria-label="Starter code"><code>([\s\S]*?)<\/code>/)[1];
    const code = encoded.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    const source = join(scratch, `design-${lesson.number}.ts`);
    await writeFile(source, `console.assert = (condition: unknown) => {if(!condition) throw new Error("lesson assertion failed");};\n` + code + "\n" + (designProbes[lesson.number] || "") + "\nexport {};\n");
    sources.push(source);
  }
  execFileSync("tsc", ["--strict", "--target", "ES2022", "--module", "ES2022", "--outDir", scratch, ...sources], { stdio: "inherit" });
  for (const lesson of designLessons) {
    const compiled = await readFile(join(scratch, `design-${lesson.number}.js`), "utf8");
    execFileSync(process.execPath, ["--input-type=module", "-e", compiled], { timeout: 10000, stdio: "pipe" });
  }
  console.log(`${designLessons.length} additional design/service/stream snippets compiled and executed; adapter checks are local fakes.`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
