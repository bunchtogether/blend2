param([string]$filename)

function Add-Zip {
  param([string]$zipfilename)
  if(-not (test-path($zipfilename))) {
    set-content $zipfilename ("PK" + [char]5 + [char]6 + ("$([char]0)" * 18))
    (dir $zipfilename).IsReadOnly = $false
  }

  $shellApplication = new-object -com shell.application
  $zipPackage = $shellApplication.NameSpace($zipfilename)

  foreach($file in $input) {
    $zipPackage.MoveHere($file.FullName)
    Start-sleep -milliseconds 500
  }
}
$files = dir .\*.log -Recurse |Sort-Object -Descending
for($x=1;$x -le $files.Count;$x++) {
  $files[$x]| Add-Zip ".\$($filename).zip"
}