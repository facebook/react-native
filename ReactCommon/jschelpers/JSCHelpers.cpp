// Copyright 2004-present Facebook. All Rights Reserved.
  
#include "JSCHelpers.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <glog/logging.h>

#include "JavaScriptCore.h"
#include "Value.h"

namespace facebook {
namespace react {

namespace {

JSValueRef functionCaller(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  const bool isCustomJSC = isCustomJSCPtr(ctx);
  auto* f = static_cast<JSFunction*>(JSC_JSObjectGetPrivate(isCustomJSC, function));
  return (*f)(ctx, thisObject, argumentCount, arguments);
}

JSClassRef createFuncClass(JSContextRef ctx) {
  JSClassDefinition definition = kJSClassDefinitionEmpty;
  definition.attributes |= kJSClassAttributeNoAutomaticPrototype;
  // Need to duplicate the two different finalizer blocks, since there's no way
  // for it to capture this static information.
  if (isCustomJSCPtr(ctx)) {
    definition.finalize = [](JSObjectRef object) {
      auto* function = static_cast<JSFunction*>(JSC_JSObjectGetPrivate(true, object));
      delete function;
    };
  } else {
    definition.finalize = [](JSObjectRef object) {
      auto* function = static_cast<JSFunction*>(JSC_JSObjectGetPrivate(false, object));
      delete function;
    };
  }
  definition.callAsFunction = exceptionWrapMethod<&functionCaller>();

  return JSC_JSClassCreate(ctx, &definition);
}

JSObjectRef makeFunction(
    JSContextRef ctx,
    JSStringRef name,
    JSFunction function) {
  static JSClassRef kClassDef = NULL, kCustomJSCClassDef = NULL;
  JSClassRef *classRef = isCustomJSCPtr(ctx) ? &kCustomJSCClassDef : &kClassDef;
  if (!*classRef) {
    *classRef = createFuncClass(ctx);
  }

  // dealloc in kClassDef.finalize
  JSFunction *functionPtr = new JSFunction(std::move(function));
  auto functionObject = Object(ctx, JSC_JSObjectMake(ctx, *classRef, functionPtr));
  functionObject.setProperty("name", Value(ctx, name));
  return functionObject;
}

}

void JSException::buildMessage(JSContextRef ctx, JSValueRef exn, JSStringRef sourceURL, const char* errorMsg) {
  std::ostringstream msgBuilder;
  if (errorMsg && strlen(errorMsg) > 0) {
    msgBuilder << errorMsg << ": ";
  }

  Value exnValue = Value(ctx, exn);
  msgBuilder << exnValue.toString().str();

  // The null/empty-ness of source tells us if the JS came from a
  // file/resource, or was a constructed statement.  The location
  // info will include that source, if any.
  std::string locationInfo = sourceURL != nullptr ? String::ref(ctx, sourceURL).str() : "";
  Object exnObject = exnValue.asObject();
  auto line = exnObject.getProperty("line");
  if (line != nullptr && line.isNumber()) {
    if (locationInfo.empty() && line.asInteger() != 1) {
      // If there is a non-trivial line number, but there was no
      // location info, we include a placeholder, and the line
      // number.
      locationInfo = folly::to<std::string>("<unknown file>:", line.asInteger());
    } else if (!locationInfo.empty()) {
      // If there is location info, we always include the line
      // number, regardless of its value.
      locationInfo += folly::to<std::string>(":", line.asInteger());
    }
  }

  if (!locationInfo.empty()) {
    msgBuilder << " (" << locationInfo << ")";
  }

  auto exceptionText = msgBuilder.str();
  LOG(ERROR) << "Got JS Exception: " << exceptionText;
  msg_ = std::move(exceptionText);

  Value jsStack = exnObject.getProperty("stack");
  if (jsStack.isString()) {
    auto stackText = jsStack.toString().str();
    LOG(ERROR) << "Got JS Stack: " << stackText;
    stack_ = std::move(stackText);
  }
}


JSObjectRef makeFunction(
    JSContextRef ctx,
    const char* name,
    JSFunction function) {
  return makeFunction(ctx, String(ctx, name), std::move(function));
}

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSFunction function) {
  auto jsName = String(ctx, name);
  auto functionObj = makeFunction(ctx, jsName, std::move(function));
  Object::getGlobalObject(ctx).setProperty(jsName, Value(ctx, functionObj));
}

JSObjectRef makeFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback) {
  auto jsName = String(ctx, name);
  return JSC_JSObjectMakeFunctionWithCallback(ctx, jsName, callback);
}

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback) {
  String jsName(ctx, name);
  JSObjectRef functionObj = JSC_JSObjectMakeFunctionWithCallback(
    ctx, jsName, callback);
  Object::getGlobalObject(ctx).setProperty(jsName, Value(ctx, functionObj));
}

void installGlobalProxy(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectGetPropertyCallback callback) {
  JSClassDefinition proxyClassDefintion = kJSClassDefinitionEmpty;
  proxyClassDefintion.attributes |= kJSClassAttributeNoAutomaticPrototype;
  proxyClassDefintion.getProperty = callback;

  const bool isCustomJSC = isCustomJSCPtr(ctx);
  JSClassRef proxyClass = JSC_JSClassCreate(isCustomJSC, &proxyClassDefintion);
  JSObjectRef proxyObj = JSC_JSObjectMake(ctx, proxyClass, nullptr);
  JSC_JSClassRelease(isCustomJSC, proxyClass);

  Object::getGlobalObject(ctx).setProperty(name, Value(ctx, proxyObj));
}

void removeGlobal(JSGlobalContextRef ctx, const char* name) {
  Object::getGlobalObject(ctx).setProperty(name, Value::makeUndefined(ctx));
}

JSValueRef evaluateScript(JSContextRef context, JSStringRef script, JSStringRef sourceURL) {
  JSValueRef exn, result;
  result = JSC_JSEvaluateScript(context, script, NULL, sourceURL, 0, &exn);
  if (result == nullptr) {
    throw JSException(context, exn, sourceURL);
  }
  return result;
}

#if WITH_FBJSCEXTENSIONS
JSValueRef evaluateSourceCode(JSContextRef context, JSSourceCodeRef source, JSStringRef sourceURL) {
  JSValueRef exn, result;
  result = JSEvaluateSourceCode(context, source, NULL, &exn);
  if (result == nullptr) {
    throw JSException(context, exn, sourceURL);
  }
  return result;
}
#endif

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, const char *exceptionLocation) {
  std::ostringstream msg;
  try {
    throw;
  } catch (const std::bad_alloc& ex) {
    throw; // We probably shouldn't try to handle this in JS
  } catch (const std::exception& ex) {
    msg << "C++ Exception in '" << exceptionLocation << "': " << ex.what();
    return Value::makeError(ctx, msg.str().c_str());
  } catch (const char* ex) {
    msg << "C++ Exception (thrown as a char*) in '" << exceptionLocation << "': " << ex;
    return Value::makeError(ctx, msg.str().c_str());
  } catch (...) {
    msg << "Unknown C++ Exception in '" << exceptionLocation << "'";
    return Value::makeError(ctx, msg.str().c_str());
  }
}

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, JSObjectRef jsFunctionCause) {
  try {
    auto functionName = Object(ctx, jsFunctionCause).getProperty("name").toString().str();
    return translatePendingCppExceptionToJSError(ctx, functionName.c_str());
  } catch (...) {
    return Value::makeError(ctx, "Failed to get function name while handling exception");
  }
}

} }
