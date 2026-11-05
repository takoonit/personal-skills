const need=(condition,message)=>{if(!condition) throw new Error(message);};
const integer=value=>Number.isSafeInteger(value)&&value>=0;

function leadingJson(payload) {
  const body=payload.trimStart();
  need(body[0]==="{","Jest JSON must be the leading captured value; use a direct jest --json command");
  let depth=0,quoted=false,escaped=false;
  for(let i=0;i<body.length;i++) {
    const char=body[i];
    if(quoted) {if(escaped) escaped=false;else if(char==="\\") escaped=true;else if(char==='"') quoted=false;}
    else if(char==='"') quoted=true;
    else if(char==="{") depth++;
    else if(char==="}"&&--depth===0) return JSON.parse(body.slice(0,i+1));
  }
  throw new Error("Incomplete Jest JSON");
}

export function parseTestReport(payload,format) {
  let counts,runnerFailed=false,runnerSkipped=false;
  if(format==="tap") {
    need(/^TAP version 13\r?$/m.test(payload)&&!/^\s*Bail out!/mi.test(payload),"Incomplete or bailed-out Node TAP report");
    const plans=[...payload.matchAll(/^1\.\.(\d+)(?:\s+#.*)?\r?$/gm)];
    const records=[...payload.matchAll(/^(not )?ok (\d+)(?:\s|$)/gm)];
    need(plans.length===1&&Number(plans[0][1])===records.length&&records.every((row,i)=>Number(row[2])===i+1),"TAP plan/test records disagree");
    counts={};
    for(const [field,name] of Object.entries({total:"tests",passed:"pass",failed:"fail",cancelled:"cancelled",skipped:"skipped",todo:"todo"})) {
      const matches=[...payload.matchAll(new RegExp("^# "+name+" (\\d+)\\r?$","gm"))];
      need(matches.length===1,"Missing or ambiguous TAP counter: "+name);
      counts[field]=Number(matches[0][1]);
    }
    runnerFailed=records.some(row=>row[1]);
    need(!runnerFailed||counts.failed+counts.cancelled>0,"TAP failure record contradicts summary");
    need(counts.total>=records.length,"TAP total is smaller than top-level records");
  } else {
    need(format==="jest-json","Unsupported test-report format");
    const report=leadingJson(payload);
    need(Array.isArray(report.testResults)&&typeof report.success==="boolean"&&typeof report.wasInterrupted==="boolean","Incomplete Jest runner result");
    counts={total:report.numTotalTests,passed:report.numPassedTests,failed:report.numFailedTests,
      skipped:report.numPendingTests,todo:report.numTodoTests,cancelled:0};
    const suites=[report.numTotalTestSuites,report.numPassedTestSuites,report.numFailedTestSuites,report.numPendingTestSuites,report.numRuntimeErrorTestSuites];
    need(suites.every(integer)&&suites[0]===report.testResults.length&&suites[0]===suites[1]+suites[2]+suites[3],"Jest suite totals disagree");
    const observed={passed:0,failed:0,skipped:0,todo:0};
    for(const suite of report.testResults) {
      need(Array.isArray(suite.assertionResults),"Missing Jest assertion results");
      for(const result of suite.assertionResults) {
        const field={passed:"passed",failed:"failed",pending:"skipped",skipped:"skipped",disabled:"skipped",todo:"todo"}[result.status];
        need(field,"Unknown Jest assertion status");observed[field]++;
      }
      if(suite.status!=="passed"&&suite.status!=="pending") runnerFailed=true;
    }
    for(const field of Object.keys(observed)) need(observed[field]===counts[field],"Jest assertions contradict "+field+" count");
    runnerFailed ||= !report.success||report.wasInterrupted||suites[2]>0||suites[4]>0;
    runnerSkipped=suites[3]>0;
  }
  need(Object.values(counts).every(integer)&&counts.total===counts.passed+counts.failed+counts.skipped+counts.todo+counts.cancelled,"Test totals disagree");
  const status=runnerFailed||counts.failed||counts.cancelled?"FAILED":runnerSkipped||counts.total===0||counts.passed===0||counts.skipped||counts.todo?"INCOMPLETE":"PASSED";
  return {status,counts};
}
