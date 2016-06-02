// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <fb/fbjni.h>
#include <folly/dynamic.h>
#include <folly/json.h>

namespace facebook {
namespace react {

class NativeMap : public jni::HybridClass<NativeMap> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/NativeMap;";

  explicit NativeMap(folly::dynamic s) : isConsumed(false), map_(s) {}

  std::string toString();

  bool isConsumed;
  void throwIfConsumed();

  static void registerNatives();
 protected:

  folly::dynamic map_;

  friend HybridBase;
  friend class ReadableNativeMapKeySetIterator;
};

}  // namespace react
}  // namespace facebook
