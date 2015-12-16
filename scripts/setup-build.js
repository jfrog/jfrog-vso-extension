define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout"], function (require, exports, ExtensionData, Q, ko) {
	
		 var viewModel = new SetupViewModel();
         ko.applyBindings(viewModel);
         
         getSettings(viewModel);
         
         VSS.notifyLoadSucceeded();
         
         function SetupViewModel(){
            var self = this;
            self.artifactoryUri = ko.observable("loading");
            self.overrideCreds =  ko.observable(false);
            self.userName = ko.observable("loading");
            self.password = ko.observable("loading");
            self.publishRepo = ko.observable("");
            self.promoteRepo = ko.observable("");
           
            this.save = function(){
              console.log(self.overrideCreds());
              console.log(self.artifactoryUri());
              console.log(self.publishRepo());
              console.log(self.promoteRepo());
            };
            
         }
	  });
        
    function getSettings(viewModel) {
        console.log(viewModel.artifactoryUri);
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getValue("artifactoryUri", {scopeType: "Default"}).then(function(artifactoryUriValue){
               viewModel.artifactoryUri(artifactoryUriValue);
            });
            extensionSettingsService.getValue("credentials", {scopeType: "Default"}).then(function(credentials){
                        viewModel.userName(credentials ? credentials.username : "");
                        viewModel.password(credentials ? credentials.password : "");
                         console.log("hey I loaded creds")
            });
        });
    }
    
    function saveSettings(scope, selector) {
                // var artifactoryUri = $(selector + " .uri").val();
        // var credentials = {
        //     username: $(selector + " .username").val(),
        //     password: $(selector + " .password").val()
        // };
        // VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
        //        extensionSettingsService.setValue("credentials", credentials, {scopeType: scope}).then(function (value) {
        //     });
        //     
        //     
        //     
        // });
    }
        