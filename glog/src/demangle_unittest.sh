#! /bin/sh
#
# Copyright (c) 2006, Google Inc.
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
# Unit tests for demangle.c with a real binary.

set -e

die () {
    echo $1
    exit 1
}

BINDIR=".libs"
LIBGLOG="$BINDIR/libglog.so"

DEMANGLER="$BINDIR/demangle_unittest"

if test -e "$DEMANGLER"; then
  # We need shared object.
  export LD_LIBRARY_PATH=$BINDIR
  export DYLD_LIBRARY_PATH=$BINDIR
else
  # For windows
  DEMANGLER="./demangle_unittest.exe"
  if ! test -e "$DEMANGLER"; then
    echo "We coundn't find demangle_unittest binary."
    exit 1
  fi
fi

# Extract C++ mangled symbols from libbase.so.
NM_OUTPUT="demangle.nm"
nm "$LIBGLOG" | perl -nle 'print $1 if /\s(_Z\S+$)/' > "$NM_OUTPUT"

# Check if mangled symbols exist. If there are none, we quit.
# The binary is more likely compiled with GCC 2.95 or something old.
if ! grep --quiet '^_Z' "$NM_OUTPUT"; then
    echo "PASS"
    exit 0
fi

# Demangle the symbols using our demangler.
DM_OUTPUT="demangle.dm"
GLOG_demangle_filter=1 "$DEMANGLER" --demangle_filter < "$NM_OUTPUT" > "$DM_OUTPUT"

# Calculate the numbers of lines.
NM_LINES=`wc -l "$NM_OUTPUT" | awk '{ print $1 }'`
DM_LINES=`wc -l "$DM_OUTPUT" | awk '{ print $1 }'`

# Compare the numbers of lines.  They must be the same.
if test "$NM_LINES" != "$DM_LINES"; then
    die "$NM_OUTPUT and $DM_OUTPUT don't have the same numbers of lines"
fi

# Check if mangled symbols exist.  They must not exist.
if grep --quiet '^_Z' "$DM_OUTPUT"; then
    MANGLED=`grep '^_Z' "$DM_OUTPUT" | wc -l | awk '{ print \$1 }'`
    echo "Mangled symbols ($MANGLED out of $NM_LINES) found in $DM_OUTPUT:"
    grep '^_Z' "$DM_OUTPUT"
    die "Mangled symbols ($MANGLED out of $NM_LINES) found in $DM_OUTPUT"
fi

# All C++ symbols are demangled successfully.
echo "PASS"
exit 0
