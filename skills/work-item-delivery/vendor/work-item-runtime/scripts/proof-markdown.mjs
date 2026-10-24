const md=value=>String(value).replace(/[\r\n]+/g," ").replace(/[<>|`]/g,char=>({"<":"&lt;",">":"&gt;","|":"\\|","`":"\\`"}[char]));
const localLink=path=>encodeURI(path).replace(/[?#()|]/g,char=>"%"+char.charCodeAt(0).toString(16).toUpperCase());

export function renderProof(index) {
  const lines=["## Proof of Works","",`Declared scope: ${md(index.environment)}. Tested source: \`${index.head}\`.`,
    `Work Item: [${md(index.work_item.id)}](${index.work_item.url}). Product-action records: ${index.acceptance.status}.`,
    "The procedure comes from the approved plan. Observations are authored records with checked artifact bytes; this does not establish human execution or acceptance. Local evidence; SIT/deployment not verified."];
  for(const row of index.acceptance.cases) {
    lines.push("",`**${md(row.id)}: ${md(row.title)}**`,
      `Work Item expectation: ${md(row.expected)}.`,
      "Requirement sources: "+row.sources.map(source=>`[${md(source.id)} § ${md(source.section)} r${md(source.revision)}](${source.url})`).join("; ")+".");
    for(const flow of row.flows) {
      lines.push(`- Role and starting action (planned): ${md(flow.actor)}; ${md(flow.trigger)}.`,
        "- Preconditions (planned): "+(flow.preconditions.map(md).join("; ")||"none recorded")+".");
      for(const step of flow.steps) lines.push(`- Action: ${md(step.action)}. Expected: ${md(step.business_rule)}.`);
      lines.push(`- Task outcome (planned): ${md(flow.outcome)}.`);
    }
    for(const capture of row.captures) {
      if(capture.tool==="not-applicable") lines.push(`- UI capture not applicable (planned): ${md(capture.reason)}.`);
      else {
        lines.push(`- Baseline entry point (planned): ${md(capture.environment)}; ${md(capture.before_url??capture.url)}.`,
          `- Fixed-build entry point (planned): ${md(capture.environment)}; ${md(capture.url)}.`);
        for(const step of capture.steps) lines.push(`- User step (planned): ${md(step)}.`);
        lines.push("- Capture expectations (planned): "+capture.assertions.map(md).join("; ")+".");
      }
    }
    lines.push("","| Phase | Executed actions / executor | Expected | Observed | Evidence |","| --- | --- | --- | --- | --- |");
    for(const phase of ["before","after"]) {
      const observations=row.observations.filter(item=>item.phase===phase);
      if(!observations.length) lines.push(`| ${phase} | Not recorded | ${md(row.expected)} | Not recorded for this case | Missing |`);
      for(const observation of observations) {
        lines.push(`| ${phase} (${md(observation.environment)}, ${observation.head}) | ${observation.actions.map(action=>md(action.action)+(action.argv?" ("+md(JSON.stringify(action.argv))+")":action.url?" ("+md(action.method+" "+action.url)+")":"")).join("; ")}. Executed by ${md(observation.executor.kind)} ${md(observation.executor.id)} | ${md(observation.expected)} | ${md(observation.actual)} | [artifact](${localLink(observation.artifact.path)}), [execution](${localLink(observation.execution.path)}) |`);
      }
    }
    lines.push("",`Product-action record: ${row.status}.`);
    if(row.gaps.length) lines.push("Acceptance evidence gaps: "+row.gaps.map(md).join("; ")+".");
  }
  lines.push("","**Supporting automated checks**",`Test execution: ${index.status}. These results do not replace the case journeys above.`,"",
    "| Check / purpose | Type | Cases (authored) | Result | Runner counts | Evidence |","| --- | --- | --- | --- | --- | --- |");
  for(const row of index.checks) lines.push(`| ${md(row.unit+"/"+row.check+": "+row.purpose)} | ${row.kind} | ${row.case_ids.join(", ")} | ${row.report.status} | ${row.report.counts?Object.entries(row.report.counts).map(([key,value])=>key+"="+value).join(", "):"unavailable"} | [log](${localLink(row.evidence.path)}) |`);
  lines.push("","Supporting observations (automated, unclassified or incomplete product actions).", "", "| Case / phase | Classification / executor | Expected | Observed | Evidence |", "| --- | --- | --- | --- | --- |");
  for(const row of index.observations.filter(row=>!row.eligible)) lines.push(`| ${md(row.case_id+" / "+row.phase)} | ${md(row.classification)}${row.executor?" / "+md(row.executor.kind+" "+row.executor.id):" / unattributed"}${row.classification_gap?" / "+md(row.classification_gap):""} | ${md(row.expected)} | ${md(row.actual)} | [artifact](${localLink(row.artifact.path)})${row.test?", [test snapshot]("+localLink(row.test.path)+")":""} |`);
  lines.push("","| Case | Test mapping (authored) | Execution |","| --- | --- | --- |");
  for(const row of index.cases) lines.push(`| ${row.id} | ${row.checks.map(check=>check.unit+"/"+check.check).join(", ")||"none"} | ${row.status} |`);
  lines.push("",`Blast-radius fact (authored): ${md(index.blast_radius.fact??"not supplied")}.`,
    `Evidence: ${index.blast_radius.status} (${index.blast_radius.checks.map(row=>row.unit+"/"+row.check).join(", ")||"none"}).`,
    `Observations (authored, artifact hashes checked): ${index.observations.filter(row=>row.phase==="before").length} before; ${index.observations.filter(row=>row.phase==="after").length} after.`,"",
    "Gaps: "+(index.gaps.length?index.gaps.map(md).join("; "):"none in this recorded test-execution scope")+".","",
    "Evidence index: [evidence-index.json](evidence-index.json), a private local file, not an uploaded attachment.",
    "Behavioral quality, acceptance and authored observations require review. Missing before/after observations are not inferred from passing tests.","");
  return lines.join("\n");
}
