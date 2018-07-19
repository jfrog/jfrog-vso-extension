
const tl = require('vsts-task-lib/task');
const execSync = require('child_process').execSync;
const utils = require('jfrog-utils');
const path = require('path');

var cliDownloadCommand = "rt dl";

function RunTaskCbk(cliPath) {
    process.env["JFROG_CLI_OFFER_CONFIG"] = false;

    var buildDir = tl.getVariable('Agent.BuildDirectory');
    var buildDefinition = tl.getVariable('BUILD.DEFINITIONNAME');
    var buildNumber = tl.getVariable('BUILD_BUILDNUMBER');
    var specPath = path.join(buildDir, "downloadSpec.json");

    // Get input parameters
    var artifactory = tl.getInput("artifactoryService", true);
    var artifactoryUrl = tl.getEndpointUrl(artifactory);
    var artifactoryUser = tl.getEndpointAuthorizationParameter(artifactory, "username", true);
    var artifactoryPassword = tl.getEndpointAuthorizationParameter(artifactory, "password", true);
    var filespec = tl.getInput("filespec", true);
    var collectBuildInfo = tl.getBoolInput("collectBuildInfo");

    // Write provided filespec to file
    try {
        tl.writeFile(specPath, filespec);
    } catch (ex) {
        handleException(ex);
    }

    var cliCommand = utils.cliJoin(cliPath, cliDownloadCommand, "--url=" + artifactoryUrl, "--spec=" + specPath);

    // Check if should make anonymous access to artifactory
    if (artifactoryUser == "") {
        artifactoryUser = "anonymous";
        cliCommand = utils.cliJoin(cliCommand, "--user=" + artifactoryUser);
    } else {
        cliCommand = utils.cliJoin(cliCommand, "--user=" + artifactoryUser, "--password=" + artifactoryPassword);
    }

    // Add build info collection
    if (collectBuildInfo) {
        cliCommand = utils.cliJoin(cliCommand, "--build-name=" + buildDefinition, "--build-number=" + buildNumber);
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
