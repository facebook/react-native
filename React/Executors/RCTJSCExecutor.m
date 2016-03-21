/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJSCExecutor.h"

#import <pthread.h>

#import <JavaScriptCore/JavaScriptCore.h>
#import <UIKit/UIDevice.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTDefines.h"
#import "RCTDevMenu.h"
#import "RCTJavaScriptLoader.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"
#import "RCTJSCProfiler.h"
#import "RCTRedBox.h"
#import "RCTSourceCode.h"

NSString *const RCTJSCThreadName = @"com.facebook.React.JavaScript";

NSString *const RCTJavaScriptContextCreatedNotification = @"RCTJavaScriptContextCreatedNotification";

static NSString *const RCTJSCProfilerEnabledDefaultsKey = @"RCTJSCProfilerEnabled";

typedef struct ModuleData {
  uint32_t offset;
  uint32_t length;
  uint32_t lineNo;
} ModuleData;

@interface RCTJavaScriptContext : NSObject <RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;
@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

- (instancetype)initWithJSContext:(JSContext *)context NS_DESIGNATED_INITIALIZER;

@end

@implementation RCTJavaScriptContext
{
  RCTJavaScriptContext *_selfReference;
}

- (instancetype)initWithJSContext:(JSContext *)context
{
  if ((self = [super init])) {
    _context = context;

    /**
     * Explicitly introduce a retain cycle here - The RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (JSGlobalContextRef)ctx
{
  return _context.JSGlobalContextRef;
}

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    _context = nil;
    _selfReference = nil;
  }
}

- (void)dealloc
{
  CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
}

@end

@implementation RCTJSCExecutor
{
  RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;

  FILE *_bundle;
  JSStringRef _bundleURL;
  CFMutableDictionaryRef _jsModules;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

static NSString *RCTJSValueToNSString(JSContextRef context, JSValueRef value, JSValueRef *exception)
{
  JSStringRef JSString = JSValueToStringCopy(context, value, exception);
  if (!JSString) {
    return nil;
  }

  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *RCTJSValueToJSONString(JSContextRef context, JSValueRef value, JSValueRef *exception, unsigned indent)
{
  JSStringRef JSString = JSValueCreateJSONString(context, value, indent, exception);
  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSError *RCTNSErrorFromJSError(JSContextRef context, JSValueRef jsError)
{
  NSString *errorMessage = jsError ? RCTJSValueToNSString(context, jsError, NULL) : @"Unknown JS error";
  NSString *details = jsError ? RCTJSValueToJSONString(context, jsError, NULL, 2) : @"No details";
  return [NSError errorWithDomain:@"JS" code:1 userInfo:@{NSLocalizedDescriptionKey: errorMessage, NSLocalizedFailureReasonErrorKey: details}];
}

#if RCT_DEV

static void RCTInstallJSCProfiler(RCTBridge *bridge, JSContextRef context)
{
  if (RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[RCTDevMenuItem toggleItemWithKey:RCTJSCProfilerEnabledDefaultsKey title:@"Start Profiling" selectedTitle:@"Stop Profiling" handler:^(BOOL shouldStart) {
      if (shouldStart != RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          RCTProfileSendResult(bridge, @"cpu-profile", profileData);
        }
      }
    }]];
  }
}

#endif

+ (void)runRunLoopThread
{
  @autoreleasepool {
    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

- (instancetype)init
{
  if (self = [super init]) {
    _valid = YES;

    _javaScriptThread = [[NSThread alloc] initWithTarget:[self class]
                                                selector:@selector(runRunLoopThread)
                                                  object:nil];
    _javaScriptThread.name = @"com.facebook.React.JavaScript";

    if ([_javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
      [_javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
    } else {
      _javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
    }

    [_javaScriptThread start];
  }

  return self;
}

- (RCTJavaScriptContext *)context
{
  RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");

  if (!self.isValid) {
    return nil;
  }

  if (!_context) {
    JSContext *context = [JSContext new];
    _context = [[RCTJavaScriptContext alloc] initWithJSContext:context];
  }

  return _context;
}

- (void)addSynchronousHookWithName:(NSString *)name usingBlock:(id)block
{
  __weak RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    weakSelf.context.context[name] = block;
  }];
}

- (void)setUp
{
  __weak RCTJSCExecutor *weakSelf = self;
  [self addSynchronousHookWithName:@"noop" usingBlock:^{}];

  [self addSynchronousHookWithName:@"nativeLoggingHook" usingBlock:^(NSString *message, NSNumber *logLevel) {
    RCTLogLevel level = RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, logLevel.integerValue);
    }

    _RCTLogJavaScriptInternal(level, message);
  }];

  [self addSynchronousHookWithName:@"nativeRequireModuleConfig" usingBlock:^NSString *(NSString *moduleName) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return nil;
    }

    RCT_PROFILE_BEGIN_EVENT(0, @"nativeRequireModuleConfig", nil);
    NSArray *config = [strongSelf->_bridge configForModuleName:moduleName];
    NSString *result = config ? RCTJSONStringify(config, NULL) : nil;
    RCT_PROFILE_END_EVENT(0, @"js_call,config", @{ @"moduleName": moduleName });
    return result;
  }];

  [self addSynchronousHookWithName:@"nativeFlushQueueImmediate" usingBlock:^(NSArray<NSArray *> *calls){
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid || !calls) {
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(0, @"nativeFlushQueueImmediate", nil);
    [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
    RCT_PROFILE_END_EVENT(0, @"js_call", nil);
  }];

  [self addSynchronousHookWithName:@"nativePerformanceNow" usingBlock:^{
    return @(CACurrentMediaTime() * 1000);
  }];

#if RCT_DEV
  if (RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    [self addSynchronousHookWithName:@"__RCTProfileIsProfiling" usingBlock:@YES];
  }

  CFMutableDictionaryRef cookieMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = RCTProfileBeginAsyncEvent(tag, name, nil);
    CFDictionarySetValue(cookieMap, (const void *)cookie, (const void *)newCookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(cookieMap, (const void *)cookie);
    RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async", nil);
    CFDictionaryRemoveValue(cookieMap, (const void *)cookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceBeginSection" usingBlock:^(NSNumber *tag, NSString *profileName){
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, nil);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndSection" usingBlock:^(NSNumber *tag) {
    RCT_PROFILE_END_EVENT(tag.longLongValue, @"console", nil);
  }];

  __weak RCTBridge *weakBridge = _bridge;
#ifndef __clang_analyzer__
  weakBridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    int64_t newCookie = [_RCTProfileBeginFlowEvent() longLongValue];
    CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    int64_t newCookie = (int64_t)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
    _RCTProfileEndFlowEvent(@(newCookie));
    CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
  }];

  [self executeBlockOnJavaScriptQueue:^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSContext *context = strongSelf.context.context;
    RCTInstallJSCProfiler(_bridge, context.JSGlobalContextRef);

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptContextCreatedNotification
                                                        object:context];
  }];

  for (NSString *event in @[RCTProfileDidStartProfiling, RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }

  // Inject handler used by HMR
  [self addSynchronousHookWithName:@"nativeInjectHMRUpdate" usingBlock:^(NSString *sourceCode, NSString *sourceCodeURL) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSStringRef execJSString = JSStringCreateWithUTF8CString(sourceCode.UTF8String);
    JSStringRef jsURL = JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
    JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, NULL);
    JSStringRelease(jsURL);
    JSStringRelease(execJSString);
  }];
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:RCTProfileDidStartProfiling];
    [_bridge enqueueJSCall:@"Systrace.setEnabled" args:@[enabled ? @YES : @NO]];
  }];
}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

  if (_jsModules) {
    CFRelease(_jsModules);
    fclose(_bundle);
  }

#if RCT_DEV
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
}

- (void)dealloc
{
  [self invalidate];

  [_context performSelector:@selector(invalidate)
                   onThread:_javaScriptThread
                 withObject:nil
              waitUntilDone:NO];
  _context = nil;
}

- (void)flushedQueue:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
                    callback:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"callFunctionReturnFlushedQueue" arguments:@[module, method, args] callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
              callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
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

    // get the BatchedBridge object
    JSStringRef moduleNameJSStringRef = JSStringCreateWithUTF8CString("__fbBatchedBridge");
    JSValueRef moduleJSRef = JSObjectGetProperty(contextJSRef, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
    JSStringRelease(moduleNameJSStringRef);

    if (moduleJSRef != NULL && errorJSRef == NULL && !JSValueIsUndefined(contextJSRef, moduleJSRef)) {
      // get method
      JSStringRef methodNameJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)method);
      JSValueRef methodJSRef = JSObjectGetProperty(contextJSRef, (JSObjectRef)moduleJSRef, methodNameJSStringRef, &errorJSRef);
      JSStringRelease(methodNameJSStringRef);

      if (methodJSRef != NULL && errorJSRef == NULL && !JSValueIsUndefined(contextJSRef, methodJSRef)) {
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
      } else {
        if (!errorJSRef && JSValueIsUndefined(contextJSRef, methodJSRef)) {
          error = RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && JSValueIsUndefined(contextJSRef, moduleJSRef)) {
        error = RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    if (errorJSRef || error) {
      if (!error) {
        error = RCTNSErrorFromJSError(contextJSRef, errorJSRef);
      }
      onComplete(nil, error);
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [RCTJSCExecutorTests testDeserializationPerf]
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
  }), 0, @"js_call", (@{@"method": method, @"args": arguments}))];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssertParam(script);
  RCTAssertParam(sourceURL);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = NSSwapLittleIntToHost(*((uint32_t *)script.bytes));
  BOOL isRAMBundle = magicNumber == RCTRAMBundleMagicNumber;
  if (isRAMBundle) {
    NSError *error;
    script = [self loadRAMBundle:sourceURL error:&error];

    if (error) {
      if (onComplete) {
        onComplete(error);
      }
      return;
    }
  } else {
    // JSStringCreateWithUTF8CString expects a null terminated C string.
    // RAM Bundling already provides a null terminated one.
    NSMutableData *nullTerminatedScript = [NSMutableData dataWithCapacity:script.length + 1];

    [nullTerminatedScript appendData:script];
    [nullTerminatedScript appendBytes:"" length:1];

    script = nullTerminatedScript;
  }

  _bundleURL = JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);

  __weak RCTJSCExecutor *weakSelf = self;

  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    RCTPerformanceLoggerStart(RCTPLScriptExecution);

    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithUTF8CString(script.bytes);
    JSStringRef jsURL = JSStringCreateWithCFString((__bridge CFStringRef)sourceURL.absoluteString);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, &jsError);
    JSStringRelease(jsURL);
    JSStringRelease(execJSString);
    RCTPerformanceLoggerEnd(RCTPLScriptExecution);

    if (onComplete) {
      NSError *error;
      if (!result) {
        error = RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError);
      }
      onComplete(error);
    }
  }), 0, @"js_call", (@{ @"url": sourceURL.absoluteString }))];
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

  __weak RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTJSCExecutor *strongSelf = weakSelf;
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
  }), 0, @"js_call,json_call", (@{@"objectName": objectName}))];
}

static int streq(const char *a, const char *b)
{
  return strcmp(a, b) == 0;
}

static void freeModule(__unused CFAllocatorRef allocator, void *ptr)
{
  free(ptr);
}

static uint32_t readUint32(const void **ptr) {
  uint32_t data;
  memcpy(&data, *ptr, sizeof(uint32_t));
  data = NSSwapLittleIntToHost(data);
  *ptr += sizeof(uint32_t);
  return data;
}

static int readBundle(FILE *fd, size_t offset, size_t length, void *ptr) {
  if (fseek(fd, offset, SEEK_SET) != 0) {
   return 1;
  }

  if (fread(ptr, sizeof(uint8_t), length, fd) != length) {
    return 1;
  }

  return 0;
}

- (void)registerNativeRequire
{
  __weak RCTJSCExecutor *weakSelf = self;
  _context.context[@"nativeRequire"] = ^(NSString *moduleName) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !moduleName) {
      return;
    }

    ModuleData *data = (ModuleData *)CFDictionaryGetValue(strongSelf->_jsModules, moduleName.UTF8String);
    char bytes[data->length];
    if (readBundle(strongSelf->_bundle, data->offset, data->length, bytes) != 0) {
      RCTFatal(RCTErrorWithMessage(@"Error loading RAM module"));
      return;
    }
    JSStringRef code = JSStringCreateWithUTF8CString(bytes);
    JSValueRef jsError = NULL;
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, code, NULL, strongSelf->_bundleURL, data->lineNo, NULL);

    CFDictionaryRemoveValue(strongSelf->_jsModules, moduleName.UTF8String);
    JSStringRelease(code);

    if (!result) {
      dispatch_async(dispatch_get_main_queue(), ^{
        RCTFatal(RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError));
        [strongSelf invalidate];
      });
    }
  };
}

- (NSData *)loadRAMBundle:(NSURL *)sourceURL error:(NSError **)error
{
  _bundle = fopen(sourceURL.path.UTF8String, "r");
  if (!_bundle) {
    if (error) {
      *error = RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  [self registerNativeRequire];

  // once a module has been loaded free its space from the heap, remove it from the index and release the module name
  CFDictionaryKeyCallBacks keyCallbacks = { 0, NULL, (CFDictionaryReleaseCallBack)freeModule, NULL, (CFDictionaryEqualCallBack)streq, (CFDictionaryHashCallBack)strlen };
  CFDictionaryValueCallBacks valueCallbacks = { 0, NULL, (CFDictionaryReleaseCallBack)freeModule, NULL, NULL };
  _jsModules = CFDictionaryCreateMutable(NULL, 0, &keyCallbacks, &valueCallbacks);

  uint32_t currentOffset = sizeof(uint32_t); // skip magic number

  uint32_t tableLength;
  if (readBundle(_bundle, currentOffset, sizeof(tableLength), &tableLength) != 0) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }
  tableLength = NSSwapLittleIntToHost(tableLength);

  currentOffset += sizeof(uint32_t); // skip table length

  // base offset to add to every module's offset to skip the header of the RAM bundle
  uint32_t baseOffset = 4 + tableLength;

  char tableStart[tableLength];
  if (readBundle(_bundle, currentOffset, tableLength, tableStart) != 0) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  void *tableCursor = tableStart;
  void *endOfTable = tableCursor + tableLength;

  while (tableCursor < endOfTable) {
    uint32_t nameLength = strlen((const char *)tableCursor);
    char *name = malloc(nameLength + 1);

    if (!name) {
      if (error) {
        *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
      }
      return nil;
    }

    strcpy(name, tableCursor);

    // the space allocated for each module's metada gets freed when the module is injected into JSC on `nativeRequire`
    ModuleData *moduleData = malloc(sizeof(ModuleData));

    tableCursor += nameLength + 1; // null byte terminator

    moduleData->offset = baseOffset + readUint32((const void **)&tableCursor);
    moduleData->length = readUint32((const void **)&tableCursor);
    moduleData->lineNo = readUint32((const void **)&tableCursor);

    CFDictionarySetValue(_jsModules, name, moduleData);
  }

  ModuleData *startupData = ((ModuleData *)CFDictionaryGetValue(_jsModules, ""));

  void *startupCode;
  if (!(startupCode = malloc(startupData->length))) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  if (readBundle(_bundle, startupData->offset, startupData->length, startupCode) != 0) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    free(startupCode);
    return nil;
  }
  return [NSData dataWithBytesNoCopy:startupCode length:startupData->length freeWhenDone:YES];
}

RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)name)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wtautological-pointer-compare"
  if (JSGlobalContextSetName != NULL) {
#pragma clang diagnostic pop
    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)name);
    JSGlobalContextSetName(_context.ctx, JSName);
    JSStringRelease(JSName);
  }
}

@end
