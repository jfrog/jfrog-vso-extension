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
               
               $.getJSON(apiUrl, function(data ,status){

                 if(!data.variables)
                 {
                     data.variables = {};
                 }
                 data = addVariablesToBuildDefinition(data,"PublishRepository", self.publishRepo());
                 data = addVariablesToBuildDefinition(data,"PromoteRepository", self.promoteRepo());
                 data = addVariablesToBuildDefinition(data,"ArtifactoryUsername", self.userName());
                 data = addVariablesToBuildDefinition(data,"ArtifactoryApiKey", self.password());
                 data = addVariablesToBuildDefinition(data,"ArtifactoryUri", self.artifactoryUri());
                 
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
            extensionSettingsService.getValue("setupBuildArtifactory" + viewModel.buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
                        if(loadedViewModel){
                            viewModel.userName(loadedViewModel.username);
                            viewModel.password(loadedViewModel.password);
                            viewModel.publishRepo(loadedViewModel.publishRepo)
                            viewModel.promoteRepo(loadedViewModel.promoteRepo)
                            console.log("hey I loaded creds")
                         }
            });
        });
    }
    
    function addVariablesToBuildDefinition(buildDef, variableName, value){
          var tempMap = {};
          tempMap["value"] = value;
          buildDef.variables[variableName] = tempMap;
          return buildDef;
    }
    
    function saveSettings(viewModel) {
               
        var saveViewModel = {
            username: viewModel.userName(),
            password: viewModel.password(),
            publishRepo: viewModel.publishRepo(),
            promoteRepo: viewModel.promoteRepo()
        };
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
               extensionSettingsService.setValue("setupBuildArtifactory" + viewModel.buildDefId, saveViewModel, {scopeType: "Default"}).then(function (value) {
                   console.log(value);
            });
            
            
            
        });
    }
        