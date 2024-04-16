#!/bin/bash

set -x

# Special build tools are here...
export PATH=$HOME/i/bin:$PATH

# This is a policy bound API key.  It can only be used with
# https://github.com/libffi/rlgl-policy.git.
RLGL_KEY=0LIBFFI-0LIBFFI-0LIBFFI-0LIBFFI

if [ -z ${QEMU_CPU+x} ]; then
    export SET_QEMU_CPU=
else
    export SET_QEMU_CPU="-e QEMU_CPU=${QEMU_CPU}"
fi

export DOCKER=docker

function build_linux()
{
    ./autogen.sh
    ./configure ${HOST+--host=$HOST} ${CONFIGURE_OPTIONS} || cat */config.log
    make
    make dist
    DEJAGNU=$(pwd)/.ci/site.exp BOARDSDIR=$(pwd)/.ci runtest --version
    DEJAGNU=$(pwd)/.ci/site.exp BOARDSDIR=$(pwd)/.ci make check RUNTESTFLAGS="-a $RUNTESTFLAGS"

    ./rlgl l --key=${RLGL_KEY} https://rl.gl
    ./rlgl e -l project=libffi -l sha=${GITHUB_SHA:0:7} -l CC='$CC' ${HOST+-l host=$HOST} --policy=https://github.com/libffi/rlgl-policy.git */testsuite/libffi.log
    exit $?
}

function build_foreign_linux()
{
    ${DOCKER} run --rm -t -v $(pwd):/opt ${SET_QEMU_CPU} -e LIBFFI_TEST_OPTIMIZATION="${LIBFFI_TEST_OPTIMIZATION}" $2 bash -c /opt/.ci/build-in-container.sh

    ./rlgl l --key=${RLGL_KEY} https://rl.gl
    ./rlgl e -l project=libffi -l sha=${GITHUB_SHA:0:7} -l CC="$CC" ${HOST+-l host=$HOST} --policy=https://github.com/libffi/rlgl-policy.git */testsuite/libffi.log
    exit $?
}

function build_cross_linux()
{
    ${DOCKER} run --rm -t -v $(pwd):/opt ${SET_QEMU_CPU} -e HOST="${HOST}" -e CC="${HOST}-gcc-8 ${GCC_OPTIONS}" -e CXX="${HOST}-g++-8 ${GCC_OPTIONS}" -e LIBFFI_TEST_OPTIMIZATION="${LIBFFI_TEST_OPTIMIZATION}" quay.io/moxielogic/cross-ci-build-container:latest bash -c /opt/.ci/build-in-container.sh

    ./rlgl l --key=${RLGL_KEY} https://rl.gl
    ./rlgl e -l project=libffi -l sha=${GITHUB_SHA:0:7} -l CC="${HOST}-gcc-8 ${GCC_OPTIONS}" -l host=${HOST} --policy=https://github.com/libffi/rlgl-policy.git */testsuite/libffi.log
    exit $?
}

function build_cross()
{
    ${DOCKER} pull quay.io/moxielogic/libffi-ci-${HOST}
    ${DOCKER} run --rm -t -v $(pwd):/opt -e HOST="${HOST}" -e CC="${HOST}-gcc ${GCC_OPTIONS}" -e CXX="${HOST}-g++ ${GCC_OPTIONS}" -e RUNNER_WORKSPACE=/opt -e RUNTESTFLAGS="-vv ${RUNTESTFLAGS}" -e LIBFFI_TEST_OPTIMIZATION="${LIBFFI_TEST_OPTIMIZATION}" quay.io/moxielogic/libffi-ci-${HOST} bash -c /opt/.ci/build-cross-in-container.sh

    ./rlgl l --key=${RLGL_KEY} https://rl.gl
    ./rlgl e -l project=libffi -l sha=${GITHUB_SHA:0:7} -l CC="${HOST}-gcc" -l host=$HOST --policy=https://github.com/libffi/rlgl-policy.git */testsuite/libffi.log
    exit $?
}

function build_ios()
{
    which python
# export PYTHON_BIN=/usr/local/bin/python
    ./generate-darwin-source-and-headers.py --only-ios
    xcodebuild -showsdks
    xcodebuild -project libffi.xcodeproj -target "libffi-iOS" -configuration Release -sdk iphoneos11.4
    exit $?
}

function build_macosx()
{
    which python
# export PYTHON_BIN=/usr/local/bin/python
    ./generate-darwin-source-and-headers.py --only-osx
    xcodebuild -showsdks
    xcodebuild -project libffi.xcodeproj -target "libffi-Mac" -configuration Release -sdk macosx10.13
    echo "Finished build"
    exit $?
}

case "$HOST" in
    arm-apple-darwin*)
	./autogen.sh
	build_ios
	;;
    x86_64-apple-darwin*)
	./autogen.sh
	build_macosx
	;;
    arm32v7-linux-gnu)
	./autogen.sh
        build_foreign_linux arm quay.io/moxielogic/arm32v7-ci-build-container:latest
	;;
    bfin-elf )
	./autogen.sh
	GCC_OPTIONS=-msim build_cross
	;;
    m32r-elf )
	./autogen.sh
	build_cross
	;;
    or1k-elf )
	./autogen.sh
	build_cross
	;;
    powerpc-eabisim )
	./autogen.sh
	build_cross
	;;
    m68k-linux-gnu )
	./autogen.sh
	GCC_OPTIONS=-mcpu=547x build_cross_linux
	;;
    alpha-linux-gnu | sh4-linux-gnu )
	./autogen.sh
	build_cross_linux
	;;
    *)
	./autogen.sh
	build_linux
	;;
esac
