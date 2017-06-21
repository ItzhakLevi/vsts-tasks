import fs = require('fs');
import path = require('path');
import os = require('os');
import tl = require('vsts-task-lib/task');
import tr = require('vsts-task-lib/toolrunner');
var uuidV4 = require('uuid/v4');

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // Get inputs.
        let failOnStderr = tl.getBoolInput('failOnStderr', false);
        let script: string = tl.getInput('script', false) || '';
        let workingDirectory = tl.getPathInput('workingDirectory', /*required*/ true, /*check*/ true);

        // Write the script to disk.
        tl.assertAgent('2.115.0');
        let tempDirectory = tl.getVariable('agent.tempDirectory');
        tl.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
        let filePath = path.join(tempDirectory, uuidV4() + '.sh');
        await fs.writeFileSync(
            filePath,
            '\ufeff' + script,      // Prepend the Unicode BOM character.
            { encoding: 'utf8' });  // Since UTF8 encoding is specified, node will
        //                          // encode the BOM into its UTF8 binary sequence.

        // Run the script.
        let bash = tl.tool(tl.which('bash', true))
            .arg('--noprofile')
            .arg(`--norc`)
            .arg(filePath);
        let options = <tr.IExecOptions>{
            cwd: workingDirectory,
            failOnStdErr: failOnStderr,
            errStream: process.stdout,
            outStream: process.stdout,
            ignoreReturnCode: false
        };
        await bash.exec(options);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}

run();
