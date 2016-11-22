// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <folly/dynamic.h>

#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/noncopyable.h>
#include <jschelpers/Unicode.h>

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
  explicit String(JSContextRef context, const char* utf8) :
    m_context(context), m_string(JSC_JSStringCreateWithUTF8CString(context, utf8))
  {}

  String(String&& other) :
    m_context(other.m_context), m_string(other.m_string)
  {
    other.m_string = nullptr;
  }

  String(const String& other) :
    m_context(other.m_context), m_string(other.m_string)
  {
    if (m_string) {
      JSC_JSStringRetain(m_context, m_string);
    }
  }

  ~String() {
    if (m_string) {
      JSC_JSStringRelease(m_context, m_string);
    }
  }

  operator JSStringRef() const {
    return m_string;
  }

  // Length in characters
  size_t length() const {
    return JSC_JSStringGetLength(m_context, m_string);
  }

  // Length in bytes of a null-terminated utf8 encoded value
  size_t utf8Size() const {
    return JSC_JSStringGetMaximumUTF8CStringSize(m_context, m_string);
  }

  /*
   * JavaScriptCore is built with strict utf16 -> utf8 conversion.
   * This means if JSC's built-in conversion function encounters a JavaScript
   * string which contains half of a 32-bit UTF-16 symbol, it produces an error
   * rather than returning a string.
   *
   * Instead of relying on this, we use our own utf16 -> utf8 conversion function
   * which is more lenient and always returns a string. When an invalid UTF-16
   * string is provided, it'll likely manifest as a rendering glitch in the app for
   * the invalid symbol.
   *
   * For details on JavaScript's unicode support see:
   * https://mathiasbynens.be/notes/javascript-unicode
   */
  std::string str() const {
    const JSChar* utf16 = JSC_JSStringGetCharactersPtr(m_context, m_string);
    int stringLength = JSC_JSStringGetLength(m_context, m_string);
    return unicode::utf16toUTF8(utf16, stringLength);
  }

  // Assumes that utf8 is null terminated
  bool equals(const char* utf8) {
    return JSC_JSStringIsEqualToUTF8CString(m_context, m_string, utf8);
  }

  // This assumes ascii is nul-terminated.
  static String createExpectingAscii(JSContextRef context, const char* ascii, size_t len) {
#if WITH_FBJSCEXTENSIONS
    return String(context, JSC_JSStringCreateWithUTF8CStringExpectAscii(context, ascii, len), true);
#else
    return String(context, JSC_JSStringCreateWithUTF8CString(context, ascii), true);
#endif
  }

  static String createExpectingAscii(JSContextRef context, std::string const &ascii) {
    return createExpectingAscii(context, ascii.c_str(), ascii.size());
  }

  static String ref(JSContextRef context, JSStringRef string) {
    return String(context, string, false);
  }

  static String adopt(JSContextRef context, JSStringRef string) {
    return String(context, string, true);
  }

private:
  explicit String(JSContextRef context, JSStringRef string, bool adopt) :
    m_context(context), m_string(string)
  {
    if (!adopt && string) {
      JSC_JSStringRetain(context, string);
    }
  }

  JSContextRef m_context;
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
      JSC_JSValueUnprotect(m_context, m_obj);
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
    return JSC_JSObjectIsFunction(m_context, m_obj);
  }

  Value callAsFunction(std::initializer_list<JSValueRef> args) const;
  Value callAsFunction(const Object& thisObj, std::initializer_list<JSValueRef> args) const;
  Value callAsFunction(int nArgs, const JSValueRef args[]) const;
  Value callAsFunction(const Object& thisObj, int nArgs, const JSValueRef args[]) const;

  Object callAsConstructor(std::initializer_list<JSValueRef> args) const;

  Value getProperty(const String& propName) const;
  Value getProperty(const char *propName) const;
  Value getPropertyAtIndex(unsigned index) const;
  void setProperty(const String& propName, const Value& value) const;
  void setProperty(const char *propName, const Value& value) const;
  std::vector<String> getPropertyNames() const;
  std::unordered_map<std::string, std::string> toJSONMap() const;

  void makeProtected() {
    if (!m_isProtected && m_obj) {
      JSC_JSValueProtect(m_context, m_obj);
      m_isProtected = true;
    }
  }

  template<typename ReturnType>
  ReturnType* getPrivate() const {
    const bool isCustomJSC = isCustomJSCPtr(m_context);
    return static_cast<ReturnType*>(JSC_JSObjectGetPrivate(isCustomJSC, m_obj));
  }

  void setPrivate(void* data) const {
    const bool isCustomJSC = isCustomJSCPtr(m_context);
    JSC_JSObjectSetPrivate(isCustomJSC, m_obj, data);
  }

  JSContextRef context() const {
    return m_context;
  }

  static Object getGlobalObject(JSContextRef ctx) {
    auto globalObj = JSC_JSContextGetGlobalObject(ctx);
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

  Value callAsFunction(JSObjectRef thisObj, int nArgs, const JSValueRef args[]) const;
};

class Value : public noncopyable {
public:
  Value(JSContextRef context, JSValueRef value);
  Value(JSContextRef context, JSStringRef value);
  Value(Value&&);

  operator JSValueRef() const {
    return m_value;
  }

  JSType getType() const {
    return JSC_JSValueGetType(m_context, m_value);
  }

  bool isBoolean() const {
    return getType() == kJSTypeBoolean;
  }

  bool asBoolean() const {
    return JSC_JSValueToBoolean(context(), m_value);
  }

  bool isNumber() const {
    return getType() == kJSTypeNumber;
  }

  bool isNull() const {
    return getType() == kJSTypeNull;
  }

  bool isUndefined() const {
    return getType() == kJSTypeUndefined;
  }

  double asNumber() const {
    if (isNumber()) {
      return JSC_JSValueToNumber(context(), m_value, nullptr);
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
    return getType() == kJSTypeObject;
  }

  Object asObject();

  bool isString() const {
    return getType() == kJSTypeString;
  }

  String toString() noexcept {
    return String::adopt(context(), JSC_JSValueToStringCopy(context(), m_value, nullptr));
  }

  static Value makeError(JSContextRef ctx, const char *error);

  static Value makeNumber(JSContextRef ctx, double value) {
    return Value(ctx, JSC_JSValueMakeNumber(ctx, value));
  }

  static Value makeUndefined(JSContextRef ctx) {
    return Value(ctx, JSC_JSValueMakeUndefined(ctx));
  }

  std::string toJSONString(unsigned indent = 0) const;
  static Value fromJSON(JSContextRef ctx, const String& json);
  static JSValueRef fromDynamic(JSContextRef ctx, const folly::dynamic& value);
  JSContextRef context() const;
protected:
  JSContextRef m_context;
  JSValueRef m_value;
  static JSValueRef fromDynamicInner(JSContextRef ctx, const folly::dynamic& obj);
};

} }
