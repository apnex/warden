const fs = require("fs");
const path = require("path");
const { resolve } = require("./path_resolver");

function generateBrief() {
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.log("Usage: node engine/mission.js <Context> <Problem> <Constraint> <Success_Criteria>");
        process.exit(1);
    }

    const [context, problem, constraint, success] = args;

    const brief = `[DLR_BRF_MISSION]
Context:   ${context}
Problem:   ${problem}
Constraint: ${constraint}
Success:   ${success}`;

    console.log("\n====================================================");
    console.log("      📋 WARDEN GOVERNANCE: MISSION BRIEF");
    console.log("====================================================\n");
    console.log(brief);
    console.log("\n====================================================");
}

generateBrief();
