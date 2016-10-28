// Copyright 2004-present Facebook. All Rights Reserved.

#include <folly/json.h>

#include "Value.h"

#include "JSCHelpers.h"

// See the comment under Value::fromDynamic()
#if !defined(__APPLE__) && defined(WITH_FB_JSC_TUNING)
#define USE_FAST_FOLLY_DYNAMIC_CONVERSION 1
#else
#define USE_FAST_FOLLY_DYNAMIC_CONVERSION 0
#endif

namespace facebook {
namespace react {

Value::Value(JSContextRef context, JSValueRef value) :
  m_context(context),
  m_value(value)
{
}

Value::Value(JSContextRef context, JSStringRef str) :
  m_context(context),
  m_value(JSValueMakeString(context, str))
{
}

Value::Value(Value&& other) :
  m_context(other.m_context),
  m_value(other.m_value)
{
  other.m_value = nullptr;
}

JSContextRef Value::context() const {
  return m_context;
}

std::string Value::toJSONString(unsigned indent) const {
  JSValueRef exn;
  auto stringToAdopt = JSValueCreateJSONString(m_context, m_value, indent, &exn);
  if (stringToAdopt == nullptr) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Exception creating JSON string: %s", exceptionText.c_str());
  }
  return String::adopt(stringToAdopt).str();
}

/* static */
Value Value::fromJSON(JSContextRef ctx, const String& json) {
  auto result = JSValueMakeFromJSONString(ctx, json);
  if (!result) {
    throwJSExecutionException("Failed to create String from JSON: %s", json.str().c_str());
  }
  return Value(ctx, result);
}

JSValueRef Value::fromDynamic(JSContextRef ctx, const folly::dynamic& value) {
// JavaScriptCore's iOS APIs have their own version of this direct conversion.
// In addition, using this requires exposing some of JSC's private APIs,
//  so it's limited to non-apple platforms and to builds that use the custom JSC.
// Otherwise, we use the old way of converting through JSON.
#if USE_FAST_FOLLY_DYNAMIC_CONVERSION
  // Defer GC during the creation of the JSValue, as we don't want
  //  intermediate objects to be collected.
  // We could use JSValueProtect(), but it will make the process much slower.
  JSDeferredGCRef deferGC = JSDeferGarbageCollection(ctx);
  // Set a global lock for the whole process,
  //  instead of re-acquiring the lock for each operation.
  JSLock(ctx);
  JSValueRef jsVal = Value::fromDynamicInner(ctx, value);
  JSUnlock(ctx);
  JSResumeGarbageCollection(ctx, deferGC);
  return jsVal;
#else
  auto json = folly::toJson(value);
  return fromJSON(ctx, String(json.c_str()));
#endif
}

JSValueRef Value::fromDynamicInner(JSContextRef ctx, const folly::dynamic& obj) {
  switch (obj.type()) {
    // For premitive types (and strings), just create and return an equivalent JSValue
    case folly::dynamic::Type::NULLT:
      return JSValueMakeNull(ctx);

    case folly::dynamic::Type::BOOL:
      return JSValueMakeBoolean(ctx, obj.getBool());

    case folly::dynamic::Type::DOUBLE:
      return JSValueMakeNumber(ctx, obj.getDouble());

    case folly::dynamic::Type::INT64:
      return JSValueMakeNumber(ctx, obj.asDouble());

    case folly::dynamic::Type::STRING:
      return JSValueMakeString(ctx, String(obj.getString().c_str()));

    case folly::dynamic::Type::ARRAY: {
      // Collect JSValue for every element in the array
      JSValueRef vals[obj.size()];
      for (size_t i = 0; i < obj.size(); ++i) {
        vals[i] = fromDynamicInner(ctx, obj[i]);
      }
      // Create a JSArray with the values
      JSValueRef arr = JSObjectMakeArray(ctx, obj.size(), vals, nullptr);
      return arr;
    }

    case folly::dynamic::Type::OBJECT: {
      // Create an empty object
      JSObjectRef jsObj = JSObjectMake(ctx, nullptr, nullptr);
      // Create a JSValue for each of the object's children and set them in the object
      for (auto it = obj.items().begin(); it != obj.items().end(); ++it) {
        JSObjectSetProperty(
          ctx,
          jsObj,
          String(it->first.asString().c_str()),
          fromDynamicInner(ctx, it->second),
          kJSPropertyAttributeNone,
          nullptr);
      }
      return jsObj;
    }
    default:
      // Assert not reached
      LOG(FATAL) << "Trying to convert a folly object of unsupported type.";
      return JSValueMakeNull(ctx);
  }
}

Object Value::asObject() {
  JSValueRef exn;
  JSObjectRef jsObj = JSValueToObject(context(), m_value, &exn);
  if (!jsObj) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Failed to convert to object: %s", exceptionText.c_str());
  }
  Object ret = Object(context(), jsObj);
  m_value = nullptr;
  return ret;
}

Object::operator Value() const {
  return Value(m_context, m_obj);
}

Value Object::callAsFunction(std::initializer_list<JSValueRef> args) const {
  return callAsFunction(nullptr, args.size(), args.begin());
}

Value Object::callAsFunction(const Object& thisObj, std::initializer_list<JSValueRef> args) const {
  return callAsFunction((JSObjectRef) thisObj, args.size(), args.begin());
}

Value Object::callAsFunction(int nArgs, const JSValueRef args[]) const {
  return callAsFunction(nullptr, nArgs, args);
}

Value Object::callAsFunction(const Object& thisObj, int nArgs, const JSValueRef args[]) const {
  return callAsFunction((JSObjectRef) thisObj, nArgs, args);
}

Value Object::callAsFunction(JSObjectRef thisObj, int nArgs, const JSValueRef args[]) const {
  JSValueRef exn;
  JSValueRef result = JSObjectCallAsFunction(m_context, m_obj, thisObj, nArgs, args, &exn);
  if (!result) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Exception calling object as function: %s", exceptionText.c_str());
  }
  return Value(m_context, result);
}

Object Object::callAsConstructor(std::initializer_list<JSValueRef> args) const {
  JSValueRef exn;
  JSObjectRef result = JSObjectCallAsConstructor(m_context, m_obj, args.size(), args.begin(), &exn);
  if (!result) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Exception calling object as constructor: %s", exceptionText.c_str());
  }
  return Object(m_context, result);
}

Value Object::getProperty(const String& propName) const {
  JSValueRef exn;
  JSValueRef property = JSObjectGetProperty(m_context, m_obj, propName, &exn);
  if (!property) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Failed to get property: %s", exceptionText.c_str());
  }
  return Value(m_context, property);
}

Value Object::getPropertyAtIndex(unsigned index) const {
  JSValueRef exn;
  JSValueRef property = JSObjectGetPropertyAtIndex(m_context, m_obj, index, &exn);
  if (!property) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Failed to get property at index %u: %s", index, exceptionText.c_str());
  }
  return Value(m_context, property);
}

Value Object::getProperty(const char *propName) const {
  return getProperty(String(propName));
}

void Object::setProperty(const String& propName, const Value& value) const {
  JSValueRef exn = NULL;
  JSObjectSetProperty(m_context, m_obj, propName, value, kJSPropertyAttributeNone, &exn);
  if (exn) {
    std::string exceptionText = Value(m_context, exn).toString().str();
    throwJSExecutionException("Failed to set property: %s", exceptionText.c_str());
  }
}

void Object::setProperty(const char *propName, const Value& value) const {
  setProperty(String(propName), value);
}

std::vector<String> Object::getPropertyNames() const {
  auto namesRef = JSObjectCopyPropertyNames(m_context, m_obj);
  size_t count = JSPropertyNameArrayGetCount(namesRef);
  std::vector<String> names;
  names.reserve(count);
  for (size_t i = 0; i < count; i++) {
    names.emplace_back(String::ref(JSPropertyNameArrayGetNameAtIndex(namesRef, i)));
  }
  JSPropertyNameArrayRelease(namesRef);
  return names;
}

std::unordered_map<std::string, std::string> Object::toJSONMap() const {
  std::unordered_map<std::string, std::string> map;
  auto namesRef = JSObjectCopyPropertyNames(m_context, m_obj);
  size_t count = JSPropertyNameArrayGetCount(namesRef);
  for (size_t i = 0; i < count; i++) {
    auto key = String::ref(JSPropertyNameArrayGetNameAtIndex(namesRef, i));
    map.emplace(key.str(), getProperty(key).toJSONString());
  }
  JSPropertyNameArrayRelease(namesRef);
  return map;
}

/* static */
Object Object::create(JSContextRef ctx) {
  JSObjectRef newObj = JSObjectMake(
      ctx,
      NULL, // create instance of default object class
      NULL); // no private data
  return Object(ctx, newObj);
}

} }
