#!/bin/bash

# Unicast

# ffmpeg -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
#   -vcodec libx264 \
#   -profile:v high \
#   -level 3.2 \
#   -pix_fmt yuv420p \
#   -x264opts keyint=60:no-scenecut=1:nal-hrd=cbr:force-cfr=1:repeat-headers=1 \
#   -b:v 3500k \
#   -minrate:v 3500k \
#   -maxrate:v 3500k \
#   -bufsize:v 4800k \
#   -g 60 \
#   -an \
#   -f rtp rtp://10.0.1.13:6970 \
#   -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
#   -acodec aac \
#   -ac 2 \
#   -b:a 96k \
#   -maxrate:a 96k \
#   -bufsize:a 192k \
#   -vn \
#   -sdp_file data.sdp \
#   -f rtp rtp://10.0.1.13:6980

# Multicast RTP

ffmpeg -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
  -vcodec libx264 \
  -profile:v high \
  -level 3.2 \
  -pix_fmt yuv420p \
  -x264opts keyint=60:no-scenecut=1:nal-hrd=cbr:force-cfr=1:repeat-headers=1 \
  -b:v 3500k \
  -minrate:v 3500k \
  -maxrate:v 3500k \
  -bufsize:v 4800k \
  -g 60 \
  -an \
  -f rtp rtp://224.0.0.251:6970 \
  -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
  -acodec aac \
  -ac 2 \
  -b:a 96k \
  -maxrate:a 96k \
  -bufsize:a 192k \
  -vn \
  -sdp_file data.sdp \
  -f rtp rtp://224.0.0.251:6980