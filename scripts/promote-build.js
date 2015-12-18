define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient"], function (require, exports, ExtensionData, Q, ko, buildClient) {
	
		
         var buildId = parseInt(location.search.substr("?id=".length));
		 var apiClient = buildClient.getClient();
		 
		 apiClient.getBuild(buildId).then(function(build){
			 var viewModel = new PromoteViewModel(buildId, build.definition.id, build.definition.name);
			 getSettings(viewModel, build.definition.id);
			 ko.applyBindings(viewModel);
			 VSS.notifyLoadSucceeded();
		 })
         
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
             //TODO : promotion
			 var webcontext = VSS.getWebContext();
			 
			 	  var promoteJson = '{"status": "' + self.targetStatus + '", "comment" : "' + self.comment + '", "ciUser": "' +  webcontext.user.name + '", "timestamp" : "ISO8601", "dryRun" : false, "copy": '+ self.useCopy +', "artifacts" : true, "dependencies" : '+ self.includeDependencies +', "properties": { ' + self.properties + ' }, "failFast": true}'; 
				   
				   $.ajax({
                    method: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    url: self.artifactoryUri + '/' + 'api/build/promote/' + self.buildDefName + '/' + buildId,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(self.userName + ":" + self.password));
                    },
                    async: false,
                    data: promoteJson,
                    success: function( response ){
                        var i = response;
                        alert("prommotion succeed");
                    },
                    error: function(jqXHR, exception)
                    {
                        alert('error');
                    }
                       
                });        
            };
         }
	  });
        
    function getSettings(viewModel, buildDefId) {
        
		
        VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getValue("setupBuildArtifactory" + viewModel.buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
                        if(loadedViewModel){
							viewModel.artifactoryUri(loadedViewModel.artifactoryUri);
                            viewModel.userName(loadedViewModel.username);
                            viewModel.password(loadedViewModel.password);
                            viewModel.promoteRepo(loadedViewModel.promoteRepo)
                            console.log("hey I loaded creds")
                         }
            });
        });
    }

//   // Use an IIFE to create an object that satisfies the IContributedMenuSource contract
    //   var menuContributionHandler = (function () {
    //      "use strict";
    //      return {
    //          // This is a callback that gets invoked when a user clicks the newly contributed menu item
    //          // The actionContext parameter contains context data surrounding the circumstances of this
    //          // action getting invoked.
    //          execute: function (actionContext) {
    //             // Get the Web Context to create the uri
    //             var vstsContext = VSS.getWebContext();
    //             // Navigate to the new View Assoicated Work Items hub.
    //             // Fabrikam is the extension's namespace and Fabrikam.HelloWorld is the hub's id.
    //             var extensionContext = VSS.getExtensionContext();
    //                       
    //             var promoteJson = '{"status": "staged", "comment" : "Tested on all target platforms.", "ciUser": "jroquelaure", "timestamp" : "ISO8601", "dryRun" : false, "copy": false, "artifacts" : true, "dependencies" : true, "properties": { "components":["c1","c3","c14"], "release-name": ["fb3-ga"] }, "failFast": false}';          
    //             
    //             $.ajax({
    //                 method: 'POST',
    //                 contentType: 'application/json; charset=utf-8',
    //                 url: 'https://internalsandbox.artifactoryonline.com/internalsandbox/api/build/promote/mavenTest/78',
    //                 beforeSend: function (xhr) {
    //                     xhr.setRequestHeader ("Authorization", "Basic " + btoa("vso-deployer" + ":" + "VS0Deployer31"));
    //                 },
    //                 async: false,
    //                 data: promoteJson,
    //                 success: function( response ){
    //                     var i = response;
    //                     alert("prommotion succeed");
    //                 },
    //                 error: function(jqXHR, exception)
    //                 {
    //                     alert('error');
    //                 }
    //                    
    //             });    
    //                           
    //           
    //          }
    //      };
    //  }());