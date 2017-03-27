param (
    [string]$artifactoryEndpointName,
    [string]$targetRepo,
    [string]$artifactoryCliPath,
    [string]$contents,
    [string]$regexpInPathToArtifacts,
    [string]$properties,
    [string]$overrideCredentials,
    [string]$login,
    [string]$password,
	[string]$includeBuildInfo
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
Write-Verbose "regexpInPathToArtifacts = $regexpInPathToArtifacts"
Write-Verbose "properties = $properties"

Write-Host "Import modules"
# Import the Task.Common dll that has all the cmdlets we need for Build
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Internal"
import-module "Microsoft.TeamFoundation.DistributedTask.Task.Common"

. $PSScriptRoot\BuildInfoHelper.ps1

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

#expand environment variables in target repo and content
$targetRepo = Expand-String $targetRepo
Write-Verbose "targetRepo = $targetRepo (after expansion)"
$contents = Expand-String $contents
Write-Verbose "contents = $contents (after expansion)"

#get artifactory cli path and configure it
if((!$artifactoryCliPath) -or ((Get-Item $artifactoryCliPath) -is [System.IO.DirectoryInfo]))
{
    Write-Host "Downloading the JFrog cli from Bintray"
	$source = "https://api.bintray.com/content/jfrog/jfrog-cli-go/1.4.1/jfrog-cli-windows-amd64/jfrog.exe;bt_package=jfrog-cli-windows-amd64"
	$artifactoryCliPath = "$env:SYSTEM_ARTIFACTSDIRECTORY" + "\jfrog.exe"
	Invoke-WebRequest $source -OutFile $artifactoryCliPath
}


$pathToContent = $contents -replace '"', ''
$pathToContent = Split-Path $pathToContent

#transform contents as running on windows machine to respect attended format for JFrog Artifactory cli (see https://github.com/JFrogDev/artifactory-cli-go)
$contents = $contents -replace "\\+", "\" -replace "\\", "\\"

$regexpInPathToArtifactsChecked = Convert-String $regexpInPathToArtifacts Boolean

$env:JFROG_CLI_OFFER_CONFIG='false'
$cliArgs = "rt upload '$contents' '$targetRepo' --url=$artifactoryUrl --user=$artifactoryUser --password=$artifactoryPwd"

if($regexpInPathToArtifactsChecked)
{
	$cliArgs = ($cliArgs + " " + "--regexp=true");
}

$includeBuildInfoChecked = Convert-String $includeBuildInfo Boolean

if($includeBuildInfoChecked)
{
	if(!$properties)
	{
		$properties = ""
	}
	else
	{
		$properties += ";"
	}
	$properties += "build.number=$env:BUILD_BUILDNUMBER;"
	$properties += "build.name=$env:BUILD_DEFINITIONNAME"
}

if($properties)
{
	$cliArgs = ($cliArgs + " " + "--props='$properties'");
}

Write-Host "running '$artifactoryCliPath' $cliArgs"
Invoke-Expression "& '$artifactoryCliPath' $cliArgs" -OutVariable logsArt

if($LASTEXITCODE -ne 0)
{
	Write-Error "Deployment to Artifactory failed"
	Exit 1
}
else
{
	if($includeBuildInfoChecked)
	{
		$buildInfo = GetBuildInformationFromLogsArtCli -logsArt $logsArt -pathToContent $pathToContent -artifactoryUser $artifactoryUser
		
		$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $artifactoryUser,$artifactoryPwd)))
		$apiBuild = [string]::Format("{0}/api/build", $artifactoryUrl)
		try{
			Write-Host "Send build information to JFrog Artifactory"
			Invoke-RestMethod -Uri $apiBuild -Method Put -Headers @{Authorization=("Basic {0}" -f $base64AuthInfo)} -ContentType "application/json" -Body  ([System.Text.Encoding]::UTF8.GetBytes($buildInfo))
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
			Write-Warning "Cannot update build information - $responseBody" 
		}
	}
}
