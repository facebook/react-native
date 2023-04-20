/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "WritableNativeMap.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

WritableNativeMap::WritableNativeMap() : HybridBase(folly::dynamic::object()) {}

WritableNativeMap::WritableNativeMap(folly::dynamic &&val)
    : HybridBase(std::move(val)) {
  if (!map_.isObject()) {
    throw std::runtime_error("WritableNativeMap value must be an object.");
  }
}

local_ref<WritableNativeMap::jhybriddata> WritableNativeMap::initHybrid(
    alias_ref<jclass>) {
  return makeCxxInstance();
}

void WritableNativeMap::putNull(std::string key) {
  throwIfConsumed();
  map_.insert(std::move(key), nullptr);
}

void WritableNativeMap::putBoolean(std::string key, bool val) {
  throwIfConsumed();
  map_.insert(std::move(key), val);
}

void WritableNativeMap::putDouble(std::string key, double val) {
  throwIfConsumed();
  map_.insert(std::move(key), val);
}

void WritableNativeMap::putInt(std::string key, int val) {
  throwIfConsumed();
  map_.insert(std::move(key), val);
}

void WritableNativeMap::putString(std::string key, alias_ref<jstring> val) {
  if (!val) {
    putNull(std::move(key));
    return;
  }
  throwIfConsumed();
  map_.insert(std::move(key), val->toString());
}

void WritableNativeMap::putNativeArray(
    std::string key,
    ReadableNativeArray *otherArray) {
  if (!otherArray) {
    putNull(std::move(key));
    return;
  }
  throwIfConsumed();
  map_.insert(key, otherArray->consume());
}

void WritableNativeMap::putNativeMap(
    std::string key,
    ReadableNativeMap *otherMap) {
  if (!otherMap) {
    putNull(std::move(key));
    return;
  }
  throwIfConsumed();
  map_.insert(std::move(key), otherMap->consume());
}

void WritableNativeMap::mergeNativeMap(ReadableNativeMap *other) {
  throwIfConsumed();
  other->throwIfConsumed();

  for (auto sourceIt : other->map_.items()) {
    map_[sourceIt.first] = sourceIt.second;
  }
}

void WritableNativeMap::registerNatives() {
  registerHybrid({
      makeNativeMethod("putNull", WritableNativeMap::putNull),
      makeNativeMethod("putBoolean", WritableNativeMap::putBoolean),
      makeNativeMethod("putDouble", WritableNativeMap::putDouble),
      makeNativeMethod("putInt", WritableNativeMap::putInt),
      makeNativeMethod("putString", WritableNativeMap::putString),
      makeNativeMethod("putNativeArray", WritableNativeMap::putNativeArray),
      makeNativeMethod("putNativeMap", WritableNativeMap::putNativeMap),
      makeNativeMethod("mergeNativeMap", WritableNativeMap::mergeNativeMap),
      makeNativeMethod("initHybrid", WritableNativeMap::initHybrid),
  });
}

} // namespace react
} // namespace facebook
