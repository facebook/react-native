/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const short int LAYOUT_EDGE_SET_FLAG_INDEX = 0;
const short int LAYOUT_WIDTH_INDEX = 1;
const short int LAYOUT_HEIGHT_INDEX = 2;
const short int LAYOUT_LEFT_INDEX = 3;
const short int LAYOUT_TOP_INDEX = 4;
const short int LAYOUT_DIRECTION_INDEX = 5;
const short int LAYOUT_MARGIN_START_INDEX = 6;
const short int LAYOUT_PADDING_START_INDEX = 10;
const short int LAYOUT_BORDER_START_INDEX = 14;

namespace {

const int DOES_LEGACY_STRETCH_BEHAVIOUR = 8;
const int HAS_NEW_LAYOUT = 16;

union YGNodeContext {
  uintptr_t edgesSet = 0;
  void *asVoidPtr;
};

class YGNodeEdges {
  uintptr_t edges_;

 public:
  enum Edge {
    MARGIN = 1,
    PADDING = 2,
    BORDER = 4,
  };

  YGNodeEdges(YGNodeRef node) {
    auto context = YGNodeContext{};
    context.asVoidPtr = node->getContext();
    edges_ = context.edgesSet;
  }

  void setOn(YGNodeRef node) {
    auto context = YGNodeContext{};
    context.edgesSet = edges_;
    node->setContext(context.asVoidPtr);
  }

  bool has(Edge edge) {
    return (edges_ & edge) == edge;
  }

  YGNodeEdges &add(Edge edge) {
    edges_ |= edge;
    return *this;
  }

  int get() {
    return edges_;
  }
};

struct YogaValue {
  static constexpr jint NAN_BYTES = 0x7fc00000;

  static jlong asJavaLong(const YGValue &value) {
    uint32_t valueBytes = 0;
    memcpy(&valueBytes, &value.value, sizeof valueBytes);
    return ((jlong)value.unit) << 32 | valueBytes;
  }
  constexpr static jlong undefinedAsJavaLong() {
    return ((jlong)YGUnitUndefined) << 32 | NAN_BYTES;
  }
};
} // namespace
