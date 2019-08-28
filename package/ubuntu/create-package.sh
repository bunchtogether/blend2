#!/bin/bash

set -e

sudo apt-get update -y

sudo timedatectl --adjust-system-clock set-local-rtc true
sudo timedatectl set-ntp true
sudo timedatectl set-local-rtc false
sudo timedatectl

# Node.js
sudo curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
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

cd ~/build

export BLEND_VERSION=$(cat package.json | jq '.version' -r)
yarn install --ignore-engines
yarn build:src
./node_modules/.bin/pkg . --targets node10-linux-x64 --options trace-warnings

cd ~/

mkdir -p blend/DEBIAN

cat <<EOF >> blend/DEBIAN/control
Package: blend
Architecture: all
Maintainer: @wehriam
Priority: optional
Version: $BLEND_VERSION
Description: Blend
Depends: libsdl2-2.0-0 (>= 2.0.4), libsdl2-image-2.0-0 (>= 2.0.1), libsndio6.1 (>= 1.1.0-2)
EOF

mkdir -p blend/etc/blend

cp ~/build/blend ~/blend/etc/blend/
cp -r ~/build/dist-www ~/blend/etc/blend/dist-www
cp -r ~/build/static ~/blend/etc/blend/static
cp -r ~/build/scripts ~/blend/etc/blend/scripts
cp ~/build/node_modules/@serialport/bindings/build/Release/bindings.node ~/blend/etc/blend/bindings.node
cp ~/build/node_modules/sqlite3/lib/binding/node-v64-linux-x64/node_sqlite3.node ~/blend/etc/blend/node_sqlite3.node
cp ~/build/node_modules/ffi/build/Release/ffi_bindings.node ~/blend/etc/blend/ffi_bindings.node
cp ~/build/node_modules/leveldown/prebuilds/linux-x64/node.napi.musl.node ~/blend/etc/blend/node.napi.musl.node
cp ~/build/node_modules/leveldown/prebuilds/linux-x64/node.napi.node ~/blend/etc/blend/node.napi.node
cp ~/build/node_modules/ref/build/Release/binding.node ~/blend/etc/blend/binding.node
cp ~/build/dist/sample.mp4 ~/blend/etc/blend/sample.mp4
cp ~/build/node_modules/@bunchtogether/ffmpeg-static/bin/linux/x64/ffmpeg ~/blend/etc/blend/ffmpeg

cat <<EOF >> blend/etc/blend/blend.defaults
# Default blend environment variables. It should be sourced via shell

# Node Environment
NODE_ENV=production

# logging level
LOG_LEVEL=debug

# Blend hls segments output directory
# BLEND_OUTPUT_PATH=/blend

EOF

cat <<EOF >> blend/etc/blend/blend.service
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
PIDFile=/etc/blend/blend.pid
Restart=always
WorkingDirectory=/etc/blend
ExecStart=/etc/blend/blend
KillMode=process

[Install]
WantedBy=multi-user.target

EOF

cat <<EOF >> blend/DEBIAN/prerm
#!/bin/bash
sudo systemctl -q stop blend
sudo systemctl -q disable blend
sudo rm -rf /blend/etc/*
sudo rm /etc/systemd/system/blend.service
EOF
chmod 755 blend/DEBIAN/prerm

cat <<EOF >> blend/DEBIAN/preinst
#!/bin/bash
sudo systemctl -q stop blend
sudo rm -rf /blend/etc
EOF
chmod 755 blend/DEBIAN/preinst

cat <<EOF >> blend/DEBIAN/postinst
#!/bin/bash
sudo cp /etc/blend/blend.service /etc/systemd/system/blend.service
if [ -d "/blend" ]; then
    sed -i "s/.*BLEND_OUTPUT_PATH.*/BLEND_OUTPUT_PATH=\/blend/g" /etc/blend/blend.defaults
fi

if [ ! -f /etc/blend/config.json ]; then
    echo "{ \"ip\": \"\" }" > /etc/blend/config.json
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

sudo systemctl -q enable blend
sudo systemctl -q start blend
EOF
chmod 755 blend/DEBIAN/postinst

dpkg-deb --build blend
mv blend.deb blend.$BLEND_VERSION.deb

