#!/usr/bin/env bash

BUILD_DEPS_DIR=build_deps

rm -rf $BUILD_DEPS_DIR
mkdir $BUILD_DEPS_DIR

mkdir $BUILD_DEPS_DIR/boost_1_68_0
ln -s "$PWD/ReactAndroid/packages/boost.1.68.0.0/lib/native/include/boost" "$BUILD_DEPS_DIR/boost_1_68_0/boost"
# export REACT_NATIVE_BOOST_PATH=$BUILD_DEPS_DIR