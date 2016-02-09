param (
    [string]$artifactoryEndpointName,
    [string]$buildName,
    [string]$buildStatus,
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

Write-Host 'Entering JFrog Artifactory Downloader task'


Write-Host "Import modules"
# Import the Task.Common dll that has all the cmdlets we need for Build
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Internal"
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Common"

if(!$artifactoryEndpointName)
{
    throw (Get-LocalizedString -Key "Artifactory URL parameter is not set")
}

$artifactoryEndpoint = GetArtifactoryEndpoint $artifactoryEndpointName

$artifactoryUrl = $($artifactoryEndpoint.Url)

Write-Verbose "artifactoryUrl = $artifactoryUrl"
Write-Verbose "buildName = $buildName"

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

$body.buildName = $buildName
if($buildStatus)
{
    $body.buildStatus = $buildStatus
	Write-Verbose "buildStatus = $buildStatus"
} 
else
{
	if($env:BUILD_BUILDNUMBER)
	{
		 $body.buildNumber =  "$env:BUILD_BUILDNUMBER"
	}
	else
    {
		$body.buildNumber = "LATEST"
	}
	Write-Verbose "buildNumber = $body.buildNumber"
}

$body.archiveType = "zip"

$jsonBody = ConvertTo-JSON $body

$secpwd = ConvertTo-SecureString $artifactoryPwd -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($artifactoryUser, $secpwd)
$api = [string]::Format("{0}/api/archive/buildArtifacts", $artifactoryUrl)

$Destination = "$env:temp\artifacts.zip"

try{
		Invoke-RestMethod -Uri $api -Method Post -Credential $cred -ContentType "application/json" -Body $jsonBody -OutFile $Destination
		if(Test-Path $Destination)
		{
			Write-Verbose "Archive downloaded at $Destination"
		}
		
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
		Write-Warning "Cannot get artifacts archive- $responseBody" 
	}