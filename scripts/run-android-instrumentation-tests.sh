#!/bin/bash

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

# clear the logs
adb logcat -c

# run tests and check output
python - $1 << END
import re
import subprocess as sp
import sys
import threading
import time

done = False
test_app = sys.argv[1]

def update():
  # prevent CircleCI from killing the process for inactivity
  while not done:
    time.sleep(5)
    print "Running in background.  Waiting for 'adb' command reponse..."

t = threading.Thread(target=update)
t.dameon = True
t.start()

def run():
  sp.Popen(['adb', 'wait-for-device']).communicate()
  p = sp.Popen('adb shell am instrument -w %s/android.support.test.runner.AndroidJUnitRunner' % test_app,
               shell=True, stdout=sp.PIPE, stderr=sp.PIPE, stdin=sp.PIPE)
  return p.communicate()

success = re.compile(r'OK \(\d+ tests\)')
stdout, stderr = run()

done = True
print stderr
print stdout

if success.search(stderr + stdout):
  sys.exit(0)
else:
  # dump the logs
  sp.Popen(['adb', 'logcat', '-d']).communicate()
  sys.exit(1) # make sure we fail if the test failed
END

RETVAL=$?

exit $RETVAL
