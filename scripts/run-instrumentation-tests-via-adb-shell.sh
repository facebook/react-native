#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Python script to run instrumentation tests, copied from https://github.com/circleci/circle-dummy-android
# Example: ./scripts/run-android-instrumentation-tests.sh com.facebook.react.tests com.facebook.react.tests.ReactPickerTestCase
#
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

# clear the logs
adb logcat -c

# run tests and check output
python - $1 $2 << END

import re
import subprocess as sp
import sys
import threading
import time

done = False

test_app = sys.argv[1]
test_class = None

if len(sys.argv) > 2:
  test_class = sys.argv[2]

def update():
  # prevent CircleCI from killing the process for inactivity
  while not done:
    time.sleep(5)
    print "Running in background.  Waiting for 'adb' command response..."

t = threading.Thread(target=update)
t.dameon = True
t.start()

def run():
  sp.Popen(['adb', 'wait-for-device']).communicate()
  if (test_class != None):
    p = sp.Popen('adb shell am instrument -w -e class %s %s/androidx.test.runner.AndroidJUnitRunner'
      % (test_class, test_app), shell=True, stdout=sp.PIPE, stderr=sp.PIPE, stdin=sp.PIPE)
  else :
    p = sp.Popen('adb shell am instrument -w %s/androidx.test.runner.AndroidJUnitRunner'
      % (test_app), shell=True, stdout=sp.PIPE, stderr=sp.PIPE, stdin=sp.PIPE)
  return p.communicate()

success = re.compile(r'OK \(\d+ test(s)?\)')
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
