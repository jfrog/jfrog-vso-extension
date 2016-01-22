define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q"], function (require, exports, ExtensionData, Q) {
	
	  $(function () {
        $('.saveButton').on('click', function (eventObject) {
            saveSettings("Default", ".Artifactory");
        });
        
		getSettings("Default", ".Artifactory");
        
	  });
	
});


function saveSettings(scope, selector) {
        var artifactoryUri = $(selector + " .uri").val();
        var credentials = {
            username: $(selector + " .username").val(),
            password: $(selector + " .password").val()
        };
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
            extensionSettingsService.setValue("artifactoryUri", artifactoryUri, {scopeType: scope}).then(function (value) {
                extensionSettingsService.setValue("credentials", credentials, {scopeType: scope}).then(function (value) {
                    $('.statusBarOK').fadeIn('slow').delay(5000).fadeOut('slow');
                });
            });
            
                       
            
        });
    }
    function getSettings(scope, selector) {
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
                extensionSettingsService.getValue("artifactoryUri", {scopeType: scope}).then(function(artifactoryUri){
                    $(selector + " .uri").val(artifactoryUri ? artifactoryUri : "");
                    extensionSettingsService.getValue("credentials", {scopeType: scope}).then(function(credentials){
                    $(selector + " .username").val(credentials ? credentials.username : "");
                    $(selector + " .password").val(credentials ? credentials.password : "");
                    VSS.notifyLoadSucceeded();
                });
            });
        });
    }