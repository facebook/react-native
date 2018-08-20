// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <fb/fbjni.h>
#include <folly/dynamic.h>

#include "NativeCommon.h"

namespace facebook {
namespace react {

class NativeMap : public jni::HybridClass<NativeMap> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/NativeMap;";

  std::string toString();

  RN_EXPORT folly::dynamic consume();

  // Whether this map has been added to another array or map and no longer
  // has a valid map value.
  bool isConsumed;
  void throwIfConsumed();

  static void registerNatives();

 protected:
  folly::dynamic map_;

  friend HybridBase;
  friend struct ReadableNativeMapKeySetIterator;
  explicit NativeMap(folly::dynamic s) : isConsumed(false), map_(s) {}
};

}  // namespace react
}  // namespace facebook
