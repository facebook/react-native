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

@implementation RCTContextExecutor
{
  JSGlobalContextRef _context;
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

    NSString *str = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, string);
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:
                                  @"( stack: )?([_a-z0-9]*)@?(http://|file:///)[a-z.0-9:/_-]+/([a-z0-9_]+).includeRequire.runModule.bundle(:[0-9]+:[0-9]+)"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:&error];
    NSString *modifiedString = [regex stringByReplacingMatchesInString:str options:0 range:NSMakeRange(0, [str length]) withTemplate:@"[$4$5]  \t$2"];

    modifiedString = [@"RCTJSLog> " stringByAppendingString:modifiedString];
#if TARGET_IPHONE_SIMULATOR
    fprintf(stderr, "%s\n", [modifiedString UTF8String]); // don't print timestamps and other junk
#else
    // Print normal errors with timestamps to files when not in simulator.
    RCTLogObjects(@[modifiedString], @"log");
#endif
    JSStringRelease(string);
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
    [self executeBlockOnJavaScriptQueue: ^{
      // Assumes that no other JS tasks are scheduled before.
      if (context) {
        _context = JSGlobalContextRetain(context);
      } else {
        JSContextGroupRef group = JSContextGroupCreate();
        _context = JSGlobalContextCreateInGroup(group, NULL);
#if FB_JSC_HACK
        JSContextGroupBindToCurrentThread(group);
#endif
        JSContextGroupRelease(group);
      }

      [self _addNativeHook:RCTNativeLoggingHook withName:"nativeLoggingHook"];
      [self _addNativeHook:RCTNoop withName:"noop"];
    }];
  }

  return self;
}

- (void)_addNativeHook:(JSObjectCallAsFunctionCallback)hook withName:(const char *)name
{
  JSObjectRef globalObject = JSContextGetGlobalObject(_context);

  JSStringRef JSName = JSStringCreateWithUTF8CString(name);
  JSObjectSetProperty(_context, globalObject, JSName, JSObjectMakeFunctionWithCallback(_context, JSName, hook), kJSPropertyAttributeNone, NULL);
  JSStringRelease(JSName);

}

- (BOOL)isValid
{
  return _context != NULL;
}

- (void)invalidate
{
  if ([NSThread currentThread] != _javaScriptThread) {
    // Yes, block until done. If we're getting called right before dealloc, it's the only safe option.
    [self performSelector:@selector(invalidate) onThread:_javaScriptThread withObject:nil waitUntilDone:YES];
  } else if (_context != NULL) {
    JSGlobalContextRelease(_context);
    _context = NULL;
  }
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"must call -invalidate before -dealloc");
}

- (void)executeJSCall:(NSString *)name
               method:(NSString *)method
            arguments:(NSArray *)arguments
             callback:(RCTJavaScriptCallback)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  [self executeBlockOnJavaScriptQueue:^{
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
    JSValueRef result = JSEvaluateScript(_context, execJSString, NULL, NULL, 0, &jsError);
    JSStringRelease(execJSString);

    if (!result) {
      onComplete(nil, RCTNSErrorFromJSError(_context, jsError));
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [RCTContextExecutorTests testDeserializationPerf]
    id objcValue;
    // We often return `null` from JS when there is nothing for native side. JSONKit takes an extra hundred microseconds
    // to handle this simple case, so we are adding a shortcut to make executeJSCall method even faster
    if (!JSValueIsNull(_context, result)) {
      JSStringRef jsJSONString = JSValueCreateJSONString(_context, result, 0, nil);
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
  [self executeBlockOnJavaScriptQueue:^{
    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSStringRef sourceURL = JSStringCreateWithCFString((__bridge CFStringRef)url.absoluteString);
    JSValueRef result = JSEvaluateScript(_context, execJSString, NULL, sourceURL, 0, &jsError);
    JSStringRelease(sourceURL);
    JSStringRelease(execJSString);

    NSError *error;
    if (!result) {
      error = RCTNSErrorFromJSError(_context, jsError);
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

  [self executeBlockOnJavaScriptQueue:^{
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSValueRef valueToInject = JSValueMakeFromJSONString(_context, execJSString);
    JSStringRelease(execJSString);

    if (!valueToInject) {
      NSString *errorDesc = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      RCTLogError(@"%@", errorDesc);

      NSError *error = [NSError errorWithDomain:@"JS" code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
      onComplete(error);
      return;
    }

    JSObjectRef globalObject = JSContextGetGlobalObject(_context);

    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)objectName);
    JSObjectSetProperty(_context, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, NULL);
    JSStringRelease(JSName);
    onComplete(nil);
  }];

}

@end
