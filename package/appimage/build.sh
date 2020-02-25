#!/bin/bash

set -e

red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
blue=`tput setaf 4`
magenta=`tput setaf 5`
cyan=`tput setaf 6`
reset=`tput sgr0`

BLEND_VERSION=$(cat ../../package.json | jq '.version' -r)
BUILDER_IP_ADDRESS=10.0.0.104
BUILDER_PORT=22
BUILDER_KEY=./credentials/ubuntu_vm_id_rsa
BUILD_DIR="/home/ubuntu/blend_build"

header() {
  echo ""
  echo -e "${cyan}+---------------------------------------+${reset}"
  echo -e "${cyan}|    ${yellow}Blend AppImage Builder${cyan}\t\t|${reset}"
  echo -e "${cyan}|    ${green}v$BLEND_VERSION ${reset} \t${magenta}$BUILDER_IP_ADDRESS${cyan}\t\t|${reset}"
  echo -e "${cyan}+---------------------------------------+${reset}"
  echo ""
}

usage() { echo -e "Usage: $0 [-i 127.0.0.1] [-p 22]\n\t-i\tBuilder IP <127.0.0.1>\n\t-p\tBuilder SSH port <22>\n" 1>&2; exit 1; }

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


sshexec() {
  ssh -i $BUILDER_KEY -o StrictHostKeyChecking=no -p $BUILDER_PORT  ubuntu@$BUILDER_IP_ADDRESS $1
}

sshcopy() {
  scp -r -i $BUILDER_KEY -o StrictHostKeyChecking=no -P $BUILDER_PORT $1 ubuntu@$BUILDER_IP_ADDRESS:$2
}

rsshcopy() {
  scp -r -i $BUILDER_KEY -o StrictHostKeyChecking=no -P $BUILDER_PORT ubuntu@$BUILDER_IP_ADDRESS:$1 $2
}

builderinfo() {
  sshexec "echo -e \"Builder Info:\"; uname -a; echo -e \"\n\""
}

prebuild() {
  local currDir=$(pwd)
  cd ../../
  mkdir -p installers

  # Build src, src-www
  yarn build

  cd $currDir
}

build() {
  sshexec "sudo rm -rf $BUILD_DIR; mkdir -p $BUILD_DIR/vendor;"
  sshcopy ../../src $BUILD_DIR/src
  sshcopy ../../dist-www $BUILD_DIR/dist-www
  sshcopy ../../dist-startup-www $BUILD_DIR/dist-startup-www
  sshcopy ../../static $BUILD_DIR/static
  sshcopy ../../scripts $BUILD_DIR/scripts
  sshcopy ../../vendor/zoom-rooms-control-system $BUILD_DIR/vendor/zoom-rooms-control-system
  sshcopy ../../package.json $BUILD_DIR/package.json
  sshcopy ./create-package.sh $BUILD_DIR/create-package.sh
  sshcopy ./blend.png $BUILD_DIR/blend.png
  sshcopy ./bundle.sh $BUILD_DIR/bundle.sh
  sshexec "chmod +x $BUILD_DIR/create-package.sh; cd $BUILD_DIR; sudo ./create-package.sh"
  sshexec "chmod +x $BUILD_DIR/bundle.sh; cd $BUILD_DIR; sudo ./bundle.sh"
}

download() {
  [ -f ../../installers/blend.$BLEND_VERSION.AppImage ] && rm -rf ../../installers/blend.$BLEND_VERSION.AppImage
  rsshcopy $BUILD_DIR/blend-$BLEND_VERSION.AppImage ../../installers
}

postbuild() {
  sshexec "sudo rm -rf $BUILD_DIR"
  sshexec "sudo rm -rf ~/blend.$BLEND_VERSION.AppImage"
}


header
builderinfo
prebuild
build
download
postbuild
