param (
    [string]$artifactoryEndpointName,
    [string]$targetRepo,
    [string]$artifactoryCliPath,
    [string]$contents,
    [string]$properties,
    [string]$overrideCredentials,
    [string]$login,
    [string]$password
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


Write-Host 'Entering JFrog Artifactory Deployer task'
Write-Verbose "artifactoryUrl = $artifactoryUrl"
Write-Verbose "targetRepo = $targetRepo"
Write-Verbose "artifactoryCliPath = $artifactoryCliPath"
Write-Verbose "contents = $contents"
Write-Verbose "properties = $properties"


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

#get artifactory cli path and configure it
if(!$artifactoryCliPath)
{
	throw ("Path to JFrog Artifactory Cli not set")
}

#transform contents as running on windows machine to respect attended format for JFrog Artifactory cli (see https://github.com/JFrogDev/artifactory-cli-go)
$contents = $contents -replace "\\+", "\" -replace "\\", "\\"

$cliArgs = "upload $contents $targetRepo --url=$artifactoryUrl --user=$artifactoryUser --password=$artifactoryPwd"

if($properties)
{
	$cliArgs = ($cliArgs + " " + "--props=$properties");
}

Write-Host "Invoking JFrog Artifactory Cli with $cliArgs"

Invoke-Tool -Path $artifactoryCliPath -Arguments  $cliArgs






