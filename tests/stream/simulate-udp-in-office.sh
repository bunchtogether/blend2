#!/bin/bash

function rand {
    shuf -i $1-$2 -n 1
}

function sleep_for {
    sleep $1s
}

FFMPEG_COMMAND="ffmpeg \
  -re -f lavfi -i testsrc=rate=60:size=1280x720,format=yuv420p \
  -re -f lavfi -i sine=frequency=100:sample_rate=48000:beep_factor=4 \
  -c:v libx264 \
  -crf:v 22 \
  -profile:v high \
  -level 3.2 \
  -pix_fmt yuv420p \
  -x264opts keyint=60:no-scenecut=1 \
  -g 60 \
  -c:a aac \
  -profile:a aac_low \
  -ac 2 \
  -b:a 96k \
  -flags +global_header \
  -f mpegts udp://10.0.1.16:7020"

while true; do
    $FFMPEG_COMMAND &
    curr_pid=$!
    echo "PID $curr_pid"

    sleep 2

    # Sleep for 10-30 secs
    run_time=$(rand 30 60)
    echo "Running process for $run_time secs"
    sleep_for $run_time

    # See if the command is still running, and kill it and sleep more if it is:
    if ps -p $curr_pid -o comm= | grep -s 'ffmpeg'; then
        kill -9 $curr_pid 2> /dev/null
        sleep_time=$(rand 30 90)
        echo "Waiting to restart the stream after $sleep_time secs"
        sleep_for $sleep_time
    fi
done