#!/bin/bash

set -e

BUILD_DIR="/home/ubuntu/blend_build"
APPIMAGE_DIR="$BUILD_DIR/appimage"

sudo apt-get update -y
sudo apt install apt-offline zip -y

[ -d $APPIMAGE_DIR ] && rm -rf $APPIMAGE_DIR
mkdir -p $APPIMAGE_DIR

BLEND_VERSION=$(cat $BUILD_DIR/package.json | jq '.version' -r)

cd $APPIMAGE_DIR

# Download pkg2appimage
curl -s -L 'https://github.com/AppImage/pkg2appimage/raw/master/pkg2appimage' -o ./pkg2appimage

cat <<EOF >> $APPIMAGE_DIR/AppImage.yml
app: Blend
binpatch: true
lowerapp: blend

ingredients:
  dist: xenial
  sources:
    - deb http://archive.ubuntu.com/ubuntu/ xenial main universe
  debs:
    - $BUILD_DIR/blend.$BLEND_VERSION.deb
  package: blend

script:
  - cp $BUILD_DIR/blend.png blend.png
  - cat > blend.desktop <<\EOF
  - [Desktop Entry]
  - Name=Blend
  - Version=1.0
  - Exec=/etc/blend/blend
  - Icon=blend
  - Type=Application
  - Categories=Network
  - Terminal=true
  - X-AppImage-Name=Blend
  - X-AppImage-Version=$BLEND_VERSION
  - EOF
  - cat > ./AppRun <<\EOF
  - #!/bin/sh
  - HERE=\$(dirname \$(readlink -f "\${0}"))
  - export LD_LIBRARY_PATH="\${HERE}/usr/lib/x86_64-linux-gnu:\$LD_LIBRARY_PATH"
  - cd "\${HERE}/etc/blend"
  - exec "\${HERE}/etc/blend/blend" "\$@"
  - EOF
  - chmod a+x ./AppRun
  - cp usr/lib/x86_64-linux-gnu/libSDL2-2.0.so.0 usr/lib/x86_64-linux-gnu/libSDL2.so
  - cp usr/lib/x86_64-linux-gnu/libSDL2_image-2.0.so.0 usr/lib/x86_64-linux-gnu/libSDL2_image.so
EOF

cp $BUILD_DIR/blend.png $APPIMAGE_DIR/blend.png
bash -ex ./pkg2appimage AppImage.yml

mv $APPIMAGE_DIR/out/Blend*.AppImage $BUILD_DIR/blend-$BLEND_VERSION.AppImage