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

Write-Host "artifactoryUrl = $artifactoryUrl"
Write-Host "buildName = $buildName"

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

if ($artifactoryUser) {
        Write-Host "artifactoryUser = $artifactoryUser"
}
if ($artifactoryPwd) {
        Write-Host "artifactoryPwd = (masked)"
}

$body = @{}

$body.buildName = $buildName
if($buildStatus)
{
    $body.buildStatus = $buildStatus
    Write-Host "buildStatus = $buildStatus"
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
	Write-Host "buildNumber = $body.buildNumber"
}

$body.archiveType = "zip"

$jsonBody = ConvertTo-JSON $body

$api = [string]::Format("{0}/api/archive/buildArtifacts", $artifactoryUrl)

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $artifactoryUser, $artifactoryPwd)))

$Destination = "$env:temp\artifacts.zip"

try{
		Invoke-RestMethod -Uri $api -Method Post -Headers @{Authorization=("Basic {0}" -f $base64AuthInfo)} -ContentType "application/json" -Body $jsonBody -OutFile $Destination
		if(Test-Path $Destination)
		{
			Write-Host "Archive downloaded at $Destination"
		}
		
	}
	catch {
		Write-Verbose $_.Exception.ToString()
		$response = $_.Exception.Response
		$responseStream = $response.GetResponseStream()
		$streamReader = New-Object System.IO.StreamReader($responseStream)
		$streamReader.BaseStream.Position = 0
		$streamReader.DiscardBufferedData()
		$responseBody = $streamReader.ReadToEnd()
		$streamReader.Close()
		Write-Error -Message "Cannot get artifacts archive- $responseBody" -Exception $_.Exception
	}
