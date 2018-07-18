var https = require('follow-redirects').https;
var fs = require('fs');
var tl = require('vsts-task-lib/task');

const path = require('path');

var fileName = getFileName();
var btPackage = "jfrog-cli-" + getArchitecture();
var runTaskCbk = null;
var folderPath = path.join(tl.getVariable("Agent.WorkFolder"), "_jfrog");
var version = "1.17.0";
var filePath = path.join(folderPath, version, fileName);

module.exports = {
    downloadCli: function (runTaskFunc) {
        runTaskCbk = runTaskFunc;
        if (!fs.existsSync(filePath)) {
            console.log("Downloading JFrog CLI " + version );
            https.get({
                hostname: 'api.bintray.com',
                port: 443,
                path: '/content/jfrog/jfrog-cli-go/' + version + '/' + btPackage + '/' + fileName + '?bt_package=' + btPackage,
                agent: false,
                followAllRedirects: true
            }, writeToFile).on('error', function (err) {console.error(err);});

        } else {
            console.log("JFrog CLI  " + version + " exists locally.");
            runCbk();
        }
    }
};

function runCbk() {
    if (runTaskCbk != null) {
        runTaskCbk(filePath);
    }
}

function writeToFile(response) {

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    if (!fs.existsSync(path.join(folderPath, version))) {
        fs.mkdirSync(path.join(folderPath, version));
    }

    var file = fs.createWriteStream(filePath);
    response.on('data', function (chunk) {
        file.write(chunk);
    }).on('end', function () {
        file.end();
        if (!process.platform.startsWith("win")) {
            fs.chmodSync(filePath, 0555)
        }
        console.log("Finished downloading jfrog cli");
        runCbk();
    }).on('error', function (err) {
        console.error(err);
    });
}

function getArchitecture() {
    var platform = process.platform;
    if (platform.startsWith("win")) {
        return "windows-amd64"
    }
    if (platform.includes("darwin")) {
        return "mac-386"
    }
    if (process.arch.includes("64")) {
        return "linux-amd64"
    }
    return "linux-386"
}

function getFileName() {
    var excecutable = "jfrog";
    if (process.platform.startsWith("win")) {
        excecutable += ".exe"
    }
    return excecutable
}