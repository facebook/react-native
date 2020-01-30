#!/bin/bash

# Installs folly's dependencies to /usr/local on a clean Ubuntu 12.04 x64
# system.  Primarily intended for Travis CI, since most engineers don't run
# distributions this stale.
#
# WARNING: Uses 'sudo' to upgrade your system with impunity:
#  - Adds several PPAs for missing/outdated dependencies
#  - Installs several from-source dependencies in /usr/local
#
# Library sources & build files end up in folly/folly/deps/

set -ex

BUILD_DIR="$(readlink -f "$(dirname "$0")")"
mkdir -p "$BUILD_DIR/deps"
cd "$BUILD_DIR/deps"

sudo apt-get install -y python-software-properties  # for add-apt-repository
sudo add-apt-repository -y ppa:ubuntu-toolchain-r/test
sudo add-apt-repository -y ppa:boost-latest/ppa
sudo apt-get update

sudo apt-get install -y git gcc-4.8 g++-4.8 libboost1.54-dev autoconf git \
  libboost-thread1.54-dev libboost-filesystem1.54-dev libssl-dev \
  libsnappy-dev libboost-system1.54-dev libboost-regex1.54-dev make \
  libboost-context1.54-dev libtool libevent-dev libgtest-dev binutils-dev \
  libboost-program-options1.54-dev

# TODO: According to the folly docs, these system dependencies might be
# missing.  However, things seem to build fine...
#  automake autoconf-archive libboost-all-dev liblz4-dev liblzma-dev
#  zlib1g-dev libjemalloc-dev

sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.8 50
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-4.8 50

CMAKE_NAME=cmake-2.8.12.1
GFLAGS_VER=2.1.1
GLOG_NAME=glog-0.3.3
DC_VER=1.1.5
DC_NAME=double-conversion-${DC_VER}

# Newer cmake, since the system's 2.8.7 cmake is too old for gflags:
# https://groups.google.com/forum/#!topic/google-gflags/bu1iIDKn-ok
pushd .
wget --no-check-certificate http://www.cmake.org/files/v2.8/${CMAKE_NAME}.tar.gz \
    -O ${CMAKE_NAME}.tar.gz
tar xzf ${CMAKE_NAME}.tar.gz
cd ${CMAKE_NAME}
cmake .
make
CMAKE="$(readlink -f bin/cmake)"
popd

# double-conversion
pushd .
wget https://github.com/google/double-conversion/archive/v${DC_VER}.tar.gz \
    -O ${DC_NAME}.tar.gz
tar xzf ${DC_NAME}.tar.gz
cd ${DC_NAME}
"$CMAKE" -DBUILD_SHARED_LIBS=ON .  # Don't use scons instead, it's broken.
make
sudo make install
sudo ldconfig
popd

# gflags
pushd .
wget https://github.com/gflags/gflags/archive/v${GFLAGS_VER}.tar.gz \
  -O gflags-${GFLAGS_VER}.tar.gz
tar xzf gflags-${GFLAGS_VER}.tar.gz
mkdir -p gflags-${GFLAGS_VER}/build/ && cd gflags-${GFLAGS_VER}/build/
"$CMAKE" .. -DBUILD_SHARED_LIBS:BOOL=ON -DGFLAGS_NAMESPACE:STRING=google
make
sudo make install
sudo ldconfig
popd

# glog
pushd .
wget https://google-glog.googlecode.com/files/${GLOG_NAME}.tar.gz \
  -O ${GLOG_NAME}.tar.gz
tar xzf ${GLOG_NAME}.tar.gz
cd ${GLOG_NAME}
./configure
make
sudo make install
sudo ldconfig
popd
