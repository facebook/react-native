// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <sstream>
#include <JavaScriptCore/JSRetainPtr.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSValueRef.h>
#include <fb/noncopyable.h>

namespace facebook {
namespace react {

class Context;

class String : public noncopyable {
public:
  explicit String(const char* utf8) :
    m_string(Adopt, JSStringCreateWithUTF8CString(utf8))
  {}
  String(String&& other) :
    m_string(Adopt, other.m_string.leakRef())
  {}
  String(const String& other) :
    m_string(other.m_string)
  {}

  operator JSStringRef() const {
    return m_string.get();
  }

  // Length in characters
  size_t length() const {
    return JSStringGetLength(m_string.get());
  }

  // Length in bytes of a null-terminated utf8 encoded value
  size_t utf8Size() const {
    return JSStringGetMaximumUTF8CStringSize(m_string.get());
  }

  std::string str() const {
    size_t reserved = utf8Size();
    char* bytes = new char[reserved];
    size_t length = JSStringGetUTF8CString(m_string.get(), bytes, reserved) - 1;
    std::unique_ptr<char[]> retainedBytes(bytes);
    return std::string(bytes, length);
  }

  // Assumes that utf8 is null terminated
  bool equals(const char* utf8) {
    return JSStringIsEqualToUTF8CString(m_string.get(), utf8);
  }

  static String ref(JSStringRef string) {
    return String(string);
  }

  static String adopt(JSStringRef string) {
    return String(Adopt, string);
  }

private:
  explicit String(JSStringRef string) :
    m_string(string)
  {}

  String(AdoptTag tag, JSStringRef string) :
    m_string(tag, string)
  {}

  JSRetainPtr<JSStringRef> m_string;
};

class Value : public noncopyable {
public:
  Value(JSContextRef context, JSValueRef value);
  Value(Value&&);
  ~Value();

  operator JSValueRef() const {
    return m_value;
  }

  bool isBoolean() const {
    return JSValueIsBoolean(context(), m_value);
  }

  bool asBoolean() const {
    return JSValueToBoolean(context(), m_value);
  }

  bool isNumber() const {
    return JSValueIsNumber(context(), m_value);
  }

  bool isNull() const {
    return JSValueIsNull(context(), m_value);
  }

  double asNumber() const {
    if (isNumber()) {
      return JSValueToNumber(context(), m_value, nullptr);
    } else {
      return 0.0f;
    }
  }

  int32_t asInteger() const {
    return static_cast<int32_t>(asNumber());
  }

  uint32_t asUnsignedInteger() const {
    return static_cast<uint32_t>(asNumber());
  }

  bool isObject() const {
    return JSValueIsObject(context(), m_value);
  }

  bool isString() const {
    return JSValueIsString(context(), m_value);
  }

  String toString() {
    return String::adopt(JSValueToStringCopy(context(), m_value, nullptr));
  }

  std::string toJSONString(unsigned indent = 0) const;
  static Value fromJSON(JSContextRef& ctx, const String& json);
protected:
  JSContextRef context() const;
  JSContextRef m_context;
  JSValueRef m_value;
};

} }
