import test from "node:test";
import assert from "node:assert/strict";
import { parseTestReport } from "../scripts/test-report.mjs";

const tap="TAP version 13\nok 1 - visible contract\n1..1\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n";
const jest=()=>({numTotalTests:1,numPassedTests:1,numFailedTests:0,numPendingTests:0,numTodoTests:0,
  numTotalTestSuites:1,numPassedTestSuites:1,numFailedTestSuites:0,numPendingTestSuites:0,numRuntimeErrorTestSuites:0,
  success:true,wasInterrupted:false,testResults:[{status:"passed",assertionResults:[{status:"passed"}]}]});

test("test reports expose actual complete runner counts",()=>{
  assert.deepEqual(parseTestReport(tap,"tap"),{status:"PASSED",counts:{total:1,passed:1,failed:0,cancelled:0,skipped:0,todo:0}});
  assert.deepEqual(parseTestReport(JSON.stringify(jest())+"\ntrailing diagnostics","jest-json"),{status:"PASSED",counts:{total:1,passed:1,failed:0,skipped:0,todo:0,cancelled:0}});
});

test("a pending Jest suite stays incomplete even when another suite passed",()=>{
  const report=jest();
  report.numTotalTestSuites=2;report.numPendingTestSuites=1;
  report.testResults.push({status:"pending",assertionResults:[]});
  assert.equal(parseTestReport(JSON.stringify(report),"jest-json").status,"INCOMPLETE");
});

test("runner failure and setup errors cannot hide behind other passing assertions",()=>{
  const report=jest();
  report.numTotalTestSuites=2;report.numFailedTestSuites=1;report.numRuntimeErrorTestSuites=1;report.success=false;
  report.testResults.push({status:"failed",assertionResults:[]});
  assert.equal(parseTestReport(JSON.stringify(report),"jest-json").status,"FAILED");
  assert.equal(parseTestReport(tap.replace("ok 1","not ok 1").replace("# pass 1","# pass 0").replace("# fail 0","# fail 1"),"tap").status,"FAILED");
});

test("empty skipped and contradictory TAP output cannot become complete proof",()=>{
  assert.equal(parseTestReport(tap.replace("ok 1 - visible contract\n","").replace("1..1","1..0").replace("# tests 1","# tests 0").replace("# pass 1","# pass 0"),"tap").status,"INCOMPLETE");
  assert.equal(parseTestReport(tap.replace("# pass 1","# pass 0").replace("# skipped 0","# skipped 1"),"tap").status,"INCOMPLETE");
  for(const value of [tap.replace("1..1\n",""),tap.replace("ok 1 - visible contract\n",""),tap+"Bail out! interrupted\n",
    tap.replace("ok 1","not ok 1"),tap.replace("# pass 1","# pass 2")]) assert.throws(()=>parseTestReport(value,"tap"));
});

test("Jest counters must match assertions and complete suite results",()=>{
  for(const mutate of [r=>r.numPassedTests=2,r=>r.testResults[0].assertionResults=[],r=>delete r.numRuntimeErrorTestSuites,
    r=>r.testResults[0].assertionResults[0].status="unknown",r=>r.numTotalTestSuites=2]) {
    const report=jest();mutate(report);assert.throws(()=>parseTestReport(JSON.stringify(report),"jest-json"));
  }
  assert.throws(()=>parseTestReport("npm chatter\n"+JSON.stringify(jest()),"jest-json"));
  assert.throws(()=>parseTestReport('{"success":true',"jest-json"));
});

test("nested TAP counts remain runner counts instead of duplicated top-level counts",()=>{
  const report=tap.replace("ok 1 - visible contract","    ok 1 - child\n    1..1\nok 1 - visible contract")
    .replace("# tests 1","# tests 2").replace("# pass 1","# pass 2");
  assert.equal(parseTestReport(report,"tap").counts.total,2);
});
