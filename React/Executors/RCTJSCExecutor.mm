/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJSCExecutor.h"

#import <cinttypes>
#import <memory>
#import <pthread.h>
#import <string>
#import <unordered_map>

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
#import "RCTJSCWrapper.h"
#import "RCTJSCErrorHandling.h"

NSString *const RCTJSCThreadName = @"com.facebook.react.JavaScript";
NSString *const RCTJavaScriptContextCreatedNotification = @"RCTJavaScriptContextCreatedNotification";
RCT_EXTERN NSString *const RCTFBJSContextClassKey = @"_RCTFBJSContextClassKey";
RCT_EXTERN NSString *const RCTFBJSValueClassKey = @"_RCTFBJSValueClassKey";

static NSString *const RCTJSCProfilerEnabledDefaultsKey = @"RCTJSCProfilerEnabled";

struct __attribute__((packed)) ModuleData {
  uint32_t offset;
  uint32_t size;
};

using file_ptr = std::unique_ptr<FILE, decltype(&fclose)>;
using memory_ptr = std::unique_ptr<void, decltype(&free)>;

struct RandomAccessBundleData {
  file_ptr bundle;
  size_t baseOffset;
  size_t numTableEntries;
  std::unique_ptr<ModuleData[]> table;
  RandomAccessBundleData(): bundle(nullptr, fclose) {}
};

struct RandomAccessBundleStartupCode {
  memory_ptr code;
  size_t size;
  static RandomAccessBundleStartupCode empty() {
    return RandomAccessBundleStartupCode{memory_ptr(nullptr, free), 0};
  };
  bool isEmpty() {
    return !code;
  }
};

#if RCT_PROFILE
@interface RCTCookieMap : NSObject
{
  @package
  std::unordered_map<NSUInteger, NSUInteger> _cookieMap;
}
@end
@implementation RCTCookieMap @end
#endif

struct RCTJSContextData {
  BOOL useCustomJSCLibrary;
  NSThread *javaScriptThread;
  JSContext *context;
  RCTJSCWrapper *jscWrapper;
};

@interface RCTJSContextProvider ()
/** May only be called once, or deadlock will result. */
- (RCTJSContextData)data;
@end

@interface RCTJavaScriptContext : NSObject <RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation RCTJavaScriptContext
{
  RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _context.name = @"RCTJSContext";
    _javaScriptThread = javaScriptThread;

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

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation RCTJSCExecutor
{
  // Set at init time:
  BOOL _useCustomJSCLibrary;
  NSThread *_javaScriptThread;

  // Set at setUp time:
  RCTPerformanceLogger *_performanceLogger;
  RCTJSCWrapper *_jscWrapper;
  RCTJavaScriptContext *_context;

  // Set as needed:
  RandomAccessBundleData _randomAccessBundle;
  JSValueRef _batchedBridgeRef;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

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

static NSThread *newJavaScriptThread(void)
{
  NSThread *javaScriptThread = [[NSThread alloc] initWithTarget:[RCTJSCExecutor class]
                                                       selector:@selector(runRunLoopThread)
                                                         object:nil];
  javaScriptThread.name = RCTJSCThreadName;
  if ([javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
    [javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
  } else {
    javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
  }
  [javaScriptThread start];
  return javaScriptThread;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _performanceLogger = [bridge performanceLogger];
}

- (instancetype)init
{
  return [self initWithUseCustomJSCLibrary:NO];
}

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary
{
  RCT_PROFILE_BEGIN_EVENT(0, @"-[RCTJSCExecutor init]", nil);

  if (self = [super init]) {
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = newJavaScriptThread();
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  return self;
}

+ (instancetype)initializedExecutorWithContextProvider:(RCTJSContextProvider *)JSContextProvider
                                     applicationScript:(NSData *)applicationScript
                                             sourceURL:(NSURL *)sourceURL
                                             JSContext:(JSContext **)JSContext
                                                 error:(NSError **)error
{
  const RCTJSContextData data = JSContextProvider.data;
  if (JSContext) {
    *JSContext = data.context;
  }
  RCTJSCExecutor *executor = [[RCTJSCExecutor alloc] initWithJSContextData:data];
  if (applicationScript && ![executor _synchronouslyExecuteApplicationScript:applicationScript sourceURL:sourceURL JSContext:data.context error:error]) {
    return nil; // error has been set by _synchronouslyExecuteApplicationScript:
  }
  return executor;
}

- (instancetype)initWithJSContextData:(const RCTJSContextData &)data
{
  if (self = [super init]) {
    _useCustomJSCLibrary = data.useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = data.javaScriptThread;
    _jscWrapper = data.jscWrapper;
    _context = [[RCTJavaScriptContext alloc] initWithJSContext:data.context onThread:_javaScriptThread];
  }
  return self;
}

- (BOOL)_synchronouslyExecuteApplicationScript:(NSData *)script
                                     sourceURL:(NSURL *)sourceURL
                                     JSContext:(JSContext *)context
                                         error:(NSError **)error
{
  BOOL isRAMBundle = NO;
  script = loadPossiblyBundledApplicationScript(script, sourceURL, _performanceLogger, isRAMBundle, _randomAccessBundle, error);
  if (!script) {
    return NO;
  }
  if (isRAMBundle) {
    registerNativeRequire(context, self);
  }
  NSError *returnedError = executeApplicationScript(script, sourceURL, _jscWrapper, _performanceLogger, _context.context.JSGlobalContextRef);
  if (returnedError) {
    if (error) {
      *error = returnedError;
    }
    return NO;
  } else {
    return YES;
  }
}

- (RCTJavaScriptContext *)context
{
  RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");
  if (!self.isValid) {
    return nil;
  }
  RCTAssert(_context != nil, @"Fetching context while valid, but before it is created");
  return _context;
}

- (void)setUp
{
#if RCT_PROFILE
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];

  for (NSString *event in @[RCTProfileDidStartProfiling, RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }
#endif

  [self executeBlockOnJavaScriptQueue:^{
    if (!self.valid) {
      return;
    }

    JSContext *context = nil;
    if (self->_jscWrapper) {
      RCTAssert(self->_context != nil, @"If wrapper was pre-initialized, context should be too");
      context = self->_context.context;
    } else {
      [self->_performanceLogger markStartForTag:RCTPLJSCWrapperOpenLibrary];
      self->_jscWrapper = RCTJSCWrapperCreate(self->_useCustomJSCLibrary);
      [self->_performanceLogger markStopForTag:RCTPLJSCWrapperOpenLibrary];

      RCTAssert(self->_context == nil, @"Didn't expect to set up twice");
      context = [self->_jscWrapper->JSContext new];
      self->_context = [[RCTJavaScriptContext alloc] initWithJSContext:context onThread:self->_javaScriptThread];
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptContextCreatedNotification
                                                          object:context];

      installBasicSynchronousHooksOnContext(context);
    }

    NSMutableDictionary *threadDictionary = [[NSThread currentThread] threadDictionary];
    if (!threadDictionary[RCTFBJSContextClassKey] || !threadDictionary[RCTFBJSValueClassKey]) {
      threadDictionary[RCTFBJSContextClassKey] = self->_jscWrapper->JSContext;
      threadDictionary[RCTFBJSValueClassKey] = self->_jscWrapper->JSValue;
    }

    __weak RCTJSCExecutor *weakSelf = self;

    context[@"nativeRequireModuleConfig"] = ^NSArray *(NSString *moduleName) {
      RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"nativeRequireModuleConfig", @{ @"moduleName": moduleName });
      NSArray *result = [strongSelf->_bridge configForModuleName:moduleName];
      RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call,config");
      return RCTNullIfNil(result);
    };

    context[@"nativeFlushQueueImmediate"] = ^(NSArray<NSArray *> *calls){
      RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid || !calls) {
        return;
      }

      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
      [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
      RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call");
    };

    context[@"nativeCallSyncHook"] = ^id(NSUInteger module, NSUInteger method, NSArray *args) {
      RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"nativeCallSyncHook", nil);
      id result = [strongSelf->_bridge callNativeModule:module method:method params:args];
      RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call,config");
      return result;
    };

#if RCT_PROFILE
    __weak RCTBridge *weakBridge = self->_bridge;
    context[@"nativeTraceBeginAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = _RCTProfileBeginFlowEvent();
        CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };

    context[@"nativeTraceEndAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
        _RCTProfileEndFlowEvent(newCookie);
        CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };
#endif

#if RCT_DEV
    RCTInstallJSCProfiler(self->_bridge, context.JSGlobalContextRef);

    // Inject handler used by HMR
    context[@"nativeInjectHMRUpdate"] = ^(NSString *sourceCode, NSString *sourceCodeURL) {
      RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return;
      }

      RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
      JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString(sourceCode.UTF8String);
      JSStringRef jsURL = jscWrapper->JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
      jscWrapper->JSEvaluateScript(strongSelf->_context.context.JSGlobalContextRef, execJSString, NULL, jsURL, 0, NULL);
      jscWrapper->JSStringRelease(jsURL);
      jscWrapper->JSStringRelease(execJSString);
    };
#endif
  }];
}

/** Installs synchronous hooks that don't require a weak reference back to the RCTJSCExecutor. */
static void installBasicSynchronousHooksOnContext(JSContext *context)
{
  context[@"nativeLoggingHook"] = ^(NSString *message, NSNumber *logLevel) {
    RCTLogLevel level = RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (RCTLogLevel)logLevel.integerValue);
    }

    _RCTLogJavaScriptInternal(level, message);
  };
  context[@"nativePerformanceNow"] = ^{
    return @(CACurrentMediaTime() * 1000);
  };
#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    context[@"__RCTProfileIsProfiling"] = @YES;
  }
  context[@"nativeTraceBeginSection"] = ^(NSNumber *tag, NSString *profileName, NSDictionary *args) {
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, args);
  };
  context[@"nativeTraceEndSection"] = ^(NSNumber *tag) {
    RCT_PROFILE_END_EVENT(tag.longLongValue, @"console");
  };
  RCTCookieMap *cookieMap = [RCTCookieMap new];
  context[@"nativeTraceBeginAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = RCTProfileBeginAsyncEvent(tag, name, nil);
    cookieMap->_cookieMap.insert({cookie, newCookie});
  };
  context[@"nativeTraceEndAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = 0;
    const auto &it = cookieMap->_cookieMap.find(cookie);
    if (it != cookieMap->_cookieMap.end()) {
      newCookie = it->second;
      cookieMap->_cookieMap.erase(it);
    }
    RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async");
  };
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:RCTProfileDidStartProfiling];
    [self->_bridge enqueueJSCall:@"Systrace"
                          method:@"setEnabled"
                            args:@[enabled ? @YES : @NO]
                      completion:NULL];
  }];
}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

#if RCT_PROFILE
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
}

- (NSString *)contextName
{
  return [_context.context name];
}

RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)contextName)
{
  [_context.context setName:contextName];
}

- (void)dealloc
{
  [self invalidate];

  [_context performSelector:@selector(invalidate)
                   onThread:_javaScriptThread
                 withObject:nil
              waitUntilDone:NO];
  _context = nil;

  _randomAccessBundle.bundle.reset();
  _randomAccessBundle.table.reset();

  if (_jscWrapper) {
    RCTJSCWrapperRelease(_jscWrapper);
    _jscWrapper = NULL;
  }
}

- (void)flushedQueue:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] unwrapResult:YES callback:onComplete];
}

- (void)_callFunctionOnModule:(NSString *)module
                       method:(NSString *)method
                    arguments:(NSArray *)args
                  returnValue:(BOOL)returnValue
                 unwrapResult:(BOOL)unwrapResult
                     callback:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  NSString *bridgeMethod = returnValue ? @"callFunctionReturnFlushedQueue" : @"callFunctionReturnResultAndFlushedQueue";
  [self _executeJSCall:bridgeMethod arguments:@[module, method, args] unwrapResult:unwrapResult callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args callback:(RCTJavaScriptCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:YES unwrapResult:YES callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args jsValueCallback:(RCTJavaScriptValueCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:NO unwrapResult:NO callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] unwrapResult:YES callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
          unwrapResult:(BOOL)unwrapResult
              callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(0, @"executeJSCall", (@{@"method": method, @"args": arguments}));

    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSContext *context = strongSelf->_context.context;
    JSGlobalContextRef contextJSRef = context.JSGlobalContextRef;

    // get the BatchedBridge object
    JSValueRef errorJSRef = NULL;
    JSValueRef batchedBridgeRef = strongSelf->_batchedBridgeRef;
    if (!batchedBridgeRef) {
      JSStringRef moduleNameJSStringRef = jscWrapper->JSStringCreateWithUTF8CString("__fbBatchedBridge");
      JSObjectRef globalObjectJSRef = jscWrapper->JSContextGetGlobalObject(contextJSRef);
      batchedBridgeRef = jscWrapper->JSObjectGetProperty(contextJSRef, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
      jscWrapper->JSStringRelease(moduleNameJSStringRef);
      strongSelf->_batchedBridgeRef = batchedBridgeRef;
    }

    NSError *error;
    JSValueRef resultJSRef = NULL;
    if (batchedBridgeRef != NULL && errorJSRef == NULL && !jscWrapper->JSValueIsUndefined(contextJSRef, batchedBridgeRef)) {
      // get method
      JSStringRef methodNameJSStringRef = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)method);
      JSValueRef methodJSRef = jscWrapper->JSObjectGetProperty(contextJSRef, (JSObjectRef)batchedBridgeRef, methodNameJSStringRef, &errorJSRef);
      jscWrapper->JSStringRelease(methodNameJSStringRef);

      if (methodJSRef != NULL && errorJSRef == NULL && !jscWrapper->JSValueIsUndefined(contextJSRef, methodJSRef)) {
        JSValueRef jsArgs[arguments.count];
        for (NSUInteger i = 0; i < arguments.count; i++) {
          jsArgs[i] = [jscWrapper->JSValue valueWithObject:arguments[i] inContext:context].JSValueRef;
        }
        resultJSRef = jscWrapper->JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)batchedBridgeRef, arguments.count, jsArgs, &errorJSRef);
      } else {
        if (!errorJSRef && jscWrapper->JSValueIsUndefined(contextJSRef, methodJSRef)) {
          error = RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && jscWrapper->JSValueIsUndefined(contextJSRef, batchedBridgeRef)) {
        error = RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    id objcValue;
    if (errorJSRef || error) {
      if (!error) {
        error = RCTNSErrorFromJSError([jscWrapper->JSValue valueWithJSValueRef:errorJSRef inContext:context]);
      }
    } else {
      // We often return `null` from JS when there is nothing for native side. [JSValue toValue]
      // returns [NSNull null] in this case, which we don't want.
      if (!jscWrapper->JSValueIsNull(contextJSRef, resultJSRef)) {
        JSValue *result = [jscWrapper->JSValue valueWithJSValueRef:resultJSRef inContext:context];
        objcValue = unwrapResult ? [result toObject] : result;
      }
    }

    RCT_PROFILE_END_EVENT(0, @"js_call");

    onComplete(objcValue, error);
  }];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssertParam(script);
  RCTAssertParam(sourceURL);

  BOOL isRAMBundle = NO;
  {
    NSError *error;
    script = loadPossiblyBundledApplicationScript(script, sourceURL, _performanceLogger, isRAMBundle, _randomAccessBundle, &error);
    if (script == nil) {
      if (onComplete) {
        onComplete(error);
      }
      return;
    }
  }

  RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();
    if (!self.isValid) {
      return;
    }

    if (isRAMBundle) {
      registerNativeRequire(self.context.context, self);
    }

    NSError *error = executeApplicationScript(script, sourceURL, self->_jscWrapper, self->_performanceLogger,
                                              self->_context.context.JSGlobalContextRef);
    if (onComplete) {
      onComplete(error);
    }
  }];
}

static NSData *loadPossiblyBundledApplicationScript(NSData *script, NSURL *sourceURL,
                                                    RCTPerformanceLogger *performanceLogger,
                                                    BOOL &isRAMBundle, RandomAccessBundleData &randomAccessBundle,
                                                    NSError **error)
{
  RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / prepare bundle", nil);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = 0;
  [script getBytes:&magicNumber length:sizeof(magicNumber)];
  isRAMBundle = NSSwapLittleIntToHost(magicNumber) == RCTRAMBundleMagicNumber;
  if (isRAMBundle) {
    [performanceLogger markStartForTag:RCTPLRAMBundleLoad];
    script = loadRAMBundle(sourceURL, error, randomAccessBundle);
    [performanceLogger markStopForTag:RCTPLRAMBundleLoad];
    [performanceLogger setValue:script.length forTag:RCTPLRAMStartupCodeSize];
  } else {
    // JSStringCreateWithUTF8CString expects a null terminated C string.
    // RAM Bundling already provides a null terminated one.
    NSMutableData *nullTerminatedScript = [NSMutableData dataWithCapacity:script.length + 1];
    [nullTerminatedScript appendData:script];
    [nullTerminatedScript appendBytes:"" length:1];
    script = nullTerminatedScript;
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  return script;
}

static void registerNativeRequire(JSContext *context, RCTJSCExecutor *executor)
{
  __weak RCTJSCExecutor *weakExecutor = executor;
  context[@"nativeRequire"] = ^(NSNumber *moduleID) { [weakExecutor _nativeRequire:moduleID]; };
}

static NSError *executeApplicationScript(NSData *script, NSURL *sourceURL, RCTJSCWrapper *jscWrapper,
                                         RCTPerformanceLogger *performanceLogger, JSGlobalContextRef ctx)
{
  RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / execute script", (@{
    @"url": sourceURL.absoluteString, @"size": @(script.length)
  }));
  [performanceLogger markStartForTag:RCTPLScriptExecution];
  JSValueRef jsError = NULL;
  JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString((const char *)script.bytes);
  JSStringRef bundleURL = jscWrapper->JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);
  jscWrapper->JSEvaluateScript(ctx, execJSString, NULL, bundleURL, 0, &jsError);
  jscWrapper->JSStringRelease(bundleURL);
  jscWrapper->JSStringRelease(execJSString);
  [performanceLogger markStopForTag:RCTPLScriptExecution];

  NSError *error = jsError ? RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper) : nil;
  RCT_PROFILE_END_EVENT(0, @"js_call");
  return error;
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

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  if (RCT_DEBUG) {
    RCTAssert(RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak RCTJSCExecutor *weakSelf = self;
  RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();

    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(0, @"injectJSONText", @{@"objectName": objectName});
    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSGlobalContextRef ctx = strongSelf->_context.context.JSGlobalContextRef;
    JSValueRef valueToInject = jscWrapper->JSValueMakeFromJSONString(ctx, execJSString);
    jscWrapper->JSStringRelease(execJSString);

    NSError *error;
    if (!valueToInject) {
      NSString *errorMessage = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      error = [NSError errorWithDomain:RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
      RCTLogError(@"%@", errorMessage);
    } else {
      JSObjectRef globalObject = jscWrapper->JSContextGetGlobalObject(ctx);
      JSStringRef JSName = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)objectName);
      JSValueRef jsError = NULL;
      jscWrapper->JSObjectSetProperty(ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, &jsError);
      jscWrapper->JSStringRelease(JSName);

      if (jsError) {
        error = RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper);
      }
    }
    RCT_PROFILE_END_EVENT(0, @"js_call,json_call");

    if (onComplete) {
      onComplete(error);
    }
  }];
}

static bool readRandomAccessModule(const RandomAccessBundleData &bundleData, size_t offset, size_t size, char *data)
{
  return fseek(bundleData.bundle.get(), offset + bundleData.baseOffset, SEEK_SET) == 0 &&
         fread(data, 1, size, bundleData.bundle.get()) == size;
}

static void executeRandomAccessModule(RCTJSCExecutor *executor, uint32_t moduleID, size_t offset, size_t size)
{
  auto data = std::make_unique<char[]>(size);
  if (!readRandomAccessModule(executor->_randomAccessBundle, offset, size, data.get())) {
    RCTFatal(RCTErrorWithMessage(@"Error loading RAM module"));
    return;
  }

  char url[14]; // 10 = maximum decimal digits in a 32bit unsigned int + ".js" + null byte
  sprintf(url, "%" PRIu32 ".js", moduleID);

  RCTJSCWrapper *jscWrapper = executor->_jscWrapper;
  JSStringRef code = jscWrapper->JSStringCreateWithUTF8CString(data.get());
  JSValueRef jsError = NULL;
  JSStringRef sourceURL = jscWrapper->JSStringCreateWithUTF8CString(url);
  JSGlobalContextRef ctx = executor->_context.context.JSGlobalContextRef;
  JSValueRef result = jscWrapper->JSEvaluateScript(ctx, code, NULL, sourceURL, 0, &jsError);

  jscWrapper->JSStringRelease(code);
  jscWrapper->JSStringRelease(sourceURL);

  if (!result) {
    NSError *error = RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper);
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTFatal(error);
      [executor invalidate];
    });
  }
}

- (void)_nativeRequire:(NSNumber *)moduleID
{
  if (!moduleID) {
    return;
  }

  [_performanceLogger addValue:1 forTag:RCTPLRAMNativeRequiresCount];
  [_performanceLogger appendStartForTag:RCTPLRAMNativeRequires];
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, ([@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID]), nil);

  const uint32_t ID = [moduleID unsignedIntValue];

  if (ID < _randomAccessBundle.numTableEntries) {
    ModuleData *moduleData = &_randomAccessBundle.table[ID];
    const uint32_t size = NSSwapLittleIntToHost(moduleData->size);

    // sparse entry in the table -- module does not exist or is contained in the startup section
    if (size == 0) {
      return;
    }

    executeRandomAccessModule(self, ID, NSSwapLittleIntToHost(moduleData->offset), size);
  }

  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call");
  [_performanceLogger appendStopForTag:RCTPLRAMNativeRequires];
}

static RandomAccessBundleStartupCode readRAMBundle(file_ptr bundle, RandomAccessBundleData &randomAccessBundle)
{
  // read in magic header, number of entries, and length of the startup section
  uint32_t header[3];
  if (fread(&header, 1, sizeof(header), bundle.get()) != sizeof(header)) {
    return RandomAccessBundleStartupCode::empty();
  }

  const size_t numTableEntries = NSSwapLittleIntToHost(header[1]);
  const size_t startupCodeSize = NSSwapLittleIntToHost(header[2]);
  const size_t tableSize = numTableEntries * sizeof(ModuleData);

  // allocate memory for meta data and lookup table. malloc instead of new to avoid constructor calls
  auto table = std::make_unique<ModuleData[]>(numTableEntries);
  if (!table) {
    return RandomAccessBundleStartupCode::empty();
  }

  // read the lookup table from the file
  if (fread(table.get(), 1, tableSize, bundle.get()) != tableSize) {
    return RandomAccessBundleStartupCode::empty();
  }

  // read the startup code
  memory_ptr code(malloc(startupCodeSize), free);
  if (!code || fread(code.get(), 1, startupCodeSize, bundle.get()) != startupCodeSize) {
    return RandomAccessBundleStartupCode::empty();
  }

  randomAccessBundle.bundle = std::move(bundle);
  randomAccessBundle.baseOffset = sizeof(header) + tableSize;
  randomAccessBundle.numTableEntries = numTableEntries;
  randomAccessBundle.table = std::move(table);

  return {std::move(code), startupCodeSize};
}

static NSData *loadRAMBundle(NSURL *sourceURL, NSError **error, RandomAccessBundleData &randomAccessBundle)
{
  file_ptr bundle(fopen(sourceURL.path.UTF8String, "r"), fclose);
  if (!bundle) {
    if (error) {
      *error = RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  auto startupCode = readRAMBundle(std::move(bundle), randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  return [NSData dataWithBytesNoCopy:startupCode.code.release() length:startupCode.size freeWhenDone:YES];
}

@end

@implementation RCTJSContextProvider
{
  dispatch_semaphore_t _semaphore;
  NSThread *_javaScriptThread;
  JSContext *_context;
  RCTJSCWrapper *_jscWrapper;
}

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary
{
  if (self = [super init]) {
    _semaphore = dispatch_semaphore_create(0);
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _javaScriptThread = newJavaScriptThread();
    [self performSelector:@selector(_createContext) onThread:_javaScriptThread withObject:nil waitUntilDone:NO];
  }
  return self;
}

- (void)_createContext
{
  _jscWrapper = RCTJSCWrapperCreate(_useCustomJSCLibrary);
  _context = [_jscWrapper->JSContext new];
  installBasicSynchronousHooksOnContext(_context);
  dispatch_semaphore_signal(_semaphore);
}

- (RCTJSContextData)data
{
  // Be sure this method is only called once, otherwise it will hang here forever:
  dispatch_semaphore_wait(_semaphore, DISPATCH_TIME_FOREVER);
  return {
    .useCustomJSCLibrary = _useCustomJSCLibrary,
    .javaScriptThread = _javaScriptThread,
    .context = _context,
    .jscWrapper = _jscWrapper,
  };
}

@end
