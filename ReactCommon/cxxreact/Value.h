// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include <folly/dynamic.h>

#include "noncopyable.h"

#if WITH_FBJSCEXTENSIONS
#include <jsc_stringref.h>
#endif

namespace facebook {
namespace react {

class Value;
class Context;

class JSException : public std::runtime_error {
public:
  explicit JSException(const char* msg)
    : std::runtime_error(msg)
    , stack_("") {}

  JSException(const char* msg, const char* stack)
    : std::runtime_error(msg)
    , stack_(stack) {}

  const std::string& getStack() const {
    return stack_;
  }

private:
  std::string stack_;
};


class String : public noncopyable {
public:
  explicit String(const char* utf8) :
    m_string(JSStringCreateWithUTF8CString(utf8))
  {}

  String(String&& other) :
    m_string(other.m_string)
  {}

  String(const String& other) :
    m_string(other.m_string)
  {
    if (m_string) {
      JSStringRetain(m_string);
    }
  }

  ~String() {
    if (m_string) {
      JSStringRelease(m_string);
    }
  }

  operator JSStringRef() const {
    return m_string;
  }

  // Length in characters
  size_t length() const {
    return JSStringGetLength(m_string);
  }

  // Length in bytes of a null-terminated utf8 encoded value
  size_t utf8Size() const {
    return JSStringGetMaximumUTF8CStringSize(m_string);
  }

  std::string str() const {
    size_t reserved = utf8Size();
    char* bytes = new char[reserved];
    size_t length = JSStringGetUTF8CString(m_string, bytes, reserved) - 1;
    std::unique_ptr<char[]> retainedBytes(bytes);
    return std::string(bytes, length);
  }

  // Assumes that utf8 is null terminated
  bool equals(const char* utf8) {
    return JSStringIsEqualToUTF8CString(m_string, utf8);
  }

  // This assumes ascii is nul-terminated.
  static String createExpectingAscii(const char* ascii, size_t len) {
#if WITH_FBJSCEXTENSIONS
    return String(JSStringCreateWithUTF8CStringExpectAscii(ascii, len), true);
#else
    return String(JSStringCreateWithUTF8CString(ascii), true);
#endif
  }

  static String createExpectingAscii(std::string const &ascii) {
    return createExpectingAscii(ascii.c_str(), ascii.size());
  }

  static String ref(JSStringRef string) {
    return String(string, false);
  }

  static String adopt(JSStringRef string) {
    return String(string, true);
  }

private:
  explicit String(JSStringRef string, bool adopt) :
    m_string(string)
  {
    if (!adopt && string) {
      JSStringRetain(string);
    }
  }

  JSStringRef m_string;
};

class Object : public noncopyable {
public:
  Object(JSContextRef context, JSObjectRef obj) :
    m_context(context),
    m_obj(obj)
  {}

  Object(Object&& other) :
      m_context(other.m_context),
      m_obj(other.m_obj),
      m_isProtected(other.m_isProtected) {
    other.m_obj = nullptr;
    other.m_isProtected = false;
  }

  ~Object() {
    if (m_isProtected && m_obj) {
      JSValueUnprotect(m_context, m_obj);
    }
  }

  Object& operator=(Object&& other) {
    std::swap(m_context, other.m_context);
    std::swap(m_obj, other.m_obj);
    std::swap(m_isProtected, other.m_isProtected);
    return *this;
  }

  operator JSObjectRef() const {
    return m_obj;
  }

  operator Value() const;

  bool isFunction() const {
    return JSObjectIsFunction(m_context, m_obj);
  }

  Value callAsFunction(std::initializer_list<JSValueRef> args) const;

  Value callAsFunction(int nArgs, const JSValueRef args[]) const;

  Value getProperty(const String& propName) const;
  Value getProperty(const char *propName) const;
  Value getPropertyAtIndex(unsigned index) const;
  void setProperty(const String& propName, const Value& value) const;
  void setProperty(const char *propName, const Value& value) const;
  std::vector<std::string> getPropertyNames() const;
  std::unordered_map<std::string, std::string> toJSONMap() const;

  void makeProtected() {
    if (!m_isProtected && m_obj) {
      JSValueProtect(m_context, m_obj);
      m_isProtected = true;
    }
  }

  static Object getGlobalObject(JSContextRef ctx) {
    auto globalObj = JSContextGetGlobalObject(ctx);
    return Object(ctx, globalObj);
  }

  /**
   * Creates an instance of the default object class.
   */
  static Object create(JSContextRef ctx);

private:
  JSContextRef m_context;
  JSObjectRef m_obj;
  bool m_isProtected = false;
};

class Value : public noncopyable {
public:
  Value(JSContextRef context, JSValueRef value);
  Value(JSContextRef context, JSStringRef value);
  Value(Value&&);

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

  bool isUndefined() const {
    return JSValueIsUndefined(context(), m_value);
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

  Object asObject();

  bool isString() const {
    return JSValueIsString(context(), m_value);
  }

  String toString() noexcept {
    return String::adopt(JSValueToStringCopy(context(), m_value, nullptr));
  }

  std::string toJSONString(unsigned indent = 0) const throw(JSException);
  static Value fromJSON(JSContextRef ctx, const String& json) throw(JSException);
  static Value fromDynamic(JSContextRef ctx, folly::dynamic value) throw(JSException);
protected:
  JSContextRef context() const;
  JSContextRef m_context;
  JSValueRef m_value;
};

} }
