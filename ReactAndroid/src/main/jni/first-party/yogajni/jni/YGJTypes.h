/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <fb/fbjni.h>
#include <yoga/YGValue.h>
#include <yoga/Yoga.h>
#include <map>

using namespace facebook::jni;
using namespace std;

struct JYogaNode : public facebook::jni::JavaClass<JYogaNode> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaNodeJNIBase;";

  jfloat baseline(jfloat width, jfloat height);
  jlong measure(jfloat width, jint widthMode, jfloat height, jint heightMode);
};

struct JYogaLogLevel : public facebook::jni::JavaClass<JYogaLogLevel> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogLevel;";

  static facebook::jni::local_ref<JYogaLogLevel> fromInt(jint);
};

struct JYogaLogger : public facebook::jni::JavaClass<JYogaLogger> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogger";

  void log(
      facebook::jni::alias_ref<JYogaNode>,
      facebook::jni::alias_ref<JYogaLogLevel>,
      jstring);
};

class PtrJNodeMap {
  using JNodeArray = JArrayClass<JYogaNode::javaobject>;
  std::map<YGNodeRef, size_t> ptrsToIdxs_;
  alias_ref<JNodeArray> javaNodes_;

public:
  PtrJNodeMap() : ptrsToIdxs_{}, javaNodes_{} {}
  PtrJNodeMap(
      alias_ref<JArrayLong> nativePointers,
      alias_ref<JNodeArray> javaNodes)
      : javaNodes_{javaNodes} {
    auto pin = nativePointers->pinCritical();
    auto ptrs = pin.get();
    for (size_t i = 0, n = pin.size(); i < n; ++i) {
      ptrsToIdxs_[(YGNodeRef) ptrs[i]] = i;
    }
  }

  local_ref<JYogaNode> ref(YGNodeRef node) {
    auto idx = ptrsToIdxs_.find(node);
    if (idx == ptrsToIdxs_.end()) {
      return local_ref<JYogaNode>{};
    } else {
      return javaNodes_->getElement(idx->second);
    }
  }
};
