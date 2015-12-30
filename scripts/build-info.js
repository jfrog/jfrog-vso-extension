
define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient"], function (require, exports, ExtensionData, Q, ko, buildClient) {
		 var sharedConfig = VSS.getConfiguration();
            if (sharedConfig) {
                // register your extension with host through callback
                sharedConfig.onBuildChanged(function (build) {

				var buildId = build.buildNumber
				if(buildId > 0)
				{
					var apiClient = buildClient.getClient();
									
					apiClient.getBuild(buildId).then(function(build){
						
							VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
							extensionSettingsService.getValue("setupBuildArtifactory" + build.definition.id, {scopeType: "Default"}).then(function(loadedViewModel){
										if(loadedViewModel){
											$.ajax({
											url: loadedViewModel.artifactoryUrl +'/api/build/' + build.definition.name + '/' + buildId,
											type: 'GET',
											dataType: 'json',
											success: function(data) {
												//var result = JSON.parse(data);
												var buildInfoUrl =loadedViewModel.artifactoryUrl + 'webapp/builds/' + build.definition.name + '/' + buildId;
												var viewModel = new BuildInfoViewModel(data.buildInfo, buildInfoUrl);
												ko.applyBindings(viewModel);
													
												VSS.notifyLoadSucceeded();
												},
											error: function(jqXHR, exception) { 
												alert(jqXHR.error().responseJSON.errors[0].message);
											},
											beforeSend: function (xhr) {
															xhr.setRequestHeader ("Authorization", "Basic " + btoa(loadedViewModel.username + ":" + loadedViewModel.password));
														}
											});
										}
										else
										{
											return "error";
										}
								});
							});
							
						});
				}                      
					});
			}
	 
	function BuildInfoViewModel(parsedData, buildInfoUrl){
		var self = this;
		
		self.id = parsedData.number;
		self.agentName = parsedData.agent.name;
		self.agentVersion = parsedData.agent.version;
		self.buildAgentName = parsedData.buildAgent.name;
		self.buildAgentVersion = parsedData.buildAgent.version;
		
		self.artifactoryBuildInfoUri = buildInfoUrl;
		self.artifactoryPrincipal = parsedData.artifactoryPrincipal;
		self.modules = parsedData.modules;
		
		self.statuses = ko.observableArray();
		if(parsedData.statuses)
		{
			parsedData.statuses.forEach(function(element) {
			self.statuses.push(new StatusViewModel(element));	
			}, this);
		}
		
		self.agent = self.agentName + ' (v ' + self.agentVersion + ')' 
		self.buildAgent = self.buildAgentName + ' (v ' + self.buildAgentVersion + ')' 
		
		self.promote = function()
		{
			var extensionCtx = VSS.getExtensionContext();
			//build absolute contribution id for dialogContent
			var contributionId = extensionCtx.publisherId + "." + extensionCtx.extensionId + ".promoteBuildDialog";
			
			//Show dialog
			var dialogOptions = {
			title: "Promote this build to JFrog Artifactory",
			width: 600,
			height: 300,
			buttons: null,
			urlReplacementObject: {buildId: self.id}  
			};
		
			VSS.getService(VSS.ServiceIds.Dialog).then(function(dialogService) {
					
				dialogService.openDialog(contributionId, dialogOptions);
			});
		}
	}
	
	function StatusViewModel(parsedData){
		var self = this;
		
		self.status = parsedData.status;
		self.comment= parsedData.comment;
		self.repository = parsedData.repository;
		self.timestamp = parsedData.timestamp;
		self.user = parsedData.user;
		self.ciUser = parsedData.ciUser;
		self.timestampDate = parsedData.timestampDate;
	}

	 function getArtifactoryUrl(buildDefId) {
            VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getValue("setupBuildArtifactory" + buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
                        if(loadedViewModel){
                            return loadedViewModel.artifactoryUri;
                         }
						 else
						 {
							 return "error";
						 }
            });
        });
    }
	
});