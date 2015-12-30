define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient", "VSS/Controls", "VSS/Controls/StatusIndicator"], function (require, exports, ExtensionData, Q, ko, buildClient, Controls, StatusIndicator) {
	
    
         
          
         
         var buildId = parseInt(location.search.substr("?id=".length));
		 var apiClient = buildClient.getClient();
		 var webcontext = VSS.getWebContext();
          
         var apiUrl = webcontext.collection.uri + webcontext.project.name +"/_apis/build/builds/" + buildId + "?api-version=2.0";
         
        //  $.getJSON(apiUrl,function(build, status){
        //      var viewModel = new PromoteViewModel(buildId, build.definition.id, build.definition.name);
		// 	 getSettings(viewModel, build.definition.id);
		// 	 ko.applyBindings(viewModel);
		// 	 VSS.notifyLoadSucceeded();
        //  })
         
         var buildClient = apiClient.getBuild(buildId).then(function(build){
             var viewModel = new PromoteViewModel(buildId, build.definition.id, build.definition.name);
			 getSettings(viewModel, build.definition.id);
			 ko.applyBindings(viewModel);
			 VSS.notifyLoadSucceeded();
         });
         
         function PromoteViewModel(buildId, buildDefId, buildDefName){
            var self = this;
            self.artifactoryUri = ko.observable("");
            self.userName = ko.observable("");
            self.password = ko.observable("");
            self.promoteRepository = ko.observable("");
            self.buildId = buildId;
			self.comment = ko.observable("");
			self.targetStatus = ko.observable("");
			self.includeDependencies = ko.observable(false);
			self.useCopy = ko.observable(false);
			self.buildDefId = buildDefId;
			self.buildDefName = buildDefName;
			self.properties = ko.observable('ex : "components":["c1","c3","c14"], "release-name": ["fb3-ga"]');
                       
            this.promote = function(){
             
              var container = $(".artForm");
         
            var waitcontrol = Controls.create(StatusIndicator.WaitControl, container, {message: "Promotion in progress.", 
                cancellable: true, 
                target: container
                });
            waitcontrol.startWait();  
			 var webcontext = VSS.getWebContext();
			 
			 	  var promoteJson = '{"status": "' + self.targetStatus() + '"';
                  if(self.comment() != "")
                  {
                      promoteJson = promoteJson + ', "comment" : "' + self.comment() +'"';
                  } 
                  promoteJson = promoteJson  + ', "ciUser": "' +  webcontext.user.name + '", "dryRun" : false';
                   
                  if(self.promoteRepository() != "")
                  {
                       promoteJson = promoteJson  + ', "targetRepo" : "' + self.promoteRepository() + '"';
                  }
                  promoteJson = promoteJson  + ',"copy": '+ self.useCopy() +', "artifacts" : true, "dependencies" : '+ self.includeDependencies();
                 
                  if(self.properties() != "" && self.properties() != 'ex : "components":["c1","c3","c14"], "release-name": ["fb3-ga"]')
                  {
                       promoteJson = promoteJson  +', "properties": { ' + self.properties() + ' }';
                  }
                  
                  promoteJson = promoteJson  +', "failFast": true}';
				   
                   
                   $.ajax({
                    method: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    url: self.artifactoryUri() + '/' + 'api/build/promote/' + self.buildDefName + '/' + buildId,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(self.userName() + ":" + self.password()));
                    },
                    async: false,
                    data: promoteJson,
                    success: function( response ){
                        var i = response;
                        // saveSettings(self);                        
                        waitcontrol.endWait();
                        alert("TODO : prommotion succeed");
                    },
                    error: function(jqXHR, exception)
                    {
                        waitcontrol.endWait();
                        alert(jqXHR.error().responseJSON.errors[0].message);
                    }
                       
                });        
            };
         }
	  });
        
    function getSettings(viewModel, buildDefId) {
        
		console.log("getSettings");
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
               extensionSettingsService.getValue("artifactoryUri", {scopeType: "Default"}).then(function(artifactoryUriValue){
               viewModel.artifactoryUri(artifactoryUriValue);
            });
           
            extensionSettingsService.getValue("setupBuildArtifactory" + buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
                        if(loadedViewModel){
                            viewModel.userName(loadedViewModel.username);
                            viewModel.password(loadedViewModel.password);
                            viewModel.promoteRepository(loadedViewModel.promoteRepo)
                         }
            });
        });
    }
    // 
    // function saveSettings(viewModel) {
    //            
    //     var saveViewModel = {
    //         username: viewModel.userName(),
    //         password: viewModel.password(),
    //         promoteRepo: viewModel.promoteRepository(),
    //         artifactoryUrl: viewModel.artifactoryUri()
    //     };
    //     VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
    //            extensionSettingsService.setValue("PromoteBuildArtifactory" + viewModel.buildDefId, saveViewModel, {scopeType: "Default"}).then(function (value) {
    //                //console.log(value);
    //         });
    //     });
    //}