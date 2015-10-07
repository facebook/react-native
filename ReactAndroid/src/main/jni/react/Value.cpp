// Copyright 2004-present Facebook. All Rights Reserved.

#include "Value.h"

#include <jni/fbjni.h>
#include <fb/log.h>

namespace facebook {
namespace react {

Value::Value(JSContextRef context, JSValueRef value) :
  m_context(context),
  m_value(value)
{
}

Value::Value(Value&& other) :
  m_context(other.m_context),
  m_value(other.m_value)
{
  other.m_value = nullptr;
}

Value::~Value() {
  if (m_value) {
    JSValueUnprotect(m_context, m_value);
  }
}

JSContextRef Value::context() const {
  return m_context;
}

std::string Value::toJSONString(unsigned indent) const {
  JSValueRef exn;
  auto stringToAdopt = JSValueCreateJSONString(m_context, m_value, indent, &exn);
  if (stringToAdopt == nullptr) {
    JSValueProtect(m_context, exn);
    std::string exceptionText = Value(m_context, exn).toString().str();
    jni::throwNewJavaException(
        "java/lang/IllegalArgumentException",
        "Exception creating JSON string: %s",
        exceptionText.c_str());
  }
  return String::adopt(stringToAdopt).str();
}

/* static */
Value Value::fromJSON(JSContextRef& ctx, const String& json) {
  return Value(ctx, JSValueMakeFromJSONString(ctx, json));
}

} }
