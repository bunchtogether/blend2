#!/bin/bash

BLEND_INSTALLTION_DIR="/etc/blend"
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
journalctl -u blend > $LOGS_DIR_NAME/blend.log

# System logs
[ ! -d $LOGS_DIR_NAME/system_logs ] && mkdir -p $LOGS_DIR_NAME/system_logs
cp -r /var/log/* $LOGS_DIR_NAME/system_logs

# Network Config
if [ $(which ip) ]; then
    ip addr >> $LOGS_DIR_NAME/network_interfaces
fi

# Open ports
if [ $(which lsof) ]; then
    lsof -i -P -n -l > $LOGS_DIR_NAME/network_connections.log
    lsof -P -n -l -iUDP > $LOGS_DIR_NAME/udp_ports.log
    lsof -P -n -l -i -sTCP:LISTEN > $LOGS_DIR_NAME/tcp_ports.log
fi

# Disk
if [ $(which lsblk) ];then
    echo -e "\nlsblk\n*****\n" >> $LOGS_DIR_NAME/disk.log
    lsblk >> $LOGS_DIR_NAME/disk.log
fi
if [ $(which df) ];then
    echo -e "\n\ndf -h\n*****\n" >> $LOGS_DIR_NAME/disk.log
    df -h >> $LOGS_DIR_NAME/disk.log
fi

# Session Info
[ $(which last) ] && last >> $LOGS_DIR_NAME/session.log

# Process list
[ $(which top) ] && top -b -n 1 > $LOGS_DIR_NAME/process.log

[ -f /proc/loadavg ] && cat /proc/loadavg > $LOGS_DIR_NAME/loadavg

# Archive logs
if [ $(which zip) ]; then
    zip $ZIP_PATH -r $LOGS_DIR_NAME
fi

rm -rf $LOGS_DIR_NAME
echo $ZIP_PATH