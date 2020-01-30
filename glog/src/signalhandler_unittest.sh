#! /bin/sh
#
# Copyright (c) 2008, Google Inc.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
# Author: Satoru Takabayashi
#
# Unit tests for signalhandler.cc.

die () {
    echo $1
    exit 1
}

BINDIR=".libs"
LIBGLOG="$BINDIR/libglog.so"

BINARY="$BINDIR/signalhandler_unittest"
LOG_INFO="./signalhandler_unittest.INFO"

# Remove temporary files.
rm -f signalhandler.out*

if test -e "$BINARY"; then
  # We need shared object.
  export LD_LIBRARY_PATH=$BINDIR
  export DYLD_LIBRARY_PATH=$BINDIR
else
  # For windows
  BINARY="./signalhandler_unittest.exe"
  if ! test -e "$BINARY"; then
    echo "We coundn't find demangle_unittest binary."
    exit 1
  fi
fi

if [ x`$BINARY` != 'xOK' ]; then
  echo "PASS (No stacktrace support. We don't run this test.)"
  exit 0
fi

# The PC cannot be obtained in signal handlers on PowerPC correctly.
# We just skip the test for PowerPC.
if [ x`uname -p` = x"powerpc" ]; then
  echo "PASS (We don't test the signal handler on PowerPC.)"
  exit 0
fi

# Test for a case the program kills itself by SIGSEGV.
GOOGLE_LOG_DIR=. $BINARY segv 2> signalhandler.out1
for pattern in SIGSEGV 0xdead main "Aborted at [0-9]"; do
  if ! grep --quiet "$pattern" signalhandler.out1; then
    die "'$pattern' should appear in the output"
  fi
done
if ! grep --quiet "a message before segv" $LOG_INFO; then
  die "'a message before segv' should appear in the INFO log"
fi
rm -f $LOG_INFO

# Test for a case the program is killed by this shell script.
# $! = the process id of the last command run in the background.
# $$ = the process id of this shell.
$BINARY loop 2> signalhandler.out2 &
# Wait until "looping" is written in the file.  This indicates the program
# is ready to accept signals.
while true; do
  if grep --quiet looping signalhandler.out2; then
    break
  fi
done
kill -TERM $!
wait $!

from_pid=''
# Only linux has the process ID of the signal sender.
if [ x`uname` = "xLinux" ]; then
  from_pid="from PID $$"
fi
for pattern in SIGTERM "by PID $!" "$from_pid" main "Aborted at [0-9]"; do
  if ! grep --quiet "$pattern" signalhandler.out2; then
    die "'$pattern' should appear in the output"
  fi
done

# Test for a case the program dies in a non-main thread.
$BINARY die_in_thread 2> signalhandler.out3
EXPECTED_TID="`sed 's/ .*//; q' signalhandler.out3`"

for pattern in SIGFPE DieInThread "TID $EXPECTED_TID" "Aborted at [0-9]"; do
  if ! grep --quiet "$pattern" signalhandler.out3; then
    die "'$pattern' should appear in the output"
  fi
done

# Test for a case the program installs a custom failure writer that writes
# stuff to stdout instead of stderr.
$BINARY dump_to_stdout 1> signalhandler.out4
for pattern in SIGABRT main "Aborted at [0-9]"; do
  if ! grep --quiet "$pattern" signalhandler.out4; then
    die "'$pattern' should appear in the output"
  fi
done

echo PASS
