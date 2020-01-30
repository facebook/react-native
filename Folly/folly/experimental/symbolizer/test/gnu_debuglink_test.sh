#!/bin/bash

crash="$1"
rm -f "$crash."{debuginfo,strip}
objcopy --only-keep-debug "$crash" "$crash.debuginfo"
objcopy --strip-debug --add-gnu-debuglink="$crash.debuginfo" "$crash" "$crash.strip"

echo '{"op":"start","test":"gnu_debuglink_test"}';
start=$(date +%s)
if "$crash.strip" 2>&1 | grep 'Crash.cpp:[0-9]*$' > /dev/null; then
    result='"status":"passed"';
else
    result='"status":"failed"';
fi
end=$(date +%s)
echo '{"op":"test_done","test":"gnu_debuglink_test",'"$result"'}'
echo '{"op":"all_done","results":[{"name":"gnu_debuglink_test",'"$result"',"start_time":'"$start"',"end_time":'"$end"',"details":"nothing"}]}'
