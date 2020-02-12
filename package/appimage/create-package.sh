#!/bin/bash

set -e

BUILD_DIR=/home/ubuntu/blend_build
DEBIAN_DIR=/home/ubuntu/blend_build/package


sudo apt-get update -y

sudo apt-get install -y curl

# Node.js
sudo curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt-get update -y
sudo apt-get install -y nodejs build-essential python


# Yarn
sudo curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
sudo echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update -y
sudo apt-get install -y yarn
sudo yarn global add flow-typed cross-env

# Helpers
sudo apt-get install -y jq

cd $BUILD_DIR

export BLEND_VERSION=$(cat package.json | jq '.version' -r)
yarn install --ignore-engines
yarn build:src
./node_modules/.bin/pkg . --targets node10-linux-x64 --options trace-warnings

cd ~/

mkdir -p $DEBIAN_DIR/DEBIAN

cat <<EOF >> $DEBIAN_DIR/DEBIAN/control
Package: blend
Architecture: all
Maintainer: @wehriam
Priority: optional
Version: $BLEND_VERSION
Description: Blend
Depends: libsdl2-2.0-0 (>= 2.0.4), libsdl2-image-2.0-0 (>= 2.0.1), libsndio6.1 (>= 1.1.0-2)
EOF

mkdir -p $DEBIAN_DIR/etc/blend

cp $BUILD_DIR/blend $DEBIAN_DIR/etc/blend/
cp -r $BUILD_DIR/src/band.png $DEBIAN_DIR/etc/blend/band.png
cp -r $BUILD_DIR/dist-www $DEBIAN_DIR/etc/blend/dist-www
cp -r $BUILD_DIR/static $DEBIAN_DIR/etc/blend/static
cp -r $BUILD_DIR/scripts $DEBIAN_DIR/etc/blend/scripts
cp $BUILD_DIR/node_modules/@serialport/bindings/build/Release/bindings.node $DEBIAN_DIR/etc/blend/bindings.node
cp $BUILD_DIR/node_modules/sqlite3/lib/binding/node-v64-linux-x64/node_sqlite3.node $DEBIAN_DIR/etc/blend/node_sqlite3.node
cp $BUILD_DIR/node_modules/ffi/build/Release/ffi_bindings.node $DEBIAN_DIR/etc/blend/ffi_bindings.node
cp -r $BUILD_DIR/node_modules/leveldown/prebuilds $DEBIAN_DIR/etc/blend/prebuilds
cp $BUILD_DIR/node_modules/leveldown/prebuilds/linux-x64/node.napi.musl.node $DEBIAN_DIR/etc/blend/node.napi.musl.node
cp $BUILD_DIR/node_modules/leveldown/prebuilds/linux-x64/node.napi.node $DEBIAN_DIR/etc/blend/node.napi.node
cp $BUILD_DIR/node_modules/ref/build/Release/binding.node $DEBIAN_DIR/etc/blend/binding.node
cp $BUILD_DIR/dist/sample.mp4 $DEBIAN_DIR/etc/blend/sample.mp4
cp $BUILD_DIR/node_modules/@bunchtogether/ffmpeg-static/bin/linux/x64/ffmpeg $DEBIAN_DIR/etc/blend/ffmpeg

cat <<EOF >> $DEBIAN_DIR/etc/blend/blend.defaults
# Default blend environment variables. It should be sourced via shell

# Node Environment
NODE_ENV=production

# logging level
LOG_LEVEL=debug
EOF

cat <<EOF >> $DEBIAN_DIR/etc/blend/blend.service
[Unit]
Description=Blend Multicast Receiver
After=network.target

[Service]
Type=simple
User=root
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
EnvironmentFile=/etc/blend/blend.defaults
Environment=PATH=/usr/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=BLEND_CONFIG=/etc/blend.json
Environment=BAND_UPDATE_CHECK=/etc/band/scripts/update-check
PIDFile=/etc/blend/blend.pid
Restart=always
WorkingDirectory=/etc/blend
ExecStart=/etc/blend/blend
KillMode=process

[Install]
WantedBy=multi-user.target

EOF

cat <<EOF >> $DEBIAN_DIR/DEBIAN/prerm
#!/bin/bash
sudo rm -rf /blend/etc
EOF
chmod 755 $DEBIAN_DIR/DEBIAN/prerm

cat <<EOF >> $DEBIAN_DIR/DEBIAN/preinst
#!/bin/bash
sudo rm -rf /blend/etc
EOF
chmod 755 $DEBIAN_DIR/DEBIAN/preinst

cat <<EOF >> $DEBIAN_DIR/DEBIAN/postinst
#!/bin/bash
if [ ! -f /etc/blend.json ]; then
    echo "{ \"ip\": \"\", \"multicast\": \"\" }" > /etc/blend.json
fi

# Check if libSDL2.so and libSDL2-image.so is available
if [ -f "/usr/lib/x86_64-linux-gnu/libSDL2-2.0.so.0" ]; then
    if ! [ -f "/usr/lib/x86_64-linux-gnu/libSDL2.so" ]; then
        sudo ln -s /usr/lib/x86_64-linux-gnu/libSDL2-2.0.so.0 /usr/lib/x86_64-linux-gnu/libSDL2.so
    fi
fi
if [ -f "/usr/lib/x86_64-linux-gnu/libSDL2_image-2.0.so.0" ]; then
    if ! [ -f "/usr/lib/x86_64-linux-gnu/libSDL2_image.so" ]; then
        sudo ln -s /usr/lib/x86_64-linux-gnu/libSDL2_image-2.0.so.0 /usr/lib/x86_64-linux-gnu/libSDL2_image.so
    fi
fi
EOF
chmod 755 $DEBIAN_DIR/DEBIAN/postinst

dpkg-deb --build $DEBIAN_DIR
mv $BUILD_DIR/package.deb $BUILD_DIR/blend.$BLEND_VERSION.deb

