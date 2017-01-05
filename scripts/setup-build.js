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
            self.buildDefId = parseInt(location.search.substr("?id=".length));
                       
            this.save = function(){
                
              saveSettings(self);  
              var defId = self.buildDefId;
              var webcontext = VSS.getWebContext();
              var apiUrl = webcontext.collection.uri + webcontext.project.name +"/_apis/build/definitions/" + defId + "?api-version=2.0";
              var client = buildClient.getClient();
              
              var definition =client.getDefinition(defId, webcontext.project.name).then(function(definition) {
                 definition = addVariablesToBuildDefinition(definition,"PublishRepository", self.publishRepo(), false);
                 definition = addVariablesToBuildDefinition(definition,"PromoteRepository", self.promoteRepo(), false);
                 definition = addVariablesToBuildDefinition(definition,"ArtifactoryUsername", self.userName(), false);
                 definition = addVariablesToBuildDefinition(definition,"ArtifactoryPassword", self.password(), false);
                 definition = addVariablesToBuildDefinition(definition,"ArtifactoryUrl", self.artifactoryUri(), false);
                 
                 var client = buildClient.getClient();
                 client.updateDefinition(definition, defId, definition.project.id).then(function(result){
                     $('.statusBarOK').fadeIn('slow').delay(5000).fadeOut('slow');
                 })
                    
                }, function(reason) {
                   console.log("reason");
                });
               
            };
         }
	  });
        
    function getSettings(viewModel) {
            VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getValue("artifactoryUri", {scopeType: "Default"}).then(function(artifactoryUriValue){
               viewModel.artifactoryUri(artifactoryUriValue);
            });
            extensionSettingsService.getValue("credentials", {scopeType: "Default"}).then(function(credentials){
                        viewModel.userName(credentials ? credentials.username : "");
                        viewModel.password(credentials ? credentials.password : "");
            });
            extensionSettingsService.getDocument("setupBuildArtifactory", viewModel.buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
                        if(loadedViewModel){
                            viewModel.userName(loadedViewModel.username);
                            viewModel.password(loadedViewModel.password);
                            viewModel.publishRepo(loadedViewModel.publishRepo);
                            viewModel.promoteRepo(loadedViewModel.promoteRepo);
                            viewModel.overrideCreds(loadedViewModel.overrideCreds);
                         }
            });
        });
    }
    
    function addVariablesToBuildDefinition(buildDef, variableName, value, isSecret){
          var tempMap = {};
          tempMap["value"] = value;
          tempMap["isSecret"] = isSecret;
          tempMap["allowOverride"] = "false";
          buildDef.variables[variableName] = tempMap;
          
          return buildDef;
    }
    
    function saveSettings(viewModel) {
               
        var saveViewModel = {
            id: viewModel.buildDefId,
            username: viewModel.userName(),
            password: viewModel.password(),
            publishRepo: viewModel.publishRepo(),
            promoteRepo: viewModel.promoteRepo(),
            artifactoryUrl: viewModel.artifactoryUri(),
            overrideCreds: viewModel.overrideCreds()
        };
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
               extensionSettingsService.setDocument("setupBuildArtifactory", saveViewModel, {scopeType: "Default"}).then(function (value) {
                   console.log(value);
            });
            
            
            
        });
    }
        