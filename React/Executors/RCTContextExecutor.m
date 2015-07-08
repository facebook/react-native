/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTContextExecutor.h"

#import <pthread.h>

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTAssert.h"
#import "RCTDefines.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"

@interface RCTJavaScriptContext : NSObject <RCTInvalidating>

@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

- (instancetype)initWithJSContext:(JSGlobalContextRef)context;

@end

@implementation RCTJavaScriptContext
{
  RCTJavaScriptContext *_self;
}

- (instancetype)initWithJSContext:(JSGlobalContextRef)context
{
  if ((self = [super init])) {
    _ctx = context;
    _self = self;
  }
  return self;
}

- (BOOL)isValid
{
  return _ctx != NULL;
}

- (void)invalidate
{
  if (self.isValid) {
    JSGlobalContextRelease(_ctx);
    _ctx = NULL;
    _self = nil;
  }
}

- (void)dealloc
{
  CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
}

@end

@implementation RCTContextExecutor
{
  RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;
}

@synthesize valid = _valid;

RCT_EXPORT_MODULE()

/**
 * The one tiny pure native hook that we implement is a native logging hook.
 * You could even argue that this is not necessary - we could plumb logging
 * calls through a batched bridge, but having the pure native hook allows
 * logging to successfully come through even in the event that a batched bridge
 * crashes.
 */

static JSValueRef RCTNativeLoggingHook(JSContextRef context, __unused JSObjectRef object, __unused JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  if (argumentCount > 0) {
    JSStringRef messageRef = JSValueToStringCopy(context, arguments[0], exception);
    if (!messageRef) {
      return JSValueMakeUndefined(context);
    }
    NSString *message = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, messageRef);
    JSStringRelease(messageRef);
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:
                                  @"( stack: )?([_a-z0-9]*)@?(http://|file:///)[a-z.0-9:/_-]+/([a-z0-9_]+).includeRequire.runModule.bundle(:[0-9]+:[0-9]+)"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:NULL];
    message = [regex stringByReplacingMatchesInString:message
                                              options:0
                                                range:(NSRange){0, message.length}
                                         withTemplate:@"[$4$5]  \t$2"];

    RCTLogLevel level = RCTLogLevelInfo;
    if (argumentCount > 1) {
      level = MAX(level, JSValueToNumber(context, arguments[1], exception) - 1);
    }
    RCTGetLogFunction()(level, nil, nil, message);
  }

  return JSValueMakeUndefined(context);
}

// Do-very-little native hook for testing.
static JSValueRef RCTNoop(JSContextRef context, __unused JSObjectRef object, __unused JSObjectRef thisObject, __unused size_t argumentCount, __unused const JSValueRef arguments[], __unused JSValueRef *exception)
{
  static int counter = 0;
  counter++;
  return JSValueMakeUndefined(context);
}

#if RCT_DEV

static NSMutableArray *profiles;

static JSValueRef RCTConsoleProfile(JSContextRef context, __unused JSObjectRef object, __unused JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], __unused JSValueRef *exception)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    profiles = [[NSMutableArray alloc] init];
  });

  static int profileCounter = 1;
  NSString *profileName;
  NSNumber *profileID = _RCTProfileBeginEvent();

  if (argumentCount > 0) {
    profileName = RCTJSValueToNSString(context, arguments[0]);
  } else {
    profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
  }

  id profileInfo = (id)kCFNull;
  if (argumentCount > 1 && !JSValueIsUndefined(context, arguments[1])) {
    profileInfo = @[RCTJSValueToNSString(context, arguments[1])];
  }

  [profiles addObjectsFromArray:@[profileName, profileID, profileInfo]];

  return JSValueMakeUndefined(context);
}

static JSValueRef RCTConsoleProfileEnd(JSContextRef context, __unused JSObjectRef object, __unused JSObjectRef thisObject, __unused size_t argumentCount, __unused const JSValueRef arguments[], __unused JSValueRef *exception)
{
  NSString *profileInfo = [profiles lastObject];
  [profiles removeLastObject];
  NSNumber *profileID = [profiles lastObject];
  [profiles removeLastObject];
  NSString *profileName = [profiles lastObject];
  [profiles removeLastObject];

  if (argumentCount > 0 && !JSValueIsUndefined(context, arguments[0])) {
    profileName = RCTJSValueToNSString(context, arguments[0]);
  }

  _RCTProfileEndEvent(profileID, profileName, @"console", profileInfo);

  return JSValueMakeUndefined(context);
}

#endif

static NSString *RCTJSValueToNSString(JSContextRef context, JSValueRef value)
{
  JSStringRef JSString = JSValueToStringCopy(context, value, NULL);
  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *RCTJSValueToJSONString(JSContextRef context, JSValueRef value, unsigned indent)
{
  JSStringRef JSString = JSValueCreateJSONString(context, value, indent, NULL);
  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSError *RCTNSErrorFromJSError(JSContextRef context, JSValueRef jsError)
{
  NSString *errorMessage = jsError ? RCTJSValueToNSString(context, jsError) : @"unknown JS error";
  NSString *details = jsError ? RCTJSValueToJSONString(context, jsError, 2) : @"no details";
  return [NSError errorWithDomain:@"JS" code:1 userInfo:@{NSLocalizedDescriptionKey: errorMessage, NSLocalizedFailureReasonErrorKey: details}];
}

+ (void)runRunLoopThread
{
  @autoreleasepool {
    // copy thread name to pthread name
    pthread_setname_np([[[NSThread currentThread] name] UTF8String]);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, [[NSDate distantFuture] timeIntervalSinceReferenceDate], NO)) {
      RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

- (instancetype)init
{
  NSThread *javaScriptThread = [[NSThread alloc] initWithTarget:[self class]
                                                       selector:@selector(runRunLoopThread)
                                                         object:nil];
  [javaScriptThread setName:@"com.facebook.React.JavaScript"];
  [javaScriptThread setThreadPriority:[[NSThread mainThread] threadPriority]];
  [javaScriptThread start];

  return [self initWithJavaScriptThread:javaScriptThread globalContextRef:NULL];
}

- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                        globalContextRef:(JSGlobalContextRef)context
{
  RCTAssert(javaScriptThread != nil,
            @"Can't initialize RCTContextExecutor without a javaScriptThread");

  if ((self = [super init])) {
    _valid = YES;
    _javaScriptThread = javaScriptThread;
    __weak RCTContextExecutor *weakSelf = self;
    [self executeBlockOnJavaScriptQueue: ^{
      RCTContextExecutor *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      // Assumes that no other JS tasks are scheduled before.
      JSGlobalContextRef ctx;
      if (context) {
        ctx = JSGlobalContextRetain(context);
        strongSelf->_context = [[RCTJavaScriptContext alloc] initWithJSContext:ctx];
      }
    }];
  }

  return self;
}

- (void)setUp
{
  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf.isValid) {
      return;
    }
    if (!strongSelf->_context) {
      JSGlobalContextRef ctx = JSGlobalContextCreate(NULL);
      strongSelf->_context = [[RCTJavaScriptContext alloc] initWithJSContext:ctx];
    }
    [strongSelf _addNativeHook:RCTNativeLoggingHook withName:"nativeLoggingHook"];
    [strongSelf _addNativeHook:RCTNoop withName:"noop"];
#if RCT_DEV
    [strongSelf _addNativeHook:RCTConsoleProfile withName:"consoleProfile"];
    [strongSelf _addNativeHook:RCTConsoleProfileEnd withName:"consoleProfileEnd"];

    for (NSString *event in @[RCTProfileDidStartProfiling, RCTProfileDidEndProfiling]) {
      [[NSNotificationCenter defaultCenter] addObserver:strongSelf
                                               selector:@selector(toggleProfilingFlag:)
                                                   name:event
                                                 object:nil];
    }
#endif
  }];
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  JSObjectRef globalObject = JSContextGetGlobalObject(_context.ctx);

  bool enabled = [notification.name isEqualToString:RCTProfileDidStartProfiling];
  JSStringRef JSName = JSStringCreateWithUTF8CString("__BridgeProfilingIsProfiling");
  JSObjectSetProperty(_context.ctx,
                      globalObject,
                      JSName,
                      JSValueMakeBoolean(_context.ctx, enabled),
                      kJSPropertyAttributeNone,
                      NULL);
  JSStringRelease(JSName);
}

- (void)_addNativeHook:(JSObjectCallAsFunctionCallback)hook withName:(const char *)name
{
  JSObjectRef globalObject = JSContextGetGlobalObject(_context.ctx);

  JSStringRef JSName = JSStringCreateWithUTF8CString(name);
  JSObjectSetProperty(_context.ctx, globalObject, JSName, JSObjectMakeFunctionWithCallback(_context.ctx, JSName, hook), kJSPropertyAttributeNone, NULL);
  JSStringRelease(JSName);

}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

#if RCT_DEV
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif

  [_context performSelector:@selector(invalidate)
                   onThread:_javaScriptThread
                 withObject:nil
              waitUntilDone:NO];
}

- (void)dealloc
{
  [self invalidate];
}

- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
              context:(NSNumber *)executorID
             callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid || ![RCTGetExecutorID(strongSelf) isEqualToNumber:executorID]) {
      return;
    }
    NSError *error;
    NSString *argsString = (arguments.count == 1) ? RCTJSONStringify(arguments[0], &error) : RCTJSONStringify(arguments, &error);
    if (!argsString) {
      RCTLogError(@"Cannot convert argument to string: %@", error);
      onComplete(nil, error);
      return;
    }

    JSValueRef errorJSRef = NULL;
    JSValueRef resultJSRef = NULL;
    JSGlobalContextRef contextJSRef = JSContextGetGlobalContext(strongSelf->_context.ctx);
    JSObjectRef globalObjectJSRef = JSContextGetGlobalObject(strongSelf->_context.ctx);

    // get require
    JSStringRef requireNameJSStringRef = JSStringCreateWithUTF8CString("require");
    JSValueRef requireJSRef = JSObjectGetProperty(contextJSRef, globalObjectJSRef, requireNameJSStringRef, &errorJSRef);
    JSStringRelease(requireNameJSStringRef);

    if (requireJSRef != NULL && !JSValueIsUndefined(contextJSRef, requireJSRef) && errorJSRef == NULL) {

      // get module
      JSStringRef moduleNameJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)name);
      JSValueRef moduleNameJSRef = JSValueMakeString(contextJSRef, moduleNameJSStringRef);
      JSValueRef moduleJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)requireJSRef, NULL, 1, (const JSValueRef *)&moduleNameJSRef, &errorJSRef);
      JSStringRelease(moduleNameJSStringRef);

      if (moduleJSRef != NULL && errorJSRef == NULL && !JSValueIsUndefined(contextJSRef, moduleJSRef)) {

        // get method
        JSStringRef methodNameJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)method);
        JSValueRef methodJSRef = JSObjectGetProperty(contextJSRef, (JSObjectRef)moduleJSRef, methodNameJSStringRef, &errorJSRef);
        JSStringRelease(methodNameJSStringRef);

        if (methodJSRef != NULL && errorJSRef == NULL) {

          // direct method invoke with no arguments
          if (arguments.count == 0) {
            resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)moduleJSRef, 0, NULL, &errorJSRef);
          }

          // direct method invoke with 1 argument
          else if(arguments.count == 1) {
            JSStringRef argsJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)argsString);
            JSValueRef argsJSRef = JSValueMakeFromJSONString(contextJSRef, argsJSStringRef);
            resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)moduleJSRef, 1, &argsJSRef, &errorJSRef);
            JSStringRelease(argsJSStringRef);

          } else {
            // apply invoke with array of arguments
            JSStringRef applyNameJSStringRef = JSStringCreateWithUTF8CString("apply");
            JSValueRef applyJSRef = JSObjectGetProperty(contextJSRef, (JSObjectRef)methodJSRef, applyNameJSStringRef, &errorJSRef);
            JSStringRelease(applyNameJSStringRef);

            if (applyJSRef != NULL && errorJSRef == NULL) {
              // invoke apply
              JSStringRef argsJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)argsString);
              JSValueRef argsJSRef = JSValueMakeFromJSONString(contextJSRef, argsJSStringRef);

              JSValueRef args[2];
              args[0] = JSValueMakeNull(contextJSRef);
              args[1] = argsJSRef;

              resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)applyJSRef, (JSObjectRef)methodJSRef, 2, args, &errorJSRef);
              JSStringRelease(argsJSStringRef);
            }
          }
        }
      }
    }

    if (!resultJSRef) {
      onComplete(nil, RCTNSErrorFromJSError(contextJSRef, errorJSRef));
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [RCTContextExecutorTests testDeserializationPerf]
    id objcValue;
    // We often return `null` from JS when there is nothing for native side. JSONKit takes an extra hundred microseconds
    // to handle this simple case, so we are adding a shortcut to make executeJSCall method even faster
    if (!JSValueIsNull(contextJSRef, resultJSRef)) {
      JSStringRef jsJSONString = JSValueCreateJSONString(contextJSRef, resultJSRef, 0, nil);
      if (jsJSONString) {
        NSString *objcJSONString = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsJSONString);
        JSStringRelease(jsJSONString);

        objcValue = RCTJSONParse(objcJSONString, NULL);
      }
    }

    onComplete(objcValue, nil);
  }), @"js_call", (@{@"module":name, @"method": method, @"args": arguments}))];
}

- (void)executeApplicationScript:(NSString *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(sourceURL != nil, @"url should not be nil");

  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    RCTPerformanceLoggerStart(RCTPLAppScriptExecution);
    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSStringRef jsURL = JSStringCreateWithCFString((__bridge CFStringRef)sourceURL.absoluteString);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, &jsError);
    JSStringRelease(jsURL);
    JSStringRelease(execJSString);
    RCTPerformanceLoggerEnd(RCTPLAppScriptExecution);

    if (onComplete) {
      NSError *error;
      if (!result) {
        error = RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError);
      }
      onComplete(error);
    }
  }), @"js_call", (@{ @"url": sourceURL.absoluteString }))];
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  if ([NSThread currentThread] != _javaScriptThread) {
    [self performSelector:@selector(executeBlockOnJavaScriptQueue:)
                 onThread:_javaScriptThread withObject:block waitUntilDone:NO];
  } else {
    block();
  }
}

- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  [self performSelector:@selector(executeBlockOnJavaScriptQueue:)
               onThread:_javaScriptThread
             withObject:block
          waitUntilDone:NO];
}

- (void)_runBlock:(dispatch_block_t)block
{
  block();
}

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  if (RCT_DEBUG) {
    RCTAssert(RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSValueRef valueToInject = JSValueMakeFromJSONString(strongSelf->_context.ctx, execJSString);
    JSStringRelease(execJSString);

    if (!valueToInject) {
      NSString *errorDesc = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      RCTLogError(@"%@", errorDesc);

      if (onComplete) {
        NSError *error = [NSError errorWithDomain:@"JS" code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
        onComplete(error);
      }
      return;
    }

    JSObjectRef globalObject = JSContextGetGlobalObject(strongSelf->_context.ctx);
    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)objectName);
    JSObjectSetProperty(strongSelf->_context.ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, NULL);
    JSStringRelease(JSName);
    if (onComplete) {
      onComplete(nil);
    }
  }), @"js_call,json_call", (@{@"objectName": objectName}))];
}

@end
