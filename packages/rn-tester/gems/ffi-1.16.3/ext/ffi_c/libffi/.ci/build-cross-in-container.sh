#!/bin/bash
set -x

cd /opt

echo $PATH
export PATH=/usr/local/bin:$PATH
echo $PATH

export DEJAGNU=$(pwd)/.ci/site.exp
echo $DEJAGNU
ls -l $DEJAGNU
pwd
find .
./configure --host=${HOST} || cat */config.log
make
make dist
BOARDSDIR=$(pwd)/.ci make check RUNTESTFLAGS="-a $RUNTESTFLAGS" || true
