#!/bin/bash

set -e

sudo echo ""

export BLEND_VERSION=$(cat ../../package.json | jq '.version' -r)

cd ../..

rm -rf ./node_modules
rm -rf ./dist
rm -rf ./package/osx/files/*
rm -rf ./package/osx/pkg
rm -rf ./package/osx/distribution.xml
mkdir -p ./package/osx/files/usr/local/blend
mkdir -p ./package/osx/files/Library/LaunchDaemons
mkdir -p ./package/osx/pkg
mkdir -p ./installers
rm "./installers/blend $BLEND_VERSION.pkg" | true

yarn install
yarn build

cat <<EOF >> ./package/osx/files/Library/LaunchDaemons/com.bunchenterprise.blend.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.bunchenterprise.blend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/blend/blend</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
      <key>LOG_LEVEL</key>
      <string>debug</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
      <key>SuccessfulExit</key>
      <false/>
    </dict>
    <key>ExitTimeOut</key>
      <integer>60</integer>
    <key>WorkingDirectory</key>
    <string>/usr/local/blend</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/blend/blend.log</string>
    <key>StandardOutPath</key>
    <string>/usr/local/blend/blend.log</string>
  </dict>
</plist>
EOF

cat <<EOF >> ./package/osx/distribution.xml
<?xml version="1.0" encoding="utf-8" standalone="no"?>
<installer-gui-script minSpecVersion="2">
    <title>Blend</title>
    <pkg-ref id="com.bunchenterprise.blend"/>
    <organization>com.bunchenterprise</organization>
    <domains enable_localSystem="true"/>
    <options rootVolumeOnly="true"/>
    <welcome file="welcome.html" mime-type="text/html" />
    <license file="license.html" mime-type="text/html" />
    <pkg-ref id="com.bunchenterprise.blend.installer"
             version="$BLEND_VERSION"
             auth="root">install.blend.$BLEND_VERSION.pkg</pkg-ref>
    <pkg-ref id="com.bunchenterprise.blend.uninstaller"
             version="$BLEND_VERSION"
             auth="root">uninstall.blend.$BLEND_VERSION.pkg</pkg-ref>
    <choices-outline>
      <line choice="install" />
      <line choice="uninstall" />
    </choices-outline>
    <choice
        id="install"
        visible="true"
        title="Install Blend"
        description="Install the Blend multicast receiver."
        selected="!choices.uninstall.selected">
      <pkg-ref id="com.bunchenterprise.blend.installer"/>
    </choice>
    <choice
        id="uninstall"
        visible="true"
        title="Uninstall Blend"
        description="Uninstall the Blend multicast receiver."
        selected="!choices.install.selected"
        start_selected="false">
      <pkg-ref id="com.bunchenterprise.blend.uninstaller"/>
    </choice>
</installer-gui-script>
EOF

./node_modules/.bin/pkg . --targets node10-macos-x64 --options trace-warnings
mv ./blend ./package/osx/files/usr/local/blend/
cp ./node_modules/farmhash/build/Release/farmhash.node ./package/osx/files/usr/local/blend/
cp ./node_modules/@bunchtogether/ffmpeg-static/bin/darwin/x64/ffmpeg ./package/osx/files/usr/local/blend/ffmpeg
cp ./src/sample.mp4 ./package/osx/files/usr/local/blend/sample.mp4

cd ./package/osx

chmod a+x ./files/usr/local/blend/blend
chmod u+x ./installer-scripts/*
chmod u+x ./uninstaller-scripts/*

sudo pkgbuild \
  --identifier com.bunchenterprise.blend.installer \
  --version $BLEND_VERSION \
  --root ./files \
  --sign "Developer ID Installer: Bunch Inc (QC46F2E3JW)" \
  --scripts ./installer-scripts \
  ./pkg/install.blend.$BLEND_VERSION.pkg ;

sudo pkgbuild \
  --identifier com.bunchenterprise.blend.uninstaller \
  --version $BLEND_VERSION \
  --nopayload \
  --sign "Developer ID Installer: Bunch Inc (QC46F2E3JW)" \
  --scripts ./uninstaller-scripts \
  ./pkg/uninstall.blend.$BLEND_VERSION.pkg ;

sudo productbuild \
  --distribution ./distribution.xml \
  --sign "Developer ID Installer: Bunch Inc (QC46F2E3JW)" \
  --resources resources \
  --package-path pkg \
  --version $BLEND_VERSION \
  "./blend $BLEND_VERSION.pkg"

mv "./blend $BLEND_VERSION.pkg" ../../installers
sudo chown $(whoami) "../../installers/blend $BLEND_VERSION.pkg"
rm -rf ./distribution.xml
rm -rf ./files/*
rm -rf ./pkg
cd ../..
yarn install

