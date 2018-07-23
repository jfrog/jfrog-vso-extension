
const tl = require('vsts-task-lib/task');
const execSync = require('child_process').execSync;
const utils = require('jfrog-utils');

const cliBuildPublishCommand = "rt bp";
const cliCollectEnvVarsCommand = "rt bce";

function RunTaskCbk(cliPath) {
    let buildDir = tl.getVariable('Agent.BuildDirectory');
    let buildDefinition = tl.getVariable('BUILD.DEFINITIONNAME');
    let buildNumber = tl.getVariable('BUILD_BUILDNUMBER');

    // Get configured parameters
    let artifactory = tl.getInput("artifactoryService", true);
    let artifactoryUrl = tl.getEndpointUrl(artifactory);
    let artifactoryUser = tl.getEndpointAuthorizationParameter(artifactory, "username", true);
    let artifactoryPassword = tl.getEndpointAuthorizationParameter(artifactory, "password", true);
    let collectBuildInfo = tl.getBoolInput("includeEnvVars");

    // Collect env vars
    if (collectBuildInfo) {
        console.log("Collecting environment variables...");
        let cliEnvVarsCommand = utils.cliJoin(cliPath, cliCollectEnvVarsCommand, buildDefinition, buildNumber);
        executeCliCommand(cliEnvVarsCommand, buildDir);
    }

    let cliCommand = utils.cliJoin(cliPath, cliBuildPublishCommand, buildDefinition, buildNumber, "--url=" + artifactoryUrl);

    // Check if should make anonymous access to artifactory
    if (artifactoryUser === "") {
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
