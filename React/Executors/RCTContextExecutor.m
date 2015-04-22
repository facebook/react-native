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
#import "RCTLog.h"
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
  JSGlobalContextRelease(_ctx);
  _ctx = NULL;
  _self = nil;
}

@end

@implementation RCTContextExecutor
{
  RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;
}

/**
 * The one tiny pure native hook that we implement is a native logging hook.
 * You could even argue that this is not necessary - we could plumb logging
 * calls through a batched bridge, but having the pure native hook allows
 * logging to successfully come through even in the event that a batched bridge
 * crashes.
 */

static JSValueRef RCTNativeLoggingHook(JSContextRef context, JSObjectRef object, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  if (argumentCount > 0) {
    JSStringRef string = JSValueToStringCopy(context, arguments[0], exception);
    if (!string) {
      return JSValueMakeUndefined(context);
    }
    NSString *message = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, string);
    JSStringRelease(string);
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:
                                  @"( stack: )?([_a-z0-9]*)@?(http://|file:///)[a-z.0-9:/_-]+/([a-z0-9_]+).includeRequire.runModule.bundle(:[0-9]+:[0-9]+)"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:NULL];
    message = [regex stringByReplacingMatchesInString:message
                                              options:0
                                                range:(NSRange){0, message.length}
                                         withTemplate:@"[$4$5]  \t$2"];

    _RCTLogFormat(RCTLogLevelInfo, NULL, -1, @"%@", message);
  }

  return JSValueMakeUndefined(context);
}

// Do-very-little native hook for testing.
static JSValueRef RCTNoop(JSContextRef context, JSObjectRef object, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception)
{
  static int counter = 0;
  counter++;
  return JSValueMakeUndefined(context);
}

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
  // TODO (#5906496): Investigate exactly what this does and why

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
  static NSThread *javaScriptThread;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // All JS is single threaded, so a serial queue is our only option.
    javaScriptThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoopThread) object:nil];
    [javaScriptThread setName:@"com.facebook.React.JavaScript"];
    [javaScriptThread setThreadPriority:[[NSThread mainThread] threadPriority]];
    [javaScriptThread start];
  });

  return [self initWithJavaScriptThread:javaScriptThread globalContextRef:NULL];
}

- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                        globalContextRef:(JSGlobalContextRef)context
{
  if ((self = [super init])) {
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
      } else {
        JSContextGroupRef group = JSContextGroupCreate();
        ctx = JSGlobalContextCreateInGroup(group, NULL);
#if FB_JSC_HACK
        JSContextGroupBindToCurrentThread(group);
#endif
        JSContextGroupRelease(group);
      }

      strongSelf->_context = [[RCTJavaScriptContext alloc] initWithJSContext:ctx];
      [strongSelf _addNativeHook:RCTNativeLoggingHook withName:"nativeLoggingHook"];
      [strongSelf _addNativeHook:RCTNoop withName:"noop"];
    }];
  }

  return self;
}

- (void)_addNativeHook:(JSObjectCallAsFunctionCallback)hook withName:(const char *)name
{
  JSObjectRef globalObject = JSContextGetGlobalObject(_context.ctx);

  JSStringRef JSName = JSStringCreateWithUTF8CString(name);
  JSObjectSetProperty(_context.ctx, globalObject, JSName, JSObjectMakeFunctionWithCallback(_context.ctx, JSName, hook), kJSPropertyAttributeNone, NULL);
  JSStringRelease(JSName);

}

- (BOOL)isValid
{
  return _context.isValid;
}

- (void)invalidate
{
  if (self.isValid) {
    [_context performSelector:@selector(invalidate) onThread:_javaScriptThread withObject:nil waitUntilDone:NO];
    _context = nil;
  }
}

- (void)dealloc
{
  [self invalidate];
}

- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
             callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    NSError *error;
    NSString *argsString = RCTJSONStringify(arguments, &error);
    if (!argsString) {
      RCTLogError(@"Cannot convert argument to string: %@", error);
      onComplete(nil, error);
      return;
    }
    NSString *execString = [NSString stringWithFormat:@"require('%@').%@.apply(null, %@);", name, method, argsString];

    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)execString);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, NULL, 0, &jsError);
    JSStringRelease(execJSString);

    if (!result) {
      onComplete(nil, RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError));
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [RCTContextExecutorTests testDeserializationPerf]
    id objcValue;
    // We often return `null` from JS when there is nothing for native side. JSONKit takes an extra hundred microseconds
    // to handle this simple case, so we are adding a shortcut to make executeJSCall method even faster
    if (!JSValueIsNull(strongSelf->_context.ctx, result)) {
      JSStringRef jsJSONString = JSValueCreateJSONString(strongSelf->_context.ctx, result, 0, nil);
      if (jsJSONString) {
        NSString *objcJSONString = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsJSONString);
        JSStringRelease(jsJSONString);

        objcValue = RCTJSONParse(objcJSONString, NULL);
      }
    }

    onComplete(objcValue, nil);
  }];
}

- (void)executeApplicationScript:(NSString *)script
                       sourceURL:(NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(url != nil, @"url should not be nil");
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    RCTContextExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSStringRef sourceURL = JSStringCreateWithCFString((__bridge CFStringRef)url.absoluteString);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, sourceURL, 0, &jsError);
    JSStringRelease(sourceURL);
    JSStringRelease(execJSString);

    NSError *error;
    if (!result) {
      error = RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError);
    }

    onComplete(error);
  }];
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

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
#if DEBUG
  RCTAssert(RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
#endif

  __weak RCTContextExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
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

      NSError *error = [NSError errorWithDomain:@"JS" code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
      onComplete(error);
      return;
    }

    JSObjectRef globalObject = JSContextGetGlobalObject(strongSelf->_context.ctx);

    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)objectName);
    JSObjectSetProperty(strongSelf->_context.ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, NULL);
    JSStringRelease(JSName);
    onComplete(nil);
  }];

}

@end
