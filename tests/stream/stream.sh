#!/bin/bash

ffmpeg \
  -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
  -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
  -c:v libx264 \
  -crf:v 22 \
  -profile:v high \
  -level 3.2 \
  -pix_fmt yuv420p \
  -x264opts keyint=60:no-scenecut=1 \
  -maxrate:v 2000k \
  -bufsize:v 4800k \
  -g 60 \
  -c:a aac \
  -profile:a aac_low \
  -ac 2 \
  -b:a 96k \
  -maxrate:a 96k \
  -bufsize:a 192k \
  -ss 0 \
  -flags +global_header \
  -movflags +faststart \
  -sdp_file data.sdp \
  -f rtp_mpegts rtp://10.0.1.28:55555