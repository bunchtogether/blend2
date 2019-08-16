#!/bin/bash

BLEND_INSTALLTION_DIR="/usr/local/blend"
LOGS_DIR_NAME_SUFFIX=$(date +%s)
LOGS_DIR_NAME="/tmp/logs_$LOGS_DIR_NAME_SUFFIX"
ZIP_ARCHIVE_NAME="logs_$LOGS_DIR_NAME_SUFFIX.zip"
if [ "$#" -eq 1 ]; then
    ZIP_ARCHIVE_NAME=$1
fi
ZIP_PATH="/tmp/$ZIP_ARCHIVE_NAME"

[ ! -d $LOGS_DIR_NAME ] && mkdir -p $LOGS_DIR_NAME

# Blend metadata
[ -f $BLEND_INSTALLTION_DIR/VERSION ] && cp $BLEND_INSTALLTION_DIR/VERSION $LOGS_DIR_NAME/VERSION

# Blend logs
cp /usr/local/blend/blend.log $LOGS_DIR_NAME/blend.log

# System logs
[ ! -d $LOGS_DIR_NAME/system_logs ] && mkdir -p $LOGS_DIR_NAME/system_logs
cp -r /var/log/* $LOGS_DIR_NAME/system_logs

# Network Config
if [ $(which ifconfig) ]; then
    ifconfig >> $LOGS_DIR_NAME/network_interfaces
fi

# Open ports
if [ $(which lsof) ]; then
    lsof -i -P -n > $LOGS_DIR_NAME/network_connections.log
fi

# Disk
if [ $(which diskutil) ];then
    echo -e "\diskutil\n*****\n" >> $LOGS_DIR_NAME/disk.log
    diskutil list >> $LOGS_DIR_NAME/disk.log
fi
if [ $(which df) ];then
    echo -e "\n\ndf -h\n*****\n" >> $LOGS_DIR_NAME/disk.log
    df -h >> $LOGS_DIR_NAME/disk.log
fi

# Session Info
[ $(which last) ] && last >> $LOGS_DIR_NAME/session.log

# Process list
[ $(which top) ] && top -f -l 1 >> $LOGS_DIR_NAME/process.log

[ $(which sysctl) ] && sysctl -n vm.loadavg >> $LOGS_DIR_NAME/loadavg

# Archive logs
if [ $(which zip) ]; then
    zip $ZIP_PATH -r $LOGS_DIR_NAME
fi

rm -rf $LOGS_DIR_NAME
echo "FILENAME:$ZIP_PATH"