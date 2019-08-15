#!/bin/bash

set -e

sudo apt-get update -y
sudo apt install apt-offline zip -y

if [ ! -d "~/bundle" ]; then
    mkdir -p ~/bundle
fi

cd ~/build
export BLEND_VERSION=$(cat package.json | jq '.version' -r)

# Bundle blend dependencies
cd ~/bundle
sudo apt-offline set ~/bundle/blend-bundle.sig --install-packages libsdl2-2.0-0 libsdl2-image-2.0-0 libsndio6.1
sudo apt-offline get ~/bundle/blend-bundle.sig --bundle blend-bundle.zip

# Add blend to bundle
sudo cp ~/blend.$BLEND_VERSION.deb ~/bundle/blend.$BLEND_VERSION.deb
sudo zip -u ~/bundle/blend-bundle.zip blend.$BLEND_VERSION.deb
sudo rm ~/bundle/blend.$BLEND_VERSION.deb
sudo mv ~/bundle/blend-bundle.zip ~/blend-bundle-$BLEND_VERSION.zip