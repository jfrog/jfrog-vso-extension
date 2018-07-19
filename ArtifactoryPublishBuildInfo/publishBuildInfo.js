
const tl = require('vsts-task-lib/task');
const execSync = require('child_process').execSync;
const utils = require('jfrog-utils');
const path = require('path');

var cliBuildPublishCommand = "rt bp";
var cliCollectEnvVarsCommand = "rt bce"

function RunTaskCbk(cliPath) {
    process.env["JFROG_CLI_OFFER_CONFIG"] = false;

    var buildDir = tl.getVariable('Agent.BuildDirectory');
    var buildDefinition = tl.getVariable('BUILD.DEFINITIONNAME');
    var buildNumber = tl.getVariable('BUILD_BUILDNUMBER');

    // Get configured parameters
    var artifactory = tl.getInput("artifactoryService", true);
    var artifactoryUrl = tl.getEndpointUrl(artifactory);
    var artifactoryUser = tl.getEndpointAuthorizationParameter(artifactory, "username", true);
    var artifactoryPassword = tl.getEndpointAuthorizationParameter(artifactory, "password", true);
    var collectBuildInfo = tl.getBoolInput("includeEnvVars");

    // Collect env vars
    if (collectBuildInfo) {
        console.log("Collecting environment variables...");
        var cliEnvVarsCommand = utils.cliJoin(cliPath, cliCollectEnvVarsCommand, buildDefinition, buildNumber);
        executeCliCommand(cliEnvVarsCommand, buildDir);
    }

    var cliCommand = utils.cliJoin(cliPath, cliBuildPublishCommand, buildDefinition, buildNumber, "--url=" + artifactoryUrl);

    // Check if should make anonymous access to artifactory
    if (artifactoryUser == "") {
        artifactoryUser = "anonymous";
        cliCommand = utils.cliJoin(cliCommand, "--user=" + artifactoryUser);
    } else {
        cliCommand = utils.cliJoin(cliCommand, "--user=" + artifactoryUser, "--password=" + artifactoryPassword);
    }

    executeCliCommand(cliCommand, buildDir);

    tl.setResult(tl.TaskResult.Succeeded, "Build Succeeded.");
}

function executeCliCommand(cliCommand, runningDir) {
    try {
        execSync(cliCommand, {cwd:runningDir, stdio:[0,1,2]});
    } catch (ex) {
        // Error occurred
        handleException(ex);
    }
}

function handleException (ex) {
    console.log(ex);
    tl.setResult(tl.TaskResult.Failed);
    process.exit(1);
}

utils.executeCliTask(RunTaskCbk);
