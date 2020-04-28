/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsParser.h"

#include <folly/Likely.h>
#include <react/core/RawProps.h>

namespace facebook {
namespace react {

RawValue const *RawPropsParser::at(
    RawProps const &rawProps,
    RawPropsKey const &key) const {
  if (UNLIKELY(!ready_)) {
    // This is not thread-safe part; this happens only during initialization of
    // a `ComponentDescriptor` where it is actually safe.
    keys_.push_back(key);
    nameToIndex_.insert(key, size_);
    size_++;
    return nullptr;
  }

  do {
    rawProps.keyIndexCursor_++;

    if (UNLIKELY(rawProps.keyIndexCursor_ >= size_)) {
      rawProps.keyIndexCursor_ = 0;
    }
  } while (UNLIKELY(key != keys_[rawProps.keyIndexCursor_]));

  auto valueIndex = rawProps.keyIndexToValueIndex_[rawProps.keyIndexCursor_];
  return valueIndex == kRawPropsValueIndexEmpty ? nullptr
                                                : &rawProps.values_[valueIndex];
}

void RawPropsParser::postPrepare() {
  ready_ = true;
  nameToIndex_.reindex();
}

void RawPropsParser::preparse(RawProps const &rawProps) const {
  rawProps.keyIndexToValueIndex_.resize(size_, kRawPropsValueIndexEmpty);

  // Resetting the cursor, the next increment will give `0`.
  rawProps.keyIndexCursor_ = size_ - 1;

  switch (rawProps.mode_) {
    case RawProps::Mode::Empty:
      return;

    case RawProps::Mode::JSI: {
      auto &runtime = *rawProps.runtime_;
      auto object = rawProps.value_.asObject(runtime);

      auto names = object.getPropertyNames(runtime);
      auto count = names.size(runtime);
      auto valueIndex = RawPropsValueIndex{0};

      for (auto i = 0; i < count; i++) {
        auto nameValue = names.getValueAtIndex(runtime, i).getString(runtime);
        auto value = object.getProperty(runtime, nameValue);

        auto name = nameValue.utf8(runtime);

        auto keyIndex = nameToIndex_.at(name.data(), name.size());
        if (keyIndex == kRawPropsValueIndexEmpty) {
          continue;
        }

        rawProps.keyIndexToValueIndex_[keyIndex] = valueIndex;
        rawProps.values_.push_back(
            RawValue(jsi::dynamicFromValue(runtime, value)));
        valueIndex++;
      }

      break;
    }

    case RawProps::Mode::Dynamic: {
      auto const &dynamic = rawProps.dynamic_;
      auto valueIndex = RawPropsValueIndex{0};

      for (auto const &pair : dynamic.items()) {
        auto name = pair.first.getString();

        auto keyIndex = nameToIndex_.at(name.data(), name.size());
        if (keyIndex == kRawPropsValueIndexEmpty) {
          continue;
        }

        rawProps.keyIndexToValueIndex_[keyIndex] = valueIndex;
        rawProps.values_.push_back(RawValue{pair.second});
        valueIndex++;
      }
      break;
    }
  }
}

} // namespace react
} // namespace facebook
