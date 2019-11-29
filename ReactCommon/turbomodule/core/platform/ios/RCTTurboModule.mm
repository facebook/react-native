/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModule.h"

#import <objc/message.h>
#import <objc/runtime.h>
#import <sstream>
#import <vector>

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <React/RCTModuleMethod.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/LongLivedObject.h>
#import <ReactCommon/TurboModule.h>
#import <ReactCommon/TurboModuleUtils.h>

using namespace facebook;

/**
 * All static helper functions are ObjC++ specific.
 */
static jsi::Value convertNSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value((bool)[value boolValue]);
}

static jsi::Value convertNSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value([value doubleValue]);
}

static jsi::String convertNSStringToJSIString(jsi::Runtime &runtime, NSString *value)
{
  return jsi::String::createFromUtf8(runtime, [value UTF8String] ?: "");
}

static jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
static jsi::Object convertNSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value)
{
  jsi::Object result = jsi::Object(runtime);
  for (NSString *k in value) {
    result.setProperty(runtime, [k UTF8String], convertObjCObjectToJSIValue(runtime, value[k]));
  }
  return result;
}

static jsi::Array convertNSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value)
{
  jsi::Array result = jsi::Array(runtime, value.count);
  for (size_t i = 0; i < value.count; i++) {
    result.setValueAtIndex(runtime, i, convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

static std::vector<jsi::Value> convertNSArrayToStdVector(jsi::Runtime &runtime, NSArray *value)
{
  std::vector<jsi::Value> result;
  for (size_t i = 0; i < value.count; i++) {
    result.emplace_back(convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

static jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
  if ([value isKindOfClass:[NSString class]]) {
    return convertNSStringToJSIString(runtime, (NSString *)value);
  } else if ([value isKindOfClass:[NSNumber class]]) {
    if ([value isKindOfClass:[@YES class]]) {
      return convertNSNumberToJSIBoolean(runtime, (NSNumber *)value);
    }
    return convertNSNumberToJSINumber(runtime, (NSNumber *)value);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    return convertNSDictionaryToJSIObject(runtime, (NSDictionary *)value);
  } else if ([value isKindOfClass:[NSArray class]]) {
    return convertNSArrayToJSIArray(runtime, (NSArray *)value);
  } else if (value == (id)kCFNull) {
    return jsi::Value::null();
  }
  return jsi::Value::undefined();
}

static id convertJSIValueToObjCObject(
    jsi::Runtime &runtime,
    const jsi::Value &value,
    std::shared_ptr<react::CallInvoker> jsInvoker);
static NSString *convertJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
  return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

static NSArray *
convertJSIArrayToNSArray(jsi::Runtime &runtime, const jsi::Array &value, std::shared_ptr<react::CallInvoker> jsInvoker)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    [result
        addObject:convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i), jsInvoker) ?: (id)kCFNull];
  }
  return [result copy];
}

static NSDictionary *convertJSIObjectToNSDictionary(
    jsi::Runtime &runtime,
    const jsi::Object &value,
    std::shared_ptr<react::CallInvoker> jsInvoker)
{
  jsi::Array propertyNames = value.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *k = convertJSIStringToNSString(runtime, name);
    id v = convertJSIValueToObjCObject(runtime, value.getProperty(runtime, name), jsInvoker);
    if (v) {
      result[k] = v;
    }
  }
  return [result copy];
}

static RCTResponseSenderBlock convertJSIFunctionToCallback(
    jsi::Runtime &runtime,
    const jsi::Function &value,
    std::shared_ptr<react::CallInvoker> jsInvoker);
static id convertJSIValueToObjCObject(
    jsi::Runtime &runtime,
    const jsi::Value &value,
    std::shared_ptr<react::CallInvoker> jsInvoker)
{
  if (value.isUndefined() || value.isNull()) {
    return nil;
  }
  if (value.isBool()) {
    return @(value.getBool());
  }
  if (value.isNumber()) {
    return @(value.getNumber());
  }
  if (value.isString()) {
    return convertJSIStringToNSString(runtime, value.getString(runtime));
  }
  if (value.isObject()) {
    jsi::Object o = value.getObject(runtime);
    if (o.isArray(runtime)) {
      return convertJSIArrayToNSArray(runtime, o.getArray(runtime), jsInvoker);
    }
    if (o.isFunction(runtime)) {
      return convertJSIFunctionToCallback(runtime, std::move(o.getFunction(runtime)), jsInvoker);
    }
    return convertJSIObjectToNSDictionary(runtime, o, jsInvoker);
  }

  throw std::runtime_error("Unsupported jsi::jsi::Value kind");
}

static RCTResponseSenderBlock convertJSIFunctionToCallback(
    jsi::Runtime &runtime,
    const jsi::Function &value,
    std::shared_ptr<react::CallInvoker> jsInvoker)
{
  auto weakWrapper = react::CallbackWrapper::createWeak(value.getFunction(runtime), runtime, jsInvoker);
  BOOL __block wrapperWasCalled = NO;
  return ^(NSArray *responses) {
    if (wrapperWasCalled) {
      throw std::runtime_error("callback arg cannot be called more than once");
    }

    auto strongWrapper = weakWrapper.lock();
    if (!strongWrapper) {
      return;
    }

    strongWrapper->jsInvoker().invokeAsync([weakWrapper, responses]() {
      auto strongWrapper2 = weakWrapper.lock();
      if (!strongWrapper2) {
        return;
      }

      std::vector<jsi::Value> args = convertNSArrayToStdVector(strongWrapper2->runtime(), responses);
      strongWrapper2->callback().call(strongWrapper2->runtime(), (const jsi::Value *)args.data(), args.size());
      strongWrapper2->destroy();
    });

    wrapperWasCalled = YES;
  };
}

namespace facebook {
namespace react {

jsi::Value ObjCTurboModule::createPromise(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> jsInvoker,
    PromiseInvocationBlock invoke)
{
  if (!invoke) {
    return jsi::Value::undefined();
  }

  jsi::Function Promise = runtime.global().getPropertyAsFunction(runtime, "Promise");

  // Note: the passed invoke() block is not retained by default, so let's retain it here to help keep it longer.
  // Otherwise, there's a risk of it getting released before the promise function below executes.
  PromiseInvocationBlock invokeCopy = [invoke copy];
  jsi::Function fn = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "fn"),
      2,
      [invokeCopy, jsInvoker](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
        if (count != 2) {
          throw std::invalid_argument(
              "Promise must pass constructor function two args. Passed " + std::to_string(count) + " args.");
        }
        if (!invokeCopy) {
          return jsi::Value::undefined();
        }

        auto weakResolveWrapper =
            react::CallbackWrapper::createWeak(args[0].getObject(rt).getFunction(rt), rt, jsInvoker);
        auto weakRejectWrapper =
            react::CallbackWrapper::createWeak(args[1].getObject(rt).getFunction(rt), rt, jsInvoker);

        __block BOOL resolveWasCalled = NO;
        __block BOOL rejectWasCalled = NO;

        RCTPromiseResolveBlock resolveBlock = ^(id result) {
          if (rejectWasCalled) {
            throw std::runtime_error("Tried to resolve a promise after it's already been rejected.");
          }

          if (resolveWasCalled) {
            throw std::runtime_error("Tried to resolve a promise more than once.");
          }

          auto strongResolveWrapper = weakResolveWrapper.lock();
          auto strongRejectWrapper = weakRejectWrapper.lock();
          if (!strongResolveWrapper || !strongRejectWrapper) {
            return;
          }

          strongResolveWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, result]() {
            auto strongResolveWrapper2 = weakResolveWrapper.lock();
            auto strongRejectWrapper2 = weakRejectWrapper.lock();
            if (!strongResolveWrapper2 || !strongRejectWrapper2) {
              return;
            }

            jsi::Runtime &rt = strongResolveWrapper2->runtime();
            jsi::Value arg = convertObjCObjectToJSIValue(rt, result);
            strongResolveWrapper2->callback().call(rt, arg);

            strongResolveWrapper2->destroy();
            strongRejectWrapper2->destroy();
          });

          resolveWasCalled = YES;
        };

        RCTPromiseRejectBlock rejectBlock = ^(NSString *code, NSString *message, NSError *error) {
          if (resolveWasCalled) {
            throw std::runtime_error("Tried to reject a promise after it's already been resolved.");
          }

          if (rejectWasCalled) {
            throw std::runtime_error("Tried to reject a promise more than once.");
          }

          auto strongResolveWrapper = weakResolveWrapper.lock();
          auto strongRejectWrapper = weakRejectWrapper.lock();
          if (!strongResolveWrapper || !strongRejectWrapper) {
            return;
          }

          NSDictionary *jsError = RCTJSErrorFromCodeMessageAndNSError(code, message, error);
          strongRejectWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, jsError]() {
            auto strongResolveWrapper2 = weakResolveWrapper.lock();
            auto strongRejectWrapper2 = weakRejectWrapper.lock();
            if (!strongResolveWrapper2 || !strongRejectWrapper2) {
              return;
            }

            jsi::Runtime &rt = strongRejectWrapper2->runtime();
            jsi::Value arg = convertNSDictionaryToJSIObject(rt, jsError);
            strongRejectWrapper2->callback().call(rt, arg);

            strongResolveWrapper2->destroy();
            strongRejectWrapper2->destroy();
          });

          rejectWasCalled = YES;
        };

        invokeCopy(rt, resolveBlock, rejectBlock);
        return jsi::Value::undefined();
      });

  return Promise.callAsConstructor(runtime, fn);
}

namespace {

/**
 * Perform method invocation on a specific queue as configured by the module class.
 * This serves as a backward-compatible support for RCTBridgeModule's methodQueue API.
 *
 * In the future:
 * - This methodQueue support may be removed for simplicity and consistency with Android.
 * - ObjC module methods will be always be called from JS thread.
 *   They may decide to dispatch to a different queue as needed.
 */
jsi::Value performMethodInvocation(
    jsi::Runtime &runtime,
    NSInvocation *inv,
    TurboModuleMethodValueKind valueKind,
    const id<RCTTurboModule> module,
    std::shared_ptr<CallInvoker> jsInvoker,
    NSMutableArray *retainedObjectsForInvocation)
{
  __block id result;
  jsi::Runtime *rt = &runtime;
  void (^block)() = ^{
    [inv invokeWithTarget:module];
    [retainedObjectsForInvocation removeAllObjects];

    if (valueKind == VoidKind) {
      return;
    }
    void *rawResult;
    [inv getReturnValue:&rawResult];
    result = (__bridge id)rawResult;
  };

  // Backward-compatibility layer for calling module methods on specific queue.
  dispatch_queue_t methodQueue = NULL;
  if ([module conformsToProtocol:@protocol(RCTBridgeModule)] && [module respondsToSelector:@selector(methodQueue)]) {
    methodQueue = [module performSelector:@selector(methodQueue)];
  }

  if (methodQueue == NULL || methodQueue == RCTJSThread) {
    // This is the default mode of execution: on JS thread.
    block();
  } else if (methodQueue == dispatch_get_main_queue()) {
    if (valueKind == VoidKind) {
      // Void methods are treated as async for now, so there's no need to block here.
      RCTExecuteOnMainQueue(block);
    } else {
      // This is not ideal, but provides the simplest mechanism for now.
      // Eventually, methods should be responsible to queue things up to different queue if they need to.
      // TODO: consider adding timer to warn if this method invocation takes too long.
      RCTUnsafeExecuteOnMainQueueSync(block);
    }
  } else {
    if (valueKind == VoidKind) {
      dispatch_async(methodQueue, block);
    } else {
      dispatch_sync(methodQueue, block);
    }
  }

  // VoidKind can't be null
  // PromiseKind, and FunctionKind must throw errors always
  if (valueKind != VoidKind && valueKind != PromiseKind && valueKind != FunctionKind &&
      (result == (id)kCFNull || result == nil)) {
    return jsi::Value::null();
  }

  // TODO: Re-use value conversion logic from existing impl, if possible.
  switch (valueKind) {
    case VoidKind:
      return jsi::Value::undefined();
    case BooleanKind:
      return convertNSNumberToJSIBoolean(*rt, (NSNumber *)result);
    case NumberKind:
      return convertNSNumberToJSINumber(*rt, (NSNumber *)result);
    case StringKind:
      return convertNSStringToJSIString(*rt, (NSString *)result);
    case ObjectKind:
      return convertNSDictionaryToJSIObject(*rt, (NSDictionary *)result);
    case ArrayKind:
      return convertNSArrayToJSIArray(*rt, (NSArray *)result);
    case FunctionKind:
      throw std::runtime_error("convertInvocationResultToJSIValue: FunctionKind is not supported yet.");
    case PromiseKind:
      throw std::runtime_error("convertInvocationResultToJSIValue: PromiseKind wasn't handled properly.");
  }
}

} // namespace

/**
 * Given a method name, and an argument index, return type of that argument.
 * Prerequisite: You must wrap the method declaration inside some variant of the
 * RCT_EXPORT_METHOD macro.
 *
 * This method returns nil if the method for which you're querying the argument type
 * is not wrapped in an RCT_EXPORT_METHOD.
 *
 * Note: This is only being introduced for backward compatibility. It will be removed
 *       in the future.
 */
NSString *ObjCTurboModule::getArgumentTypeName(NSString *methodName, int argIndex)
{
  if (!methodArgumentTypeNames_) {
    NSMutableDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames = [NSMutableDictionary new];

    unsigned int numberOfMethods;
    Class cls = [instance_ class];
    Method *methods = class_copyMethodList(object_getClass(cls), &numberOfMethods);

    if (methods) {
      for (unsigned int i = 0; i < numberOfMethods; i++) {
        SEL s = method_getName(methods[i]);
        NSString *mName = NSStringFromSelector(s);
        if (![mName hasPrefix:@"__rct_export__"]) {
          continue;
        }

        // Message dispatch logic from old infra
        RCTMethodInfo *(*getMethodInfo)(id, SEL) = (__typeof__(getMethodInfo))objc_msgSend;
        RCTMethodInfo *methodInfo = getMethodInfo(cls, s);

        NSArray<RCTMethodArgument *> *arguments;
        NSString *otherMethodName = RCTParseMethodSignature(methodInfo->objcName, &arguments);

        NSMutableArray *argumentTypes = [NSMutableArray arrayWithCapacity:[arguments count]];
        for (int j = 0; j < [arguments count]; j += 1) {
          [argumentTypes addObject:arguments[j].type];
        }

        NSString *normalizedOtherMethodName = [otherMethodName componentsSeparatedByString:@":"][0];
        methodArgumentTypeNames[normalizedOtherMethodName] = argumentTypes;
      }

      free(methods);
    }

    methodArgumentTypeNames_ = methodArgumentTypeNames;
  }

  if (methodArgumentTypeNames_[methodName]) {
    assert([methodArgumentTypeNames_[methodName] count] > argIndex);
    return methodArgumentTypeNames_[methodName][argIndex];
  }

  return nil;
}

NSInvocation *ObjCTurboModule::getMethodInvocation(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const id<RCTTurboModule> module,
    std::shared_ptr<CallInvoker> jsInvoker,
    const std::string &methodName,
    SEL selector,
    const jsi::Value *args,
    size_t count,
    NSMutableArray *retainedObjectsForInvocation)
{
  NSInvocation *inv =
      [NSInvocation invocationWithMethodSignature:[[module class] instanceMethodSignatureForSelector:selector]];
  [inv setSelector:selector];

  NSMethodSignature *methodSignature = [[module class] instanceMethodSignatureForSelector:selector];

  for (size_t i = 0; i < count; i++) {
    const jsi::Value *arg = &args[i];
    const std::string objCArgType = [methodSignature getArgumentTypeAtIndex:i + 2];

    if (arg->isBool()) {
      bool v = arg->getBool();

      /**
       * JS type checking ensures the Objective C argument here is either a BOOL or NSNumber*.
       */
      if (objCArgType == @encode(id)) {
        id objCArg = [NSNumber numberWithBool:v];
        [inv setArgument:(void *)&objCArg atIndex:i + 2];
        [retainedObjectsForInvocation addObject:objCArg];
      } else {
        [inv setArgument:(void *)&v atIndex:i + 2];
      }

      continue;
    }

    if (arg->isNumber()) {
      double v = arg->getNumber();

      /**
       * JS type checking ensures the Objective C argument here is either a double or NSNumber*.
       */
      if (objCArgType == @encode(id)) {
        id objCArg = [NSNumber numberWithDouble:v];
        [inv setArgument:(void *)&objCArg atIndex:i + 2];
        [retainedObjectsForInvocation addObject:objCArg];
      } else {
        [inv setArgument:(void *)&v atIndex:i + 2];
      }

      continue;
    }

    /**
     * Convert arg to ObjC objects.
     */
    id objCArg = convertJSIValueToObjCObject(runtime, *arg, jsInvoker);

    if (objCArg) {
      NSString *methodNameNSString = @(methodName.c_str());

      /**
       * Convert objects using RCTConvert.
       */
      if (objCArgType == @encode(id)) {
        NSString *argumentType = getArgumentTypeName(methodNameNSString, i);
        if (argumentType != nil) {
          NSString *rctConvertMethodName = [NSString stringWithFormat:@"%@:", argumentType];
          SEL rctConvertSelector = NSSelectorFromString(rctConvertMethodName);

          if ([RCTConvert respondsToSelector:rctConvertSelector]) {
            // Message dispatch logic from old infra
            id (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
            id convertedObjCArg = convert([RCTConvert class], rctConvertSelector, objCArg);

            [inv setArgument:(void *)&convertedObjCArg atIndex:i + 2];
            if (convertedObjCArg) {
              [retainedObjectsForInvocation addObject:convertedObjCArg];
            }
            continue;
          }
        }
      }

      /**
       * Convert objects using RCTCxxConvert to structs.
       */
      if ([objCArg isKindOfClass:[NSDictionary class]] && hasMethodArgConversionSelector(methodNameNSString, i)) {
        SEL methodArgConversionSelector = getMethodArgConversionSelector(methodNameNSString, i);

        // Message dispatch logic from old infra (link: https://git.io/fjf3U)
        RCTManagedPointer *(*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
        RCTManagedPointer *box = convert([RCTCxxConvert class], methodArgConversionSelector, objCArg);

        void *pointer = box.voidPointer;
        [inv setArgument:&pointer atIndex:i + 2];
        [retainedObjectsForInvocation addObject:box];
        continue;
      }
    }

    /**
     * Insert converted args unmodified.
     */
    [inv setArgument:(void *)&objCArg atIndex:i + 2];
    if (objCArg) {
      [retainedObjectsForInvocation addObject:objCArg];
    }
  }

  return inv;
}

ObjCTurboModule::ObjCTurboModule(
    const std::string &name,
    id<RCTTurboModule> instance,
    std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(name, jsInvoker), instance_(instance)
{
}

jsi::Value ObjCTurboModule::invokeObjCMethod(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const std::string &methodName,
    SEL selector,
    const jsi::Value *args,
    size_t count)
{
  NSMutableArray *retainedObjectsForInvocation = [NSMutableArray arrayWithCapacity:count + 2];
  NSInvocation *inv = getMethodInvocation(
      runtime, valueKind, instance_, jsInvoker_, methodName, selector, args, count, retainedObjectsForInvocation);

  if (valueKind == PromiseKind) {
    // Promise return type is special cased today, i.e. it needs extra 2 function args for resolve() and reject(), to
    // be passed to the actual ObjC++ class method.
    return createPromise(
        runtime,
        jsInvoker_,
        ^(jsi::Runtime &rt, RCTPromiseResolveBlock resolveBlock, RCTPromiseRejectBlock rejectBlock) {
          [inv setArgument:(void *)&resolveBlock atIndex:count + 2];
          [inv setArgument:(void *)&rejectBlock atIndex:count + 3];
          [retainedObjectsForInvocation addObject:resolveBlock];
          [retainedObjectsForInvocation addObject:rejectBlock];
          // The return type becomes void in the ObjC side.
          performMethodInvocation(rt, inv, VoidKind, instance_, jsInvoker_, retainedObjectsForInvocation);
        });
  }

  return performMethodInvocation(runtime, inv, valueKind, instance_, jsInvoker_, retainedObjectsForInvocation);
}

BOOL ObjCTurboModule::hasMethodArgConversionSelector(NSString *methodName, int argIndex)
{
  return methodArgConversionSelectors_ && methodArgConversionSelectors_[methodName] &&
      ![methodArgConversionSelectors_[methodName][argIndex] isEqual:[NSNull null]];
}

SEL ObjCTurboModule::getMethodArgConversionSelector(NSString *methodName, int argIndex)
{
  assert(hasMethodArgConversionSelector(methodName, argIndex));
  return (SEL)((NSValue *)methodArgConversionSelectors_[methodName][argIndex]).pointerValue;
}

void ObjCTurboModule::setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName)
{
  if (!methodArgConversionSelectors_) {
    methodArgConversionSelectors_ = [NSMutableDictionary new];
  }

  if (!methodArgConversionSelectors_[methodName]) {
    auto metaData = methodMap_.at([methodName UTF8String]);
    auto argCount = metaData.argCount;

    methodArgConversionSelectors_[methodName] = [NSMutableArray arrayWithCapacity:argCount];
    for (int i = 0; i < argCount; i += 1) {
      [methodArgConversionSelectors_[methodName] addObject:[NSNull null]];
    }
  }

  SEL selector = NSSelectorFromString(fnName);
  NSValue *selectorValue = [NSValue valueWithPointer:selector];

  methodArgConversionSelectors_[methodName][argIndex] = selectorValue;
}

} // namespace react
} // namespace facebook
