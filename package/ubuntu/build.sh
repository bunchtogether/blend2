#!/bin/bash

set -e

export BLEND_VERSION=$(cat ../../package.json | jq '.version' -r)
export BUILDER_IP_ADDRESS=10.0.1.193
export BUILDER_PORT=22

header() {
  echo ""
  echo -e "${cyan}+----------------------------+ ${reset}"
  echo -e "${cyan}|    ${yellow}Blend Builder v$BLEND_VERSION ${cyan}   |${reset}"
  echo -e "${cyan}+----------------------------+${reset}"
  echo ""
}


usage() { echo -e "Usage: $0 [-i 127.0.0.1] [-p 22]\n\t-i\tBuilder IP <127.0.0.1>\n\t-p\tBuilder SSH port <22>\n" 1>&2; exit 1; }

header
while getopts ":i:p:h" o; do
    case "${o}" in
        i)
            BUILDER_IP_ADDRESS=${OPTARG}
            ;;
        p)
            BUILDER_PORT=${OPTARG}
            ;;
        h | *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))
# echo $BUILDER_IP_ADDRESS $BUILDER_PORT

mkdir -p ../../installers
rm ../../installers/blend.$BLEND_VERSION.deb | true

ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -p $BUILDER_PORT  ubuntu@$BUILDER_IP_ADDRESS "sudo apt remove blend -y ; rm -rf ~/build; rm -rf ~/blend; mkdir -p ~/build"
scp -r -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ../../src ubuntu@$BUILDER_IP_ADDRESS:~/build/src
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ../../package.json ubuntu@$BUILDER_IP_ADDRESS:~/build/package.json
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ../../webpack.config.js ubuntu@$BUILDER_IP_ADDRESS:~/build/webpack.config.js
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ../../.babelrc ubuntu@$BUILDER_IP_ADDRESS:~/build/.babelrc
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ./create-package.sh ubuntu@$BUILDER_IP_ADDRESS:~/create-package.sh
ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -p $BUILDER_PORT ubuntu@$BUILDER_IP_ADDRESS "chmod 777 ~/create-package.sh; cd ~/; ./create-package.sh;"
scp -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -P $BUILDER_PORT ubuntu@$BUILDER_IP_ADDRESS:~/blend.$BLEND_VERSION.deb ../../installers
ssh -i ./credentials/ubuntu_vm_id_rsa -o StrictHostKeyChecking=no -p $BUILDER_PORT ubuntu@$BUILDER_IP_ADDRESS "sudo apt install -y ~/blend.$BLEND_VERSION.deb"
