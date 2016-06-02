// Copyright 2004-present Facebook. All Rights Reserved.

#include "NativeCommon.h"

using namespace facebook::jni;

namespace facebook {
namespace react {

namespace exceptions {
const char *gUnexpectedNativeTypeExceptionClass =
  "com/facebook/react/bridge/UnexpectedNativeTypeException";
}

namespace {

local_ref<ReadableType> getTypeField(const char* fieldName) {
  static auto cls = ReadableType::javaClassStatic();
  auto field = cls->getStaticField<ReadableType::javaobject>(fieldName);
  return cls->getStaticFieldValue(field);
}

alias_ref<ReadableType> getNullValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("Null")).release();
  return val;
}

alias_ref<ReadableType> getBooleanValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("Boolean")).release();
  return val;
}

alias_ref<ReadableType> getNumberValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("Number")).release();
  return val;
}

alias_ref<ReadableType> getStringValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("String")).release();
  return val;
}

alias_ref<ReadableType> getMapValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("Map")).release();
  return val;
}

alias_ref<ReadableType> getArrayValue() {
  static alias_ref<ReadableType> val = make_global(getTypeField("Array")).release();
  return val;
}

} // namespace

local_ref<ReadableType> ReadableType::getType(folly::dynamic::Type type) {
  switch (type) {
    case folly::dynamic::Type::NULLT:
      return make_local(getNullValue());
    case folly::dynamic::Type::BOOL:
      return make_local(getBooleanValue());
    case folly::dynamic::Type::DOUBLE:
    case folly::dynamic::Type::INT64:
      return make_local(getNumberValue());
    case folly::dynamic::Type::STRING:
      return make_local(getStringValue());
    case folly::dynamic::Type::OBJECT:
      return make_local(getMapValue());
    case folly::dynamic::Type::ARRAY:
      return make_local(getArrayValue());
    default:
      throwNewJavaException(exceptions::gUnexpectedNativeTypeExceptionClass, "Unknown type");
  }
}

} // namespace react
} // namespace facebook
