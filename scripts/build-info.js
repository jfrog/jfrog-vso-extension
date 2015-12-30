
define(["require", "exports", "VSS/SDK/Services/ExtensionData", "q", "knockout", "TFS/Build/RestClient"], function (require, exports, ExtensionData, Q, ko, buildClient) {
		
	 
	 $.ajax({
          url: 'https://gcartifactory-us.jfrog.info/artifactory/api/build/MavenDemo/19',
          type: 'GET',
          dataType: 'json',
          success: function(data) {
			//var result = JSON.parse(data);
			var viewModel = new BuildInfoViewModel(data.buildInfo);
			ko.applyBindings(viewModel);
				
			VSS.notifyLoadSucceeded();
			},
          error: function(jqXHR, exception) { 
		      alert(jqXHR.error().responseJSON.errors[0].message);
		   },
          beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa('tfs' + ":" + 'AP26RDG3ZMN6gpNp5vX1Pmj24ZU'));
                    }
        });
     

    
	function BuildInfoViewModel(parsedData){
		var self = this;
		
		self.id = parsedData.number;
		self.agentName = parsedData.agent.name;
		self.agentVersion = parsedData.agent.version;
		self.buildAgentName = parsedData.buildAgent.name;
		self.buildAgentVersion = parsedData.buildAgent.version;
		
		self.artifactoryBuildInfoUri = "https://gcartifactory-us.jfrog.info/artifactory/webapp/builds/MavenDemo/19";
		self.artifactoryPrincipal = parsedData.artifactoryPrincipal;
		self.modules = parsedData.modules;
		
		self.statuses = ko.observableArray();
		parsedData.statuses.forEach(function(element) {
		self.statuses.push(new StatusViewModel(element));	
		}, this);
		
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

});

// {
//   "properties" : {
//     "file.encoding.pkg" : "sun.io",
//     "buildInfo.env.PHONEGAP_DEFAULT_VERSION" : "5.3.6",
//     "buildInfo.env.PATHEXT" : ".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.CPL",
//     "buildInfo.env.ALLUSERSPROFILE" : "C:\\ProgramData",
//     "java.home" : "C:\\java\\jdk\\jdk1.8.0_25\\jre",
//     "buildInfo.env.ERROR_CODE" : "0",
//     "buildInfo.env.ProgramW6432" : "C:\\Program Files",
//     "buildInfo.env.CORDOVA_HOME" : "C:\\cordova\\node_modules\\_cordova",
//     "classworlds.conf" : "C:\\java\\maven\\apache-maven-3.2.2\\bin\\m2.conf",
//     "buildInfo.env.TMP" : "C:\\Users\\BUILDG~1\\AppData\\Local\\Temp",
//     "java.endorsed.dirs" : "C:\\java\\jdk\\jdk1.8.0_25\\jre\\lib\\endorsed",
//     "buildInfo.env.COMMON_TESTRESULTSDIRECTORY" : "C:\\a\\1\\TestResults",
//   },
//   "version" : "1.0.1",
//   "name" : "MavenDemo",
//   "number" : "19",
//   "type" : "MAVEN",
//   "buildAgent" : {
//     "name" : "Maven",
//     "version" : "3.2.2"
//   },
//   "agent" : {
//     "name" : "Maven",
//     "version" : "3.2.2"
//   },
//   "started" : "2015-12-29T11:45:47.778+0000",
//   "durationMillis" : 159723,
//   "artifactoryPrincipal" : "tfs",
//   "url" : "https://jfrogdev.visualstudio.com/DefaultCollection///_build#_a=summary&buildId=19",
//   "licenseControl" : {
//     "runChecks" : true,
//     "includePublishedArtifacts" : false,
//     "autoDiscover" : true,
//     "licenseViolationRecipients" : [ "build@organisation.com" ],
//     "scopes" : [ "compile,runtime" ],
//     "licenseViolationsRecipientsList" : "build@organisation.com ",
//     "scopesList" : "compile,runtime "
//   },
//   "buildRetention" : {
//     "count" : -1,
//     "deleteBuildArtifacts" : true,
//     "buildNumbersNotToBeDiscarded" : [ ]
//   },
//   "modules" : [ {
//     "properties" : {
//       "project.build.sourceEncoding" : "UTF-8"
//     },
//     "id" : "org.jfrog.test:multi1:2.21-SNAPSHOT",
//     "artifacts" : [ {
//       "type" : "java-source-jar",
//       "sha1" : "9ec78fb1c2bf3c8eddcd94d2a571b439c4929f46",
//       "md5" : "026690665ae44ca63a467617b5b92df6",
//       "name" : "multi1-2.21-SNAPSHOT-sources.jar"
//     }, {
//       "type" : "test-jar",
//       "sha1" : "34e80842430f3d6fd55e5e920923abe7de5e8af7",
//       "md5" : "6e3b829ea247ed552b10af464191d905",
//       "name" : "multi1-2.21-SNAPSHOT-tests.jar"
//     }, {
//       "type" : "jar",
//       "sha1" : "f337e5a429370518c1e7a916867f14c8b04354c1",
//       "md5" : "8cacfc230c887b79e534ae35b27fb02f",
//       "name" : "multi1-2.21-SNAPSHOT.jar"
//     }, {
//       "type" : "pom",
//       "sha1" : "59e89669395de1b575cbc440f8b5badc01a87697",
//       "md5" : "5d02f40346c24e442ebb8e6ee466a0ea",
//       "name" : "multi1-2.21-SNAPSHOT.pom"
//     } ],
//     "dependencies" : [ {
//       "type" : "jar",
//       "sha1" : "449ea46b27426eb846611a90b2fb8b4dcf271191",
//       "md5" : "25c0752852205167af8f31a1eb019975",
//       "id" : "org.springframework:spring-beans:2.5.6",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "5043bfebc3db072ed80fbd362e7caf00e885d8ae",
//       "md5" : "ed448347fc0104034aa14c8189bf37de",
//       "id" : "commons-logging:commons-logging:1.1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "a8762d07e76cfde2395257a5da47ba7c1dbd3dce",
//       "md5" : "b6a50c8a15ece8753e37cbe5700bf84f",
//       "id" : "commons-io:commons-io:1.4",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "0235ba8b489512805ac13a8f9ea77a1ca5ebe3e8",
//       "md5" : "04177054e180d09e3998808efa0401c7",
//       "id" : "aopalliance:aopalliance:1.0",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "63f943103f250ef1f3a4d5e94d145a0f961f5316",
//       "md5" : "b8a34113a3a1ce29c8c60d7141f5a704",
//       "id" : "javax.servlet.jsp:jsp-api:2.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "a05c4de7bf2e0579ac0f21e16f3737ec6fa0ff98",
//       "md5" : "5d6576b5b572c6d644af2924da9a1952",
//       "id" : "org.apache.commons:commons-email:1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jdk15-jar",
//       "sha1" : "9b8614979f3d093683d8249f61a9b6a29bc61d3d",
//       "md5" : "52537a8a5231ca74518aec08434df7eb",
//       "id" : "org.testng:testng:5.9",
//       "scopes" : [ "test" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "99129f16442844f6a4a11ae22fbbee40b14d774f",
//       "md5" : "1f40fb782a4f2cf78f161d32670f7a3a",
//       "id" : "junit:junit:3.8.1",
//       "scopes" : [ "test" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "e6cb541461c2834bdea3eb920f1884d1eb508b50",
//       "md5" : "8ae38e87cd4f86059c0294a8fe3e0b18",
//       "id" : "javax.activation:activation:1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "342d1eb41a2bc7b52fa2e54e9872463fc86e2650",
//       "md5" : "2a666534a425add50d017d4aa06a6fca",
//       "id" : "org.codehaus.plexus:plexus-utils:1.5.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "7d04f648dd88a2173ee7ff7bcb337a080ee5bea1",
//       "md5" : "036c65b02a789306fbadd3c330f1e055",
//       "id" : "org.springframework:spring-aop:2.5.6",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "1aa1579ae5ecd41920c4f355b0a9ef40b68315dd",
//       "md5" : "2e64a3805d543bdb86e6e5eeca5529f8",
//       "id" : "javax.mail:mail:1.4",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "c450bc49099430e13d21548d1e3d1a564b7e35e9",
//       "md5" : "378db2cc1fbdd9ed05dff2dc1023963e",
//       "id" : "org.springframework:spring-core:2.5.6",
//       "scopes" : [ "compile" ]
//     } ]
//   }, {
//     "properties" : {
//       "project.build.sourceEncoding" : "UTF-8"
//     },
//     "id" : "org.jfrog.test:multi:2.21-SNAPSHOT",
//     "artifacts" : [ {
//       "type" : "pom",
//       "sha1" : "7b545105abf434ad219a305c07aac2783401fe23",
//       "md5" : "b1802f2fb8b491c6b409a6c271b58b6b",
//       "name" : "multi-2.21-SNAPSHOT.pom"
//     } ]
//   }, {
//     "properties" : {
//       "daversion" : "2.21-SNAPSHOT",
//       "project.build.sourceEncoding" : "UTF-8"
//     },
//     "id" : "org.jfrog.test:multi2:2.18-SNAPSHOT",
//     "artifacts" : [ {
//       "type" : "jar",
//       "sha1" : "b76ad7450bb5129bde400a11c4c1cb876db18ee8",
//       "md5" : "89a5a9d2b9a408649929709d586e52b5",
//       "name" : "multi2-2.18-SNAPSHOT.jar"
//     }, {
//       "type" : "pom",
//       "sha1" : "e5a00448c6d572c1684341c1ac78dd9e7d19035b",
//       "md5" : "4d34b6001424eb8169dc04694af9ef26",
//       "name" : "multi2-2.18-SNAPSHOT.pom"
//     } ],
//     "dependencies" : [ {
//       "type" : "jar",
//       "sha1" : "99129f16442844f6a4a11ae22fbbee40b14d774f",
//       "md5" : "1f40fb782a4f2cf78f161d32670f7a3a",
//       "id" : "junit:junit:3.8.1",
//       "scopes" : [ "test" ]
//     } ]
//   }, {
//     "properties" : {
//       "project.build.sourceEncoding" : "UTF-8"
//     },
//     "id" : "org.jfrog.test:multi3:2.21-SNAPSHOT",
//     "artifacts" : [ {
//       "type" : "war",
//       "sha1" : "94b41f8f0c7a161dabf933ac6c6a3449a4602c06",
//       "md5" : "70ca4298fd17a58e5d905e259024b703",
//       "name" : "multi3-2.21-SNAPSHOT.war"
//     }, {
//       "type" : "pom",
//       "sha1" : "f29f6ea5d6ef2306bffc650aa2a4caf8ae5d4c07",
//       "md5" : "57b9319c9c3fd9c61700d89aa12d0e0b",
//       "name" : "multi3-2.21-SNAPSHOT.pom"
//     } ],
//     "dependencies" : [ {
//       "type" : "jar",
//       "sha1" : "449ea46b27426eb846611a90b2fb8b4dcf271191",
//       "md5" : "25c0752852205167af8f31a1eb019975",
//       "id" : "org.springframework:spring-beans:2.5.6",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "5043bfebc3db072ed80fbd362e7caf00e885d8ae",
//       "md5" : "ed448347fc0104034aa14c8189bf37de",
//       "id" : "commons-logging:commons-logging:1.1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "a8762d07e76cfde2395257a5da47ba7c1dbd3dce",
//       "md5" : "b6a50c8a15ece8753e37cbe5700bf84f",
//       "id" : "commons-io:commons-io:1.4",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "0235ba8b489512805ac13a8f9ea77a1ca5ebe3e8",
//       "md5" : "04177054e180d09e3998808efa0401c7",
//       "id" : "aopalliance:aopalliance:1.0",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "63f943103f250ef1f3a4d5e94d145a0f961f5316",
//       "md5" : "b8a34113a3a1ce29c8c60d7141f5a704",
//       "id" : "javax.servlet.jsp:jsp-api:2.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "7e9978fdb754bce5fcd5161133e7734ecb683036",
//       "md5" : "7df83e09e41d742cc5fb20d16b80729c",
//       "id" : "hsqldb:hsqldb:1.8.0.10",
//       "scopes" : [ "runtime" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "f337e5a429370518c1e7a916867f14c8b04354c1",
//       "md5" : "8cacfc230c887b79e534ae35b27fb02f",
//       "id" : "org.jfrog.test:multi1:2.21-SNAPSHOT",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "a05c4de7bf2e0579ac0f21e16f3737ec6fa0ff98",
//       "md5" : "5d6576b5b572c6d644af2924da9a1952",
//       "id" : "org.apache.commons:commons-email:1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "99129f16442844f6a4a11ae22fbbee40b14d774f",
//       "md5" : "1f40fb782a4f2cf78f161d32670f7a3a",
//       "id" : "junit:junit:3.8.1",
//       "scopes" : [ "test" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "e6cb541461c2834bdea3eb920f1884d1eb508b50",
//       "md5" : "8ae38e87cd4f86059c0294a8fe3e0b18",
//       "id" : "javax.activation:activation:1.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "342d1eb41a2bc7b52fa2e54e9872463fc86e2650",
//       "md5" : "2a666534a425add50d017d4aa06a6fca",
//       "id" : "org.codehaus.plexus:plexus-utils:1.5.1",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "7d04f648dd88a2173ee7ff7bcb337a080ee5bea1",
//       "md5" : "036c65b02a789306fbadd3c330f1e055",
//       "id" : "org.springframework:spring-aop:2.5.6",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "5959582d97d8b61f4d154ca9e495aafd16726e34",
//       "md5" : "69ca51af4e9a67a1027a7f95b52c3e8f",
//       "id" : "javax.servlet:servlet-api:2.5",
//       "scopes" : [ "provided" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "1aa1579ae5ecd41920c4f355b0a9ef40b68315dd",
//       "md5" : "2e64a3805d543bdb86e6e5eeca5529f8",
//       "id" : "javax.mail:mail:1.4",
//       "scopes" : [ "compile" ]
//     }, {
//       "type" : "jar",
//       "sha1" : "c450bc49099430e13d21548d1e3d1a564b7e35e9",
//       "md5" : "378db2cc1fbdd9ed05dff2dc1023963e",
//       "id" : "org.springframework:spring-core:2.5.6",
//       "scopes" : [ "compile" ]
//     } ]
//   } ],
//   "statuses" : [ {
//     "status" : "staged",
//     "comment" : "laidhiozed zedj pzdj pzejdp ozed,op z",
//     "repository" : "libs-snapshot-local",
//     "timestamp" : "2015-12-29T12:35:28.265+0000",
//     "user" : "tfs",
//     "ciUser" : "JFrog-SolEng",
//     "timestampDate" : 1451392528265
//   }, {
//     "status" : "preprod",
//     "comment" : "",
//     "repository" : "libs-snapshot-local",
//     "timestamp" : "2015-12-29T13:41:23.155+0000",
//     "user" : "tfs",
//     "ciUser" : "JFrog-SolEng",
//     "timestampDate" : 1451396483155
//   }, {
//     "status" : "almostprod",
//     "repository" : "libs-snapshot-local",
//     "timestamp" : "2015-12-29T13:50:22.684+0000",
//     "user" : "tfs",
//     "ciUser" : "JFrog-SolEng",
//     "timestampDate" : 1451397022684
//   } ],
//   "governance" : {
//     "blackDuckProperties" : {
//       "runChecks" : false,
//       "includePublishedArtifacts" : false,
//       "autoCreateMissingComponentRequests" : false,
//       "autoDiscardStaleComponentRequests" : false
//     }
//   }
// }