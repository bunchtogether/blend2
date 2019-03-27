#!/bin/bash

set -e

sudo apt-get update -y

sudo apt-get install -y tlsdate

sudo timedatectl --adjust-system-clock set-local-rtc true
sudo timedatectl set-ntp true
sudo tlsdate -s -H mail.google.com
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
yarn build
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
EOF

mkdir -p blend/etc/blend

cp ~/build/blend ~/blend/etc/blend/
cp ~/build/dist/sample.mp4 ~/blend/etc/blend/sample.mp4
cp ~/build/node_modules/farmhash/build/Release/farmhash.node ~/blend/etc/blend/
cp ~/build/node_modules/uWebSockets.js/uws_linux_64.node ~/blend/etc/blend/
cp ~/build/node_modules/@bunchtogether/ffmpeg-static/bin/linux/x64/ffmpeg ~/blend/etc/blend/ffmpeg

cat <<EOF >> blend/etc/blend/blend.defaults
# Default blend environment variables. It should be sourced via shell

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
sudo systemctl -q enable blend
sudo systemctl -q start blend
EOF
chmod 755 blend/DEBIAN/postinst

dpkg-deb --build blend
mv blend.deb blend.$BLEND_VERSION.deb

