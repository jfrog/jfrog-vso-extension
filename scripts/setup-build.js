define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient"], function (require, exports, ExtensionData, Q, ko, buildClient) {
	
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
              var defId = parseInt(location.search.substr("?id=".length));
              var webcontext = VSS.getWebContext();
              var apiget = webcontext.collection.uri + webcontext.project.name +"/_apis/build/definitions/" + defId + "?api-version=2.0";
               
               $.getJSON(apiget, function(data ,status){

                 data = addVariablesToBuildDefinition(data,"PublishRepository", self.publishRepo());
                 data = addVariablesToBuildDefinition(data,"PromoteRepository", self.promoteRepo());
                 data = addVariablesToBuildDefinition(data,"ArifactoryUsername", self.userName());
                 data = addVariablesToBuildDefinition(data,"ArifactoryApiKey", self.password());
                 data = addVariablesToBuildDefinition(data,"ArifactoryUri", self.artifactoryUri());
                 
                 var client = buildClient.getClient();
                 client.updateDefinition(data, defId, data.project.id).then(function(result){
                     console.log(result);
                 })
                   
               })

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
    
    function addVariablesToBuildDefinition(buildDef, variableName, value){
          var tempMap = {};
          tempMap["value"] = value;
          buildDef.variables[variableName] = tempMap;
          return buildDef;
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
        