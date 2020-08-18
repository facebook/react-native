#!/usr/bin/env bash

BUILD_DEPS_DIR=build_deps

rm -rf $BUILD_DEPS_DIR
mkdir $BUILD_DEPS_DIR

mkdir $BUILD_DEPS_DIR/boost_1_68_0
ln -s "$PWD/ReactAndroid/packages/boost.1.68.0.0/lib/native/include/boost" "$BUILD_DEPS_DIR/boost_1_68_0/boost"

ln -s "$PWD/Folly" "$BUILD_DEPS_DIR/folly-2018.10.22.00"

mkdir $BUILD_DEPS_DIR/double-conversion-1.1.6
ln -s "$PWD/double-conversion/double-conversion" "$BUILD_DEPS_DIR/double-conversion-1.1.6/src"

ln -s "$PWD/glog" "$BUILD_DEPS_DIR/glog-0.3.5"

# export REACT_NATIVE_BOOST_PATH=$BUILD_DEPS_DIR