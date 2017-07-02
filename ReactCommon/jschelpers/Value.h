// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <folly/dynamic.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Unicode.h>
#include <jschelpers/noncopyable.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace react {

class Value;

// C++ object wrapper for JSStringRef
class String : public noncopyable {
public:
  explicit String(): m_context(nullptr), m_string(nullptr) {} // dummy empty constructor

  explicit String(JSContextRef context, const char* utf8)
  : m_context(context), m_string(JSC_JSStringCreateWithUTF8CString(context, utf8)) {}

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

  String& operator=(String&& other) {
    if (m_string) {
      JSC_JSStringRelease(m_context, m_string);
    }

    m_context = other.m_context;
    m_string = other.m_string;
    other.m_string = nullptr;

    return *this;
  }

  operator JSStringRef() const {
    return m_string;
  }

  JSContextRef context() const {
    return m_context;
  }

  // Length in characters
  size_t length() const {
    return m_string ? JSC_JSStringGetLength(m_context, m_string) : 0;
  }

  // Length in bytes of a nul-terminated utf8 encoded value
  size_t utf8Size() const {
    return m_string ? JSC_JSStringGetMaximumUTF8CStringSize(m_context, m_string) : 0;
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
    if (!m_string) {
      return "";
    }
    const JSChar* utf16 = JSC_JSStringGetCharactersPtr(m_context, m_string);
    size_t stringLength = JSC_JSStringGetLength(m_context, m_string);
    return unicode::utf16toUTF8(utf16, stringLength);
  }

  // Assumes that utf8 is nul-terminated
  bool equals(const char* utf8) {
    return m_string ? JSC_JSStringIsEqualToUTF8CString(m_context, m_string, utf8) : false;
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

  // Creates a String wrapper and increases the refcount of the JSStringRef
  static String ref(JSContextRef context, JSStringRef string) {
    return String(context, string, false);
  }

  // Creates a String wrapper that takes over ownership of the string. The
  // JSStringRef passed in must previously have been created or retained.
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

// C++ object wrapper for JSObjectRef. The underlying JSObjectRef can be
// optionally protected. You must protect the object if it is ever
// heap-allocated, since otherwise you may end up with an invalid reference.
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
  Value getPropertyAtIndex(unsigned int index) const;
  void setProperty(const String& propName, const Value& value);
  void setProperty(const char *propName, const Value& value);
  void setPropertyAtIndex(unsigned int index, const Value& value);
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

// C++ object wrapper for JSValueRef. The underlying JSValueRef is not
// protected, so this class should always be used as a stack-allocated
// variable.
class Value : public noncopyable {
public:
  RN_EXPORT Value(JSContextRef context, JSValueRef value);
  RN_EXPORT Value(JSContextRef context, JSStringRef value);

  RN_EXPORT Value(const Value &o) : Value(o.m_context, o.m_value) {}
  RN_EXPORT Value(const String &o) : Value(o.context(), o) {}

  Value& operator=(Value&& other) {
    m_context = other.m_context;
    m_value = other.m_value;
    other.m_value = NULL;
    return *this;
  };

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

  RN_EXPORT Object asObject() const;

  bool isString() const {
    return getType() == kJSTypeString;
  }

  RN_EXPORT String toString() const;

  // Create an error, optionally adding an additional number of lines to the stack.
  // Stack must be empty or newline terminated.
  RN_EXPORT static Value makeError(JSContextRef ctx, const char *error, const char *stack = nullptr);

  static Value makeNumber(JSContextRef ctx, double value) {
    return Value(ctx, JSC_JSValueMakeNumber(ctx, value));
  }

  static Value makeUndefined(JSContextRef ctx) {
    return Value(ctx, JSC_JSValueMakeUndefined(ctx));
  }

  static Value makeNull(JSContextRef ctx) {
    return Value(ctx, JSC_JSValueMakeNull(ctx));
  }

  RN_EXPORT std::string toJSONString(unsigned indent = 0) const;
  RN_EXPORT static Value fromJSON(const String& json);
  RN_EXPORT static Value fromDynamic(JSContextRef ctx, const folly::dynamic& value);
  RN_EXPORT JSContextRef context() const;

private:
  JSContextRef m_context;
  JSValueRef m_value;

  static JSValueRef fromDynamicInner(JSContextRef ctx, const folly::dynamic& obj);
};

} }
