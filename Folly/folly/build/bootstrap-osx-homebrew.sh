#!/bin/bash -x
# The only prerequisite should be homebrew. If something doesn't work out of
# the box with just homebrew, let's fix it.

# fail fast
set -e

BASE_DIR="$(cd "$(dirname -- "$0")"/.. ; pwd)"  # folly/folly
cd "$BASE_DIR"

# brew install alias
brew_install() {
    brew install $@ || brew upgrade $@
}

# install deps
install_deps() {
	# folly deps
	dependencies=(autoconf automake libtool pkg-config double-conversion glog gflags boost libevent xz snappy lz4 jemalloc openssl)

	# fetch deps
	for dependency in ${dependencies[@]}; do
		brew_install ${dependency}
	done
}

# set env flags
export_flags() {
	# fetch opt dirs
	OPT_GFLAGS=$(brew --prefix gflags)
	OPT_OPENSSL=$(brew --prefix openssl)

	# export flags
	export LDFLAGS=-L${OPT_OPENSSL}/lib
	export OPENSSL_INCLUDES=-I${OPT_OPENSSL}/include
	export GFLAGS_LIBS=-L${OPT_GFLAGS}/lib
	export GFLAGS_CFLAGS=-I${OPT_GFLAGS}/include
}

# now the fun part
install_deps
export_flags
autoreconf -ivf
./configure --disable-silent-rules --disable-dependency-tracking

# fetch googletest, if doesn't exist
pushd test
GTEST_VER=1.8.0
GTEST_DIR=gtest-${GTEST_VER}
if [ ! -d ${GTEST_DIR} ]; then
	mkdir ${GTEST_DIR}
    curl -SL \
    	https://github.com/google/googletest/archive/release-${GTEST_VER}.tar.gz | \
    	tar -xvzf - --strip-components=1 -C ${GTEST_DIR}
fi
popd

# make, test, install
make
make install
