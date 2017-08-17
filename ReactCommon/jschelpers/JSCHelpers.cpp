// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCHelpers.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#include <glog/logging.h>

#if WITH_FBJSCEXTENSIONS
#include <pthread.h>
#endif

#include "JavaScriptCore.h"
#include "Value.h"

#if WITH_FBJSCEXTENSIONS
#undef ASSERT
#undef WTF_EXPORT_PRIVATE

#include <JavaScriptCore/config.h>
#include <wtf/WTFThreadData.h>

#undef TRUE
#undef FALSE
#endif

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
  const bool isCustomJSC = isCustomJSCPtr(ctx);
  if (isCustomJSC) {
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

  return JSC_JSClassCreate(isCustomJSC, &definition);
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

  Object exnObject = Value(ctx, exn).asObject();
  Value exnMessage = exnObject.getProperty("message");
  msgBuilder << (exnMessage.isString() ? exnMessage : (Value)exnObject).toString().str();

  // The null/empty-ness of source tells us if the JS came from a
  // file/resource, or was a constructed statement.  The location
  // info will include that source, if any.
  std::string locationInfo = sourceURL != nullptr ? String::ref(ctx, sourceURL).str() : "";
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

namespace ExceptionHandling {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

PlatformErrorExtractor platformErrorExtractor;

#if __clang__
#pragma clang diagnostic pop
#endif

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

JSContextLock::JSContextLock(JSGlobalContextRef ctx) noexcept
#if WITH_FBJSCEXTENSIONS
  : ctx_(ctx),
   globalLock_(PTHREAD_MUTEX_INITIALIZER)
   {
  WTFThreadData& threadData = wtfThreadData();

  // Code below is responsible for acquiring locks. It should execute
  // atomically, thus none of the functions invoked from now on are allowed to
  // throw an exception
  try {
    if (!threadData.isDebuggerThread()) {
      CHECK(0 == pthread_mutex_lock(&globalLock_));
    }
    JSLock(ctx_);
  } catch (...) {
    abort();
  }
}
#else
{}
#endif


JSContextLock::~JSContextLock() noexcept {
  #if WITH_FBJSCEXTENSIONS
  WTFThreadData& threadData = wtfThreadData();

  JSUnlock(ctx_);
  if (!threadData.isDebuggerThread()) {
    CHECK(0 == pthread_mutex_unlock(&globalLock_));
  }
  #endif
}


JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, const char *exceptionLocation) {
  try {
    throw;
  } catch (const std::bad_alloc& ex) {
    throw; // We probably shouldn't try to handle this in JS
  } catch (const std::exception& ex) {
    if (ExceptionHandling::platformErrorExtractor) {
      auto extractedEror = ExceptionHandling::platformErrorExtractor(ex, exceptionLocation);
      if (extractedEror.message.length() > 0) {
        return Value::makeError(ctx, extractedEror.message.c_str(), extractedEror.stack.c_str());
      }
    }
    auto msg = folly::to<std::string>("C++ exception in '", exceptionLocation, "'\n\n", ex.what());
    return Value::makeError(ctx, msg.c_str());
  } catch (const char* ex) {
    auto msg = folly::to<std::string>("C++ exception (thrown as a char*) in '", exceptionLocation, "'\n\n", ex);
    return Value::makeError(ctx, msg.c_str());
  } catch (...) {
    auto msg = folly::to<std::string>("Unknown C++ exception in '", exceptionLocation, "'");
    return Value::makeError(ctx, msg.c_str());
  }
}

JSValueRef translatePendingCppExceptionToJSError(JSContextRef ctx, JSObjectRef jsFunctionCause) {
  try {
    auto functionName = Object(ctx, jsFunctionCause).getProperty("name").toString().str();
    return translatePendingCppExceptionToJSError(ctx, functionName.c_str());
  } catch (...) {
    return Value::makeError(ctx, "Failed to translate native exception");
  }
}

} }
