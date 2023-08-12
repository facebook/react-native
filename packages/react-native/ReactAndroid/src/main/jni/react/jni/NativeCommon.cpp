/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeCommon.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace exceptions {
const char *gUnexpectedNativeTypeExceptionClass =
    "com/facebook/react/bridge/UnexpectedNativeTypeException";
}

namespace {

// Returns a leaked global_ref.
alias_ref<ReadableType> getTypeField(const char *fieldName) {
  static auto cls = ReadableType::javaClassStatic();
  auto field = cls->getStaticField<ReadableType::javaobject>(fieldName);
  return make_global(cls->getStaticFieldValue(field)).release();
}

} // namespace

local_ref<ReadableType> ReadableType::getType(folly::dynamic::Type type) {
  switch (type) {
    case folly::dynamic::Type::NULLT: {
      static alias_ref<ReadableType> val = getTypeField("Null");
      return make_local(val);
    }
    case folly::dynamic::Type::BOOL: {
      static alias_ref<ReadableType> val = getTypeField("Boolean");
      return make_local(val);
    }
    case folly::dynamic::Type::DOUBLE:
    case folly::dynamic::Type::INT64: {
      static alias_ref<ReadableType> val = getTypeField("Number");
      return make_local(val);
    }
    case folly::dynamic::Type::STRING: {
      static alias_ref<ReadableType> val = getTypeField("String");
      return make_local(val);
    }
    case folly::dynamic::Type::OBJECT: {
      static alias_ref<ReadableType> val = getTypeField("Map");
      return make_local(val);
    }
    case folly::dynamic::Type::ARRAY: {
      static alias_ref<ReadableType> val = getTypeField("Array");
      return make_local(val);
    }
    default:
      throwNewJavaException(
          exceptions::gUnexpectedNativeTypeExceptionClass, "Unknown type");
  }
}

} // namespace react
} // namespace facebook
