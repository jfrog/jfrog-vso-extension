

define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient"], function (require, exports, ExtensionData, Q, ko, buildClient) {
		var viewModel = new BuildInfoViewModel();
		 ko.applyBindings(viewModel);
		var sharedConfig = VSS.getConfiguration();
            if (sharedConfig) {
				VSS.getAccessToken().then(function(token){
					
                // register your extension with host through callback
                sharedConfig.onBuildChanged(function (build) {
				
				var buildId = build.id;
				var buildNumber = build.buildNumber;
				if(buildId > 0)
				{
							VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
							extensionSettingsService.getDocument("setupBuildArtifactory", build.definition.id, {scopeType: "Default"}).then(function(loadedViewModel){
										if(loadedViewModel){
											$.ajax({
											cache: false,
											url: loadedViewModel.artifactoryUrl +'/api/build/' + build.definition.name + '/' + buildNumber,
											type: 'GET',
											dataType: 'json',
											success: function(data) {
												//var result = JSON.parse(data);
												var buildInfoUrl =loadedViewModel.artifactoryUrl + '/webapp/builds/' + build.definition.name + '/' + buildNumber;
												
												viewModel.load(buildId, data.buildInfo, buildInfoUrl);
												VSS.notifyLoadSucceeded();
												
												},
											error: function(jqXHR, exception) { 
												reset(viewModel);
												//console.log(jqXHR.error().responseJSON.errors[0].message)
												VSS.notifyLoadSucceeded();
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
				}   
				});                   
					});
			}
	 
	function BuildInfoViewModel(){
		var self = this;
		
		self.isLoaded = ko.observable(false);
		self.id = ko.observable("");
		self.number = ko.observable("");
		self.agentName = ko.observable("");
		self.agentVersion = ko.observable("");
		self.buildAgentName =  ko.observable("");
		self.buildAgentVersion = ko.observable("");
		
		self.artifactoryBuildInfoUri = ko.observable("");
		self.artifactoryPrincipal = ko.observable("");
		self.principal = ko.observable("");
		self.modules =  ko.observable("");
		
		self.statuses = ko.observableArray();
		self.agent = ko.computed(function(){
			if(self.isLoaded()){
				return self.agentName() + ' (v ' + self.agentVersion() + ')';
			}
			else
			{
				return "";
			} 
		}) 
		self.buildAgent = ko.computed(function(){
			if(self.isLoaded()){
				return self.buildAgentName() + ' (v ' + self.buildAgentVersion() + ')'
			}
			else
			{
				return "";
			} 
		}) 
		
		
		
		self.load = function(buildId, parsedData, buildInfoUrl){
			self.id(buildId);
			self.number(parsedData.number);
			self.agentName(parsedData.agent.name);
			self.agentVersion(parsedData.agent.version);
			self.buildAgentName(parsedData.buildAgent.name);
			self.buildAgentVersion(parsedData.buildAgent.version);
			
			self.artifactoryBuildInfoUri(buildInfoUrl);
			self.artifactoryPrincipal(parsedData.artifactoryPrincipal);
			self.principal(parsedData.principal);
			self.modules(parsedData.modules);
			
			self.statuses([]);
			if(parsedData.statuses)
			{
				parsedData.statuses.forEach(function(element) {
				self.statuses.push(new StatusViewModel(element));	
				}, this);
			}
			self.isLoaded(true);
		}
		
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
			urlReplacementObject: {buildId: self.id()}  
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
	
	var reset = function(obj){
			for(var prop in obj)
			{
				 if ( obj.hasOwnProperty( prop ) && ko.isComputed(obj[prop]) == false && ko.isObservable( obj[ prop ] ) ) {
					obj[ prop ]( undefined );
				}
			}
		}

	 function getArtifactoryUrl(buildDefId) {
            VSS.getService("ms.vss-web.data-service").then(function (extensionSettingsService) {
           
            extensionSettingsService.getDocumment("setupBuildArtifactory", buildDefId, {scopeType: "Default"}).then(function(loadedViewModel){
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