
var tl = require('vsts-task-lib/task');
var trm = require('vsts-task-lib/toolrunner');
var fs = require('fs')
var exec = require('child_process').exec;

var utils = require('jfrog-utils');

utils.downloadCli(RunTaskCbk);



function RunTaskCbk(cliPath) {
    console.log("In the function that bar will write " + cliPath)

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

    fs.writeFile("spec.txt", filespec, function(err) {
        if(err) {
            console.log("Stderr: " + stderr)
            tl.setResult(tl.TaskResult.Failed, stderr)
            process.exit(1)
        }

        console.log("FileSpec was saved!");
    });


    var cliCommand = cliPath + " rt u --url=" + artifactoryUrl + " --user=" + artifactoryUser + " --password=" + artifactoryPassword + " --spec=spec.txt"
    //var cliCommand = cliPath + " -v"
    executeCliCommand(cliCommand)

    tl.setResult(tl.TaskResult.Succeeded, "Build Succeeded.")
}

function executeCliCommand(cliCommand) {
    exec(cliCommand, function callback(error, stdout, stderr) {
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
