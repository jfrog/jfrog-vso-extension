
var tl = require('vsts-task-lib/task');
var tr = require('vsts-task-lib/toolrunner');
var fs = require('fs')
var exec = require('child_process').exec;

var utils = require('jfrog-utils');

utils.downloadCli(RunTaskCbk);


function RunTaskCbk(cliPath) {
    console.log("In the function that bar will write " + cliPath)

    var buildDir = tl.getVariable('Agent.BuildDirectory')
    // Get configured parameters
    var artifactory = tl.getInput("artifactoryService")
    var artifactoryUrl = tl.getEndpointUrl(artifactory)
    var artifactoryUser = tl.getEndpointAuthorizationParameter(artifactory, "username")
    var artifactoryPassword = tl.getEndpointAuthorizationParameter(artifactory, "password")
    var filespec = tl.getInput("filespec")

    //var login = tl.getInput("login")
    console.log("RT URL: " + artifactoryUrl)
    console.log("RT USER: " + artifactoryUser)
    console.log("RT PASS: " + artifactoryPassword)
    console.log("FileSpec: " + filespec)

    console.log("build id: " + tl.getVariable('BUILD.BUILDID'))
    console.log("build definition: " + tl.getVariable('BUILD.DEFINITIONNAME'))
    console.log("build number: " + tl.getVariable('BUILD_BUILDNUMBER'))


    var specPath = buildDir + "/spec.json"

    fs.writeFile(specPath, filespec, function(err) {
        if(err) {
            console.log("Stderr: " + stderr)
            tl.setResult(tl.TaskResult.Failed, stderr)
            process.exit(1)
        }

        console.log("FileSpec was saved!");
    });


    var cliCommand = cliPath + " rt u --url=" + artifactoryUrl + " --user=" + artifactoryUser + " --password=" + artifactoryPassword + " --spec=" + specPath
    //var cliCommand = cliPath + " -v"
    executeCliCommand(cliCommand, buildDir)

    tl.setResult(tl.TaskResult.Succeeded, "Build Succeeded.")
}

function executeCliCommand(cliCommand, runningDir) {
    exec(cliCommand, {cwd:runningDir}, function callback(error, stdout, stderr) {
        if (!error) {
            // If no error returned, print the cli output
            console.log("Stdout: " + stdout)

        } else {
            // Error occurred
            console.log("Stderr: " + stderr)
            tl.setResult(tl.TaskResult.Failed, stderr)
            process.exit(1)
        };
    });

}
