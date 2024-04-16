#!/bin/bash
set -x

export QEMU_LD_PREFIX=/usr/${HOST}
export DEJAGNU=/opt/.ci/site.exp
cd /opt
./configure ${HOST+--host=$HOST --disable-shared}
make
make dist
BOARDSDIR=/opt/.ci make check RUNTESTFLAGS="-a $RUNTESTFLAGS" || true
