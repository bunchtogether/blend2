#!/bin/bash

function rand {
    shuf -i $1-$2 -n 1
}

function sleep_for {
    sleep $1s
}

FFMPEG_BINARY="node_modules/@bunchtogether/ffmpeg-static/bin/darwin/x64/ffmpeg"

# MpegTS Stream
FFMPEG_COMMAND_MPEGTS="$FFMPEG_BINARY \
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
  -f rtp_mpegts $1"

# RTP runs video, audio streams on different ports
FFMPEG_COMMAND="$FFMPEG_BINARY \
    -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
    -strict -2 \
    -vcodec libx264 \
    -crf:v 22 \
    -profile:v high \
    -level 3.2 \
    -pix_fmt yuv420p \
    -x264opts keyint=60:repeat-headers=1 \
    -maxrate:v 2000k \
    -bufsize:v 4800k \
    -g 60 \
    -an \
    -f rtp $1 \
    -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
    -acodec aac \
    -profile:a aac_low \
    -ac 2 \
    -b:a 96k \
    -maxrate:a 96k \
    -bufsize:a 192k \
    -vn \
    -flags +global_header \
    -movflags +faststart \
    -sdp_file data.sdp \
    -f rtp $2"


while true; do
    $FFMPEG_COMMAND &
    curr_pid=$!
    echo "PID $curr_pid"

    # Sleep for 60-90 secs
    run_time=$(rand 5 180)
    echo "Running process for $run_time secs"
    sleep_for $run_time

    # See if the command is still running, and kill it and sleep more if it is:
    if ps -p $curr_pid -o comm= | grep -s 'ffmpeg'; then
        kill -9 $curr_pid 2> /dev/null
        sleep_time=$(rand 5 15)
        echo "Waiting to restart the stream after $sleep_time secs"
        sleep_for $sleep_time
    fi
done