param (
    [string]$artifactoryEndpointName,
    [string]$properties,
    [string]$overrideCredentials,
    [string]$login,
    [string]$password,
	[string]$buildName,
	[string]$buildNumber,
	[string]$status,
	[string]$comment,
	[string]$targetRepo,
	[string]$copy,
	[string]$dependencies
)


function GetArtifactoryEndpoint
{
	param([string][ValidateNotNullOrEmpty()]$artifactoryEndpointName)

	$artifactoryEndpoint = Get-ServiceEndpoint -Context $distributedTaskContext -Name $artifactoryEndpointName

	if(!$artifactoryEndpoint)
	{
		throw "The Connected Service with name '$artifactoryEndpointName' could not be found. Ensure that this Connected Service was succesfully provisionned using the services tab in the Admin UI."
	}	

	return $artifactoryEndpoint

}

Write-Host 'Entering JFrog Artifactory Promote task'
Write-Host "artifactoryUrl = $artifactoryUrl"
Write-Host "properties = $properties"
Write-Host "build status = $status"
Write-Host "comment = $comment"

Write-Host "Import modules"
# Import the Task.Common dll that has all the cmdlets we need for Build
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Internal"
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Common"


#configure artifactory endpoint
if(!$artifactoryEndpointName)
{
    throw (Get-LocalizedString -Key "Artifactory URL parameter is not set")
}

$artifactoryEndpoint = GetArtifactoryEndpoint $artifactoryEndpointName

$artifactoryUrl = $($artifactoryEndpoint.Url)

$overrideCredentialsChecked = Convert-String $overrideCredentials Boolean

if($overrideCredentialsChecked)
{
	$artifactoryUser = $login
	$artifactoryPwd =  $password
}
else
{
	$artifactoryUser = $($artifactoryEndpoint.Authorization.Parameters.UserName)

	$artifactoryPwd = $($artifactoryEndpoint.Authorization.Parameters.Password)
}

$body = @{}

$body.status = $status
$body.comment = $comment
if($env:RELEASE_REQUESTEDFOR)
{
	#in case we are in a release execution
	$body.ciUser = "$env:RELEASE_REQUESTEDFOR"
}
else
{
	$body.ciUser = "$env:BUILD_QUEUEDBY"
}

$body.dryRun = $FALSE
if($targetRepo)
{
	$body.targetRepo = $targetRepo
}

$body.copy = Convert-String $copy Boolean
$body.artifacts = $TRUE
$body.dependencies = Convert-String $dependencies Boolean
 
$body.failFast = $TRUE

$body.properties = @{}
if($properties)
{
	$propertiesList = $properties.split(";")
	foreach($prop in $propertiesList)
	{
		$propDic =  $prop.split("=")
		$values = @()
		$values = $propDic[1].split(",")
		$body.properties.add($propDic[0],$values)
	}
}
if(!$buildName)
{
	$buildName = "$env:BUILD_DEFINITIONNAME"
}
if(!$buildNumber)
{
	$buildNumber = "$env:BUILD_BUILDNUMBER"
}

Write-Host "build name = $buildName"
Write-Host "build number = $($body.buildNumber)"

$jsonBody = ConvertTo-JSON $body

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $artifactoryUser, $artifactoryPwd)))

$apiBuild = [string]::Format("{0}/api/build/promote/{1}/{2}", $artifactoryUrl, $buildName, $buildNumber)
try{
	Write-Host "Send build information to JFrog Artifactory"
	Invoke-RestMethod -Uri $apiBuild -Method POST -Headers @{Authorization=("Basic {0}" -f $base64AuthInfo)} -ContentType "application/json" -Body $jsonBody
}
catch{
	Write-Verbose $_.Exception.ToString()
	$response = $_.Exception.Response
	$responseStream = $response.GetResponseStream()
	$streamReader = New-Object System.IO.StreamReader($responseStream)
	$streamReader.BaseStream.Position = 0
	$streamReader.DiscardBufferedData()
	$responseBody = $streamReader.ReadToEnd()
	$streamReader.Close()
	Write-Error "Promotion failed - $responseBody" 
}