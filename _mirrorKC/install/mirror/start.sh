#!/bin/bash

# Start monitor.js and output to log
node /var/lib/mirror/monitor.js | tee -a /var/log/mirror.log &

# Start Python script
python3 /var/lib/mirror/script.py &

# Wait to prevent the container from exiting
wait -n
