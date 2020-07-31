#!/usr/bin/env bash

BUILD_DEPS_DIR=build_deps

rm -rf $BUILD_DEPS_DIR
mkdir $BUILD_DEPS_DIR

ln -s "$PWD/ReactAndroid/packages/boost.1.68.0.0/lib/native/include/boost" "$BUILD_DEPS_DIR/boost"
ln -s "$PWD/double-conversion/double-conversion" "$BUILD_DEPS_DIR/double-conversion"
ln -s "$PWD/Folly/" "$BUILD_DEPS_DIR/Folly"
ln -s "$PWD/glog/" "$BUILD_DEPS_DIR/glog" 