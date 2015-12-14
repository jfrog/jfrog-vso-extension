define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q"], function (require, exports, ExtensionData, Q) {
	
	  $(function () {
        $('.saveButton').on('click', function (eventObject) {
            saveSettings("Default", ".artifactoryEndpoint");
        });
        
		getSettings("Default", ".artifactoryEndpoint");
        
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
            });
            extensionSettingsService.setValue("credentials", credentials, {scopeType: scope}).then(function (value) {
            });
            
            
            
        });
    }
    function getSettings(scope, selector) {
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getValue("artifactoryUri", {scopeType: scope}).then(function(artifactoryUri){
                $(selector + " .uri").val(artifactoryUri ? artifactoryUri : "");
            });
            extensionSettingsService.getValue("credentials", {scopeType: scope}).then(function(credentials){
                $(selector + " .username").val(credentials ? credentials.username : "");
                $(selector + " .password").val(credentials ? credentials.password : "");
            });
        });
    }