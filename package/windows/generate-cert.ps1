$root = New-SelfSignedCertificate -Type Custom -KeySpec Signature `
-Subject "CN=P2SRootCert" `
-KeyExportPolicy NonExportable `
-HashAlgorithm sha256 -KeyLength 4096 `
-CertStoreLocation "Cert:\CurrentUser\My" `
-KeyUsageProperty Sign `
-KeyUsage CertSign `
-NotAfter (Get-Date).AddYears(10)

# Generate certificate from root for web service
$cert = New-SelfSignedCertificate -Type Custom `
-Subject "CN=P2SChildCertWeb" -KeyExportPolicy Exportable `
-DnsName "127.0.0.1" `
-HashAlgorithm sha256 -KeyLength 2048 `
-KeyUsage "KeyEncipherment", "DigitalSignature" `
-NotAfter (Get-Date).AddYears(10) `
-CertStoreLocation "Cert:\CurrentUser\My" `
-Signer $root

$path = Resolve-Path .

echo $cert.PrivateKey.CspKeyContainerInfo.Exportable

[system.IO.file]::WriteAllBytes( "$path\blend.pfx" , $cert.Export('PFX', 'blend'))

.\pfx-to-pem.ps1 -PFXFile "$path\blend.pfx" -Passphrase "blend"