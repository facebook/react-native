#! /bin/sh
#
# Copyright (c) 2007, Google Inc.
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
# Author: Sergey Ioffe

get_strings () {
    if test -e ".libs/$1"; then
        binary=".libs/$1"
    elif test -e "$1.exe"; then
        binary="$1.exe"
    else
        echo "We coundn't find $1 binary."
        exit 1
    fi
    
    strings -n 10 $binary | sort | awk '/TESTMESSAGE/ {printf "%s ", $2}'
}

# Die if "$1" != "$2", print $3 as death reason
check_eq () {
    if [ "$1" != "$2" ]; then
        echo "Check failed: '$1' == '$2' ${3:+ ($3)}"
        exit 1
    fi
}

die () {
    echo $1
    exit 1
}

# Check that the string literals are appropriately stripped. This will
# not be the case in debug mode.

mode=`GLOG_check_mode=1 ./logging_striptest0 2> /dev/null`
if [ "$mode" = "opt" ];
then
    echo "In OPT mode"
    check_eq "`get_strings logging_striptest0`" "COND ERROR FATAL INFO USAGE WARNING "
    check_eq "`get_strings logging_striptest2`" "COND ERROR FATAL USAGE "
    check_eq "`get_strings logging_striptest10`" "" 
else
    echo "In DBG mode; not checking strings"
fi

# Check that LOG(FATAL) aborts even for large STRIP_LOG

./logging_striptest2 2>/dev/null && die "Did not abort for STRIP_LOG=2"
./logging_striptest10 2>/dev/null && die "Did not abort for STRIP_LOG=10"

echo "PASS"
