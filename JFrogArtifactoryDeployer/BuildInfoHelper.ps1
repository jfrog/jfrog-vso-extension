function Get-FileHash { 
    [CmdletBinding()]
    Param(
       [Parameter(Position=0,Mandatory=$true, ValueFromPipelineByPropertyName=$true,ValueFromPipeline=$True)]
       [Alias("PSPath","FullName")]
       [string[]]$Path, 

       [Parameter(Position=1)]
       [ValidateSet("MD5","SHA1","SHA256","SHA384","SHA512","RIPEMD160")]
       [string[]]$Algorithm = "SHA256"
    )
    Process {  
        ForEach ($item in $Path) { 
            $item = (Resolve-Path $item).ProviderPath
            If (-Not ([uri]$item).IsAbsoluteUri) {
                Write-Host ("{0} is not a full path, using current directory: {1}" -f $item,$pwd)
                $item = (Join-Path $pwd ($item -replace "\.\\",""))
            }
           If(Test-Path $item -Type Container) {
              Write-Warning ("Cannot calculate hash for directory: {0}" -f $item)
              Return
           }
           $object = New-Object PSObject -Property @{ 
                Path = $item
            }
            #Open the Stream
            $stream = ([IO.StreamReader]$item).BaseStream
            foreach($Type in $Algorithm) {                
                [string]$hash = -join ([Security.Cryptography.HashAlgorithm]::Create( $Type ).ComputeHash( $stream ) | 
                ForEach { "{0:x2}" -f $_ })
                $null = $stream.Seek(0,0)
                #If multiple algorithms are used, then they will be added to existing object                
                $object = Add-Member -InputObject $Object -MemberType NoteProperty -Name $Type -Value $Hash -PassThru
            }
            $object.pstypenames.insert(0,'System.IO.FileInfo.Hash')
            #Output an object with the hash, algorithm and path
            # Write-Host $object

            #Close the stream
            $stream.Close()
            
            Return $object
        }
    }
}

function GetBuildInformationFromLogsArtCli(){
    [CmdletBinding()]
    param([string[]]$logsArt, [string]$pathToContent, [string]$artifactoryUser)	
		
        Write-Host "Get build information"
		
        $info = @{}
		
        $properties =@{}
		$envVariables = Get-ChildItem Env:
		foreach($envVar in $envVariables)
		{
          if($envVar.Name.StartsWith("AGENT"))
          {
              $envVar.Name = "buildInfo.env." + $envVar.Name
          }
          elseif($envVar.Name.StartsWith("BUILD"))
          {
              $envVar.Name = "buildInfo.env." + $envVar.Name
          }
          $properties.add($envVar.Name, $envVar.Value)
		}
        
        $info.properties = $properties
		$info.version = "1.0.1"
		$info.name = "$env:BUILD_DEFINITIONNAME"
		$info.number = "$env:BUILD_BUILDNUMBER"
        
        $agent = @{}
        $agent.name = "VSO"
        $agent.version = ""
        $info.agent = $agent
        
        $buildAgent = @{}
        $buildAgent.name = "Generic"
        $buildAgent.version = ""
        $info.buildAgent = $buildAgent
        
        
		$info.Type = "Generic"
        $formatedDate = Get-Date -format "yyyy-MM-dd'T'HH:mm:ss.fffzzzz"
        $info.started = $formatedDate.remove($formatedDate.lastIndexOf(":"),1)
        $info.durationMillis = ""
        $info.principal = "$env:BUILD_QUEUEDBY"
        $info.artifactoryPrincipal = $artifactoryUser
        $info.vcsRevision = "$env:BUILD_SOURCEVERSION"
                
		#use of undocumented cmdlet Get-TaskVariable
		$buildId = Get-TaskVariable $distributedTaskContext "build.buildId"
		$collectionUrl = "$env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI".TrimEnd('/')
		$teamproject = "$env:SYSTEM_TEAMPROJECTID"
		$info.url = [string]::Format("{0}/{1}/_build#buildId={2}&_a=summary", $collectionUrl, $teamproject, $buildId)
		
		$module = @{}
		$module.id = "$env:BUILD_DEFINITIONNAME"
		$artifacts = @()
		
		foreach($logArt in $logsArt){
			if($logArt.Contains("Uploading artifact:"))
			{
				$artifact = @{}
                                             
				$fileUrl = $logArt.substring($logArt.IndexOf("Uploading artifact")) 
                $fileUrl = $fileUrl -replace "Uploading artifact:", ""
				$fileUrl = $fileUrl.split(';')[0] 
				$file = Split-Path $fileUrl -leaf 
				$artifact.name = $file
				$artifact.type = [System.IO.Path]::GetExtension($file).split(".")[1]
				# retrieve the corresponding local file and calculate MD5 and SHA1
				$items = Get-ChildItem $pathToContent -Filter $file -recurse | Get-FileHash -Algorithm MD5, SHA1
				foreach($item in $items) {
					$artifact.md5 = $item.MD5
					$artifact.sha1 = $item.SHA1
				}
				$artifacts += $artifact
			}
		}
        
        $module.artifacts = $artifacts
		$module.dependencies = @()
    
        $info.modules = @()
		$info.modules += $module
		
		$result = ConvertTo-JSON $info -depth 4 -compress
		Write-Verbose $result
		
		Return $result
}