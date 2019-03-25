#!/bin/bash

set -e

export BLEND_VERSION=$(cat ../../package.json | jq '.version' -r)
export SERVER_IP=10.0.1.193

mkdir -p ../../installers
rm ../../installers/blend.$BLEND_VERSION.deb | true

ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no  ubuntu@$SERVER_IP "sudo apt remove blend -y ; rm -rf ~/build; rm -rf ~/blend; mkdir -p ~/build"
scp -r -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ../../src ubuntu@$SERVER_IP:~/build/src
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ../../package.json ubuntu@$SERVER_IP:~/build/package.json
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ../../webpack.config.js ubuntu@$SERVER_IP:~/build/webpack.config.js
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ../../.babelrc ubuntu@$SERVER_IP:~/build/.babelrc
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ./create-package.sh ubuntu@$SERVER_IP:~/create-package.sh
ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "chmod 777 ~/create-package.sh; cd ~/; ./create-package.sh;"
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ubuntu@$SERVER_IP:~/blend.$BLEND_VERSION.deb ../../installers
ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "sudo apt install -y ~/blend.$BLEND_VERSION.deb"
