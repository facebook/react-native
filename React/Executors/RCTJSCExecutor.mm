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

NSString *const RCTJSCThreadName = @"com.facebook.react.JavaScript";

NSString *const RCTJavaScriptContextCreatedNotification = @"RCTJavaScriptContextCreatedNotification";

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

@interface RCTJavaScriptContext : NSObject <RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;
@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

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
  RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;
  CFMutableDictionaryRef _cookieMap;

  RandomAccessBundleData _randomAccessBundle;
  JSValueRef _batchedBridgeRef;

  RCTJSCWrapper *_jscWrapper;
  BOOL _useCustomJSCLibrary;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

static NSString *RCTJSValueToNSString(RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef value, JSValueRef *exception)
{
  JSStringRef JSString = jscWrapper->JSValueToStringCopy(context, value, exception);
  if (!JSString) {
    return nil;
  }

  CFStringRef string = jscWrapper->JSStringCopyCFString(kCFAllocatorDefault, JSString);
  jscWrapper->JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *RCTJSValueToJSONString(RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef value, JSValueRef *exception, unsigned indent)
{
  JSStringRef jsString = jscWrapper->JSValueCreateJSONString(context, value, indent, exception);
  CFStringRef string = jscWrapper->JSStringCopyCFString(kCFAllocatorDefault, jsString);
  jscWrapper->JSStringRelease(jsString);

  return (__bridge_transfer NSString *)string;
}

static NSError *RCTNSErrorFromJSError(RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef jsError)
{
  NSMutableDictionary *errorInfo = [NSMutableDictionary new];

  NSString *description = jsError ? RCTJSValueToNSString(jscWrapper, context, jsError, NULL) : @"Unknown JS error";
  errorInfo[NSLocalizedDescriptionKey] = [@"Unhandled JS Exception: " stringByAppendingString:description];

  NSString *details = jsError ? RCTJSValueToJSONString(jscWrapper, context, jsError, NULL, 0) : nil;
  if (details) {
    errorInfo[NSLocalizedFailureReasonErrorKey] = details;

    // Format stack as used in RCTFormatError
    id json = RCTJSONParse(details, NULL);
    if ([json isKindOfClass:[NSDictionary class]]) {
      if (json[@"stack"]) {
        NSError *regexError;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^([^@]+)@(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
        if (regexError) {
          RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
        }

        NSMutableArray *stackTrace = [NSMutableArray array];
        for (NSString *stackLine in [json[@"stack"] componentsSeparatedByString:@"\n"]) {
          NSTextCheckingResult *result = [regex firstMatchInString:stackLine options:0 range:NSMakeRange(0, stackLine.length)];
          if (result) {
            [stackTrace addObject:@{
              @"methodName": [stackLine substringWithRange:[result rangeAtIndex:1]],
              @"file": [stackLine substringWithRange:[result rangeAtIndex:2]],
              @"lineNumber": [stackLine substringWithRange:[result rangeAtIndex:3]],
              @"column": [stackLine substringWithRange:[result rangeAtIndex:4]]
            }];
          }
        }
        if ([stackTrace count]) {
          errorInfo[RCTJSStackTraceKey] = stackTrace;
        }
      }

      // Fall back to just logging the line number
      if (!errorInfo[RCTJSStackTraceKey] && json[@"line"]) {
        errorInfo[RCTJSStackTraceKey] = @[@{
          @"methodName": @"",
          @"file": RCTNullIfNil(json[@"sourceURL"]),
          @"lineNumber": RCTNullIfNil(json[@"line"]),
          @"column": @0,
        }];
      }
    }
  }

  return [NSError errorWithDomain:RCTErrorDomain code:1 userInfo:errorInfo];
}

- (NSError *)convertJSErrorToNSError:(JSValueRef)jsError context:(JSContextRef)context
{
  return RCTNSErrorFromJSError(_jscWrapper, context, jsError);
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
  return [self initWithUseCustomJSCLibrary:NO];
}

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary
{
  if (self = [super init]) {
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _valid = YES;

    _javaScriptThread = [[NSThread alloc] initWithTarget:[self class]
                                                selector:@selector(runRunLoopThread)
                                                  object:nil];
    _javaScriptThread.name = RCTJSCThreadName;

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
    JSContext *context = [_jscWrapper->JSContext new];
    _context = [[RCTJavaScriptContext alloc] initWithJSContext:context onThread:_javaScriptThread];

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptContextCreatedNotification
                                                        object:context];
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

  [self executeBlockOnJavaScriptQueue:^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    strongSelf->_jscWrapper = RCTJSCWrapperCreate(strongSelf->_useCustomJSCLibrary);
  }];


  [self executeBlockOnJavaScriptQueue:^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    if (strongSelf->_jscWrapper->configureJSContextForIOS == NULL) {
      return;
    }

    NSString *cachesPath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    RCTAssert(cachesPath != nil, @"cachesPath should not be nil");
    if (cachesPath) {
      strongSelf->_jscWrapper->configureJSContextForIOS(strongSelf.context.ctx, [cachesPath UTF8String]);
    }
  }];

  [self addSynchronousHookWithName:@"noop" usingBlock:^{}];

  [self addSynchronousHookWithName:@"nativeLoggingHook" usingBlock:^(NSString *message, NSNumber *logLevel) {
    RCTLogLevel level = RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (RCTLogLevel)logLevel.integerValue);
    }

    _RCTLogJavaScriptInternal(level, message);
  }];

  [self addSynchronousHookWithName:@"nativeRequireModuleConfig" usingBlock:^NSString *(NSString *moduleName) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return nil;
    }

    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"nativeRequireModuleConfig", nil);
    NSArray *config = [strongSelf->_bridge configForModuleName:moduleName];
    NSString *result = config ? RCTJSONStringify(config, NULL) : nil;
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call,config", @{ @"moduleName": moduleName });
    return result;
  }];

  [self addSynchronousHookWithName:@"nativeFlushQueueImmediate" usingBlock:^(NSArray<NSArray *> *calls){
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid || !calls) {
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
    [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call", nil);
  }];

  [self addSynchronousHookWithName:@"nativePerformanceNow" usingBlock:^{
    return @(CACurrentMediaTime() * 1000);
  }];

#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    [self addSynchronousHookWithName:@"__RCTProfileIsProfiling" usingBlock:@YES];
  }

  _cookieMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    NSUInteger newCookie = RCTProfileBeginAsyncEvent(tag, name, nil);
    CFDictionarySetValue(strongSelf->_cookieMap, (const void *)cookie, (const void *)newCookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(strongSelf->_cookieMap, (const void *)cookie);
    RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async", nil);
    CFDictionaryRemoveValue(strongSelf->_cookieMap, (const void *)cookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceBeginSection" usingBlock:^(NSNumber *tag, NSString *profileName, NSDictionary *args) {
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, args);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndSection" usingBlock:^(NSNumber *tag) {
    RCT_PROFILE_END_EVENT(tag.longLongValue, @"console", nil);
  }];

  __weak RCTBridge *weakBridge = _bridge;
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = [_RCTProfileBeginFlowEvent() longLongValue];
      CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = (int64_t)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
      _RCTProfileEndFlowEvent(@(newCookie));
      CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  for (NSString *event in @[RCTProfileDidStartProfiling, RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }
#endif

#if RCT_DEV
  [self executeBlockOnJavaScriptQueue:^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSContext *context = strongSelf.context.context;
    RCTInstallJSCProfiler(_bridge, context.JSGlobalContextRef);
  }];

  // Inject handler used by HMR
  [self addSynchronousHookWithName:@"nativeInjectHMRUpdate" usingBlock:^(NSString *sourceCode, NSString *sourceCodeURL) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString(sourceCode.UTF8String);
    JSStringRef jsURL = jscWrapper->JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
    jscWrapper->JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, NULL);
    jscWrapper->JSStringRelease(jsURL);
    jscWrapper->JSStringRelease(execJSString);
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

  _randomAccessBundle.bundle.reset();
  _randomAccessBundle.table.reset();

  if (_jscWrapper) {
    RCTJSCWrapperRelease(_jscWrapper);
    _jscWrapper = NULL;
  }

  if (_cookieMap) {
    CFRelease(_cookieMap);
  }
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

    JSValueRef errorJSRef = NULL;
    JSValueRef resultJSRef = NULL;
    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSGlobalContextRef contextJSRef = jscWrapper->JSContextGetGlobalContext(strongSelf->_context.ctx);
    JSContext *context = strongSelf->_context.context;
    JSObjectRef globalObjectJSRef = jscWrapper->JSContextGetGlobalObject(strongSelf->_context.ctx);

    // get the BatchedBridge object
    JSValueRef batchedBridgeRef = strongSelf->_batchedBridgeRef;
    if (!batchedBridgeRef) {
      JSStringRef moduleNameJSStringRef = jscWrapper->JSStringCreateWithUTF8CString("__fbBatchedBridge");
      batchedBridgeRef = jscWrapper->JSObjectGetProperty(contextJSRef, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
      jscWrapper->JSStringRelease(moduleNameJSStringRef);
      strongSelf->_batchedBridgeRef = batchedBridgeRef;
    }

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

    if (errorJSRef || error) {
      if (!error) {
        error = RCTNSErrorFromJSError(jscWrapper, contextJSRef, errorJSRef);
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
    if (!jscWrapper->JSValueIsNull(contextJSRef, resultJSRef)) {
      objcValue = [[jscWrapper->JSValue valueWithJSValueRef:resultJSRef inContext:context] toObject];
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

  __weak RCTJSCExecutor *weakSelf = self;

  [self executeBlockOnJavaScriptQueue:RCTProfileBlock((^{
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    RCTPerformanceLoggerStart(RCTPLScriptExecution);

    JSValueRef jsError = NULL;
    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString((const char *)script.bytes);
    JSStringRef bundleURL = jscWrapper->JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);
    JSValueRef result = jscWrapper->JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, bundleURL, 0, &jsError);
    jscWrapper->JSStringRelease(bundleURL);
    jscWrapper->JSStringRelease(execJSString);
    RCTPerformanceLoggerEnd(RCTPLScriptExecution);

    if (onComplete) {
      NSError *error;
      if (!result) {
        error = RCTNSErrorFromJSError(jscWrapper, strongSelf->_context.ctx, jsError);
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

    RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSValueRef valueToInject = jscWrapper->JSValueMakeFromJSONString(strongSelf->_context.ctx, execJSString);
    jscWrapper->JSStringRelease(execJSString);

    if (!valueToInject) {
      NSString *errorDesc = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      RCTLogError(@"%@", errorDesc);

      if (onComplete) {
        NSError *error = [NSError errorWithDomain:RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
        onComplete(error);
      }
      return;
    }

    JSObjectRef globalObject = jscWrapper->JSContextGetGlobalObject(strongSelf->_context.ctx);
    JSStringRef JSName = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)objectName);
    jscWrapper->JSObjectSetProperty(strongSelf->_context.ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, NULL);
    jscWrapper->JSStringRelease(JSName);
    if (onComplete) {
      onComplete(nil);
    }
  }), 0, @"js_call,json_call", (@{@"objectName": objectName}))];
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
  JSValueRef result = jscWrapper->JSEvaluateScript(executor->_context.ctx, code, NULL, sourceURL, 0, &jsError);

  jscWrapper->JSStringRelease(code);
  jscWrapper->JSStringRelease(sourceURL);

  if (!result) {
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTFatal(RCTNSErrorFromJSError(jscWrapper, executor->_context.ctx, jsError));
      [executor invalidate];
    });
  }
}

- (void)registerNativeRequire
{
  RCTPerformanceLoggerSet(RCTPLRAMNativeRequires, 0);
  RCTPerformanceLoggerSet(RCTPLRAMNativeRequiresCount, 0);
  RCTPerformanceLoggerSet(RCTPLRAMNativeRequiresSize, 0);

  __weak RCTJSCExecutor *weakSelf = self;
  [self addSynchronousHookWithName:@"nativeRequire" usingBlock:^(NSNumber *moduleID) {
    RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !moduleID) {
      return;
    }

    RCTPerformanceLoggerAdd(RCTPLRAMNativeRequiresCount, 1);
    RCTPerformanceLoggerAppendStart(RCTPLRAMNativeRequires);
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
                            [@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID], nil);

    const uint32_t ID = [moduleID unsignedIntValue];

    if (ID < strongSelf->_randomAccessBundle.numTableEntries) {
      ModuleData *moduleData = &strongSelf->_randomAccessBundle.table[ID];
      const uint32_t size = NSSwapLittleIntToHost(moduleData->size);

      // sparse entry in the table -- module does not exist or is contained in the startup section
      if (size == 0) {
        return;
      }

      RCTPerformanceLoggerAdd(RCTPLRAMNativeRequiresSize, size);
      executeRandomAccessModule(strongSelf, ID, NSSwapLittleIntToHost(moduleData->offset), size);
    }

    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"js_call", nil);
    RCTPerformanceLoggerAppendEnd(RCTPLRAMNativeRequires);
  }];
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

- (NSData *)loadRAMBundle:(NSURL *)sourceURL error:(NSError **)error
{
  RCTPerformanceLoggerStart(RCTPLRAMBundleLoad);
  file_ptr bundle(fopen(sourceURL.path.UTF8String, "r"), fclose);
  if (!bundle) {
    if (error) {
      *error = RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  [self registerNativeRequire];


  auto startupCode = readRAMBundle(std::move(bundle), _randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  RCTPerformanceLoggerEnd(RCTPLRAMBundleLoad);
  RCTPerformanceLoggerSet(RCTPLRAMStartupCodeSize, startupCode.size);
  return [NSData dataWithBytesNoCopy:startupCode.code.release() length:startupCode.size freeWhenDone:YES];
}

RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)name)
{
  if (_jscWrapper->JSGlobalContextSetName != NULL) {
    JSStringRef JSName = _jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)name);
    _jscWrapper->JSGlobalContextSetName(_context.ctx, JSName);
    _jscWrapper->JSStringRelease(JSName);
  }
}

@end
