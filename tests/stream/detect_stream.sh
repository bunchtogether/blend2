#!/bin/bash

rm generated_target.txt

ffprobe -i http://192.168.1.2/data.sdp -analyzeduration 1000000 -v quiet -show_streams > generated_target.txt

diff -y --suppress-common-lines target.txt generated_target.txt

# diff -u target.txt generated_target.txt | grep -E "^\+"