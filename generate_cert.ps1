$cert = New-SelfSignedCertificate -CertStoreLocation "Cert:\CurrentUser\My" -Type CodeSigningCert -Subject "CN=Albin David C"
$pwd = ConvertTo-SecureString -String "Memora123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "e:\Desktop\Full Stack Workout\BroCamp\Projects\Main\memora\cert.pfx" -Password $pwd
