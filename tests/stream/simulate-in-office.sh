#!/bin/bash

function rand {
    shuf -i $1-$2 -n 1
}

function sleep_for {
    sleep $1s
}

# RTP runs video, audio streams on different ports
FFMPEG_COMMAND="ffmpeg -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
    -strict -2 \
    -vcodec h264_videotoolbox \
    -pix_fmt yuv420p \
    -b:v 3500k \
    -minrate:v 3500k \
    -maxrate:v 3500k \
    -bufsize:v 4800k \
    -g 60 \
    -an \
    -f rtp rtp://10.0.1.100:7010 \
    -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
    -strict -2 \
    -acodec aac \
    -ac 2 \
    -b:a 96k \
    -maxrate:a 96k \
    -bufsize:a 192k \
    -vn \
    -flags +global_header \
    -f rtp rtp://10.0.1.100:7020"


while true; do
    $FFMPEG_COMMAND &
    curr_pid=$!
    echo "PID $curr_pid"

    sleep 2

    # Sleep for 300-600 secs
    run_time=$(rand 10 30)
    echo "Running process for $run_time secs"
    sleep_for $run_time

    # See if the command is still running, and kill it and sleep more if it is:
    if ps -p $curr_pid -o comm= | grep -s 'ffmpeg'; then
        kill -9 $curr_pid 2> /dev/null
        sleep_time=$(rand 1 4)
        echo "Waiting to restart the stream after $sleep_time secs"
        sleep_for $sleep_time
    fi
done