/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTProfile.h"

#import <mach/mach.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTDefines.h"
#import "RCTModuleData.h"
#import "RCTUtils.h"

NSString *const RCTProfileDidStartProfiling = @"RCTProfileDidStartProfiling";
NSString *const RCTProfileDidEndProfiling = @"RCTProfileDidEndProfiling";

#if RCT_DEV

#pragma mark - Constants

NSString const *RCTProfileTraceEvents = @"traceEvents";
NSString const *RCTProfileSamples = @"samples";
NSString *const RCTProfilePrefix = @"rct_profile_";

#pragma mark - Variables

NSDictionary *RCTProfileInfo;
NSUInteger RCTProfileEventID = 0;
NSMutableDictionary *RCTProfileOngoingEvents;
NSTimeInterval RCTProfileStartTime;
NSRecursiveLock *_RCTProfileLock;

#pragma mark - Macros

#define RCTProfileAddEvent(type, props...) \
[RCTProfileInfo[type] addObject:@{ \
  @"pid": @([[NSProcessInfo processInfo] processIdentifier]), \
  @"tid": RCTCurrentThreadName(), \
  props \
}];

#define CHECK(...) \
if (!RCTProfileIsProfiling()) { \
  return __VA_ARGS__; \
}

#define RCTProfileLock(...) \
[_RCTProfileLock lock]; \
__VA_ARGS__ \
[_RCTProfileLock unlock]

#pragma mark - Private Helpers

static NSNumber *RCTProfileTimestamp(NSTimeInterval timestamp)
{
  return @((timestamp - RCTProfileStartTime) * 1e6);
}

static NSString *RCTProfileMemory(vm_size_t memory)
{
  double mem = ((double)memory) / 1024 / 1024;
  return [NSString stringWithFormat:@"%.2lfmb", mem];
}

static NSDictionary *RCTProfileGetMemoryUsage(void)
{
  struct task_basic_info info;
  mach_msg_type_number_t size = sizeof(info);
  kern_return_t kerr = task_info(mach_task_self(),
                                 TASK_BASIC_INFO,
                                 (task_info_t)&info,
                                 &size);
  if( kerr == KERN_SUCCESS ) {
    return @{
      @"suspend_count": @(info.suspend_count),
      @"virtual_size": RCTProfileMemory(info.virtual_size),
      @"resident_size": RCTProfileMemory(info.resident_size),
    };
  } else {
    return @{};
  }
}

static NSDictionary *RCTProfileMergeArgs(NSDictionary *args0, NSDictionary *args1)
{
  args0 = RCTNilIfNull(args0);
  args1 = RCTNilIfNull(args1);

  if (!args0 && args1) {
    args0 = args1;
  } else if (args0 && args1) {
    NSMutableDictionary *d = [args0 mutableCopy];
    [d addEntriesFromDictionary:args1];
    args0 = [d copy];
  }

  return RCTNullIfNil(args0);
}

#pragma mark - Module hooks

static const char *RCTProfileProxyClassName(Class);
static const char *RCTProfileProxyClassName(Class class)
{
  return [RCTProfilePrefix stringByAppendingString:NSStringFromClass(class)].UTF8String;
}

static SEL RCTProfileProxySelector(SEL);
static SEL RCTProfileProxySelector(SEL selector)
{
  NSString *selectorName = NSStringFromSelector(selector);
  return NSSelectorFromString([RCTProfilePrefix stringByAppendingString:selectorName]);
}

static void RCTProfileForwardInvocation(NSObject *, SEL, NSInvocation *);
static void RCTProfileForwardInvocation(NSObject *self, __unused SEL cmd, NSInvocation *invocation)
{
  NSString *name = [NSString stringWithFormat:@"-[%@ %@]", NSStringFromClass([self class]), NSStringFromSelector(invocation.selector)];
  SEL newSel = RCTProfileProxySelector(invocation.selector);

  if ([object_getClass(self) instancesRespondToSelector:newSel]) {
    invocation.selector = newSel;
    RCTProfileBeginEvent(0, name, nil);
    [invocation invoke];
    RCTProfileEndEvent(0, @"objc_call,modules,auto", nil);
  } else if ([self respondsToSelector:invocation.selector]) {
    [invocation invoke];
  } else {
    // Use original selector to don't change error message
    [self doesNotRecognizeSelector:invocation.selector];
  }
}

static IMP RCTProfileMsgForward(NSObject *, SEL);
static IMP RCTProfileMsgForward(NSObject *self, SEL selector)
{
  IMP imp = (IMP)_objc_msgForward;
#if !defined(__arm64__)
  NSMethodSignature *signature = [self methodSignatureForSelector:selector];
  if (signature.methodReturnType[0] == _C_STRUCT_B && signature.methodReturnLength > 8) {
    imp = (IMP)_objc_msgForward_stret;
  }
#endif
  return imp;
}

void RCTProfileHookModules(RCTBridge *bridge)
{
  for (RCTModuleData *moduleData in [bridge valueForKey:@"moduleDataByID"]) {
    [moduleData dispatchBlock:^{
      Class moduleClass = moduleData.moduleClass;
      Class proxyClass = objc_allocateClassPair(moduleClass, RCTProfileProxyClassName(moduleClass), 0);

      if (!proxyClass) {
        return;
      }

      unsigned int methodCount;
      Method *methods = class_copyMethodList(moduleClass, &methodCount);
      for (NSUInteger i = 0; i < methodCount; i++) {
        Method method = methods[i];
        SEL selector = method_getName(method);
        if ([NSStringFromSelector(selector) hasPrefix:@"rct"] || [NSObject instancesRespondToSelector:selector]) {
          continue;
        }
        IMP originalIMP = method_getImplementation(method);
        const char *returnType = method_getTypeEncoding(method);
        class_addMethod(proxyClass, selector, RCTProfileMsgForward(moduleData.instance, selector), returnType);
        class_addMethod(proxyClass, RCTProfileProxySelector(selector), originalIMP, returnType);
      }
      free(methods);

      class_replaceMethod(object_getClass(proxyClass), @selector(initialize), imp_implementationWithBlock(^{}), "v@:");

      for (Class cls in @[proxyClass, object_getClass(proxyClass)]) {
        Method oldImp = class_getInstanceMethod(cls, @selector(class));
        class_replaceMethod(cls, @selector(class), imp_implementationWithBlock(^{ return moduleClass; }), method_getTypeEncoding(oldImp));
      }

      IMP originalFwd = class_replaceMethod(moduleClass, @selector(forwardInvocation:), (IMP)RCTProfileForwardInvocation, "v@:@");
      if (originalFwd != NULL) {
        class_addMethod(proxyClass, RCTProfileProxySelector(@selector(forwardInvocation:)), originalFwd, "v@:@");
      }

      objc_registerClassPair(proxyClass);
      object_setClass(moduleData.instance, proxyClass);
    }];
  }
}

void RCTProfileUnhookModules(RCTBridge *bridge)
{
  for (RCTModuleData *moduleData in [bridge valueForKey:@"moduleDataByID"]) {
    Class proxyClass = object_getClass(moduleData.instance);
    if (moduleData.moduleClass != proxyClass) {
      object_setClass(moduleData.instance, moduleData.moduleClass);
      objc_disposeClassPair(proxyClass);
    }
  };
}


#pragma mark - Public Functions

BOOL RCTProfileIsProfiling(void)
{
  RCTProfileLock(
    BOOL profiling = RCTProfileInfo != nil;
  );
  return profiling;
}

void RCTProfileInit(RCTBridge *bridge)
{
  RCTProfileHookModules(bridge);

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _RCTProfileLock = [NSRecursiveLock new];
  });
  RCTProfileLock(
    RCTProfileStartTime = CACurrentMediaTime();
    RCTProfileOngoingEvents = [NSMutableDictionary new];
    RCTProfileInfo = @{
      RCTProfileTraceEvents: [NSMutableArray new],
      RCTProfileSamples: [NSMutableArray new],
    };
  );

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidStartProfiling
                                                      object:nil];
}

NSString *RCTProfileEnd(RCTBridge *bridge)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidEndProfiling
                                                      object:nil];

  RCTProfileLock(
    NSString *log = RCTJSONStringify(RCTProfileInfo, NULL);
    RCTProfileEventID = 0;
    RCTProfileInfo = nil;
    RCTProfileOngoingEvents = nil;
  );

  RCTProfileUnhookModules(bridge);

  return log;
}

static NSMutableArray *RCTProfileGetThreadEvents(void)
{
  static NSString *const RCTProfileThreadEventsKey = @"RCTProfileThreadEventsKey";
  NSMutableArray *threadEvents = [NSThread currentThread].threadDictionary[RCTProfileThreadEventsKey];
  if (!threadEvents) {
    threadEvents = [[NSMutableArray alloc] init];
    [NSThread currentThread].threadDictionary[RCTProfileThreadEventsKey] = threadEvents;
  }
  return threadEvents;
}

void RCTProfileBeginEvent(uint64_t tag, NSString *name, NSDictionary *args)
{
  CHECK();
  NSMutableArray *events = RCTProfileGetThreadEvents();
  [events addObject:@[
    RCTProfileTimestamp(CACurrentMediaTime()),
    @(tag),
    name,
    RCTNullIfNil(args),
  ]];
}

void RCTProfileEndEvent(
  __unused uint64_t tag,
  NSString *category,
  NSDictionary *args
) {
  CHECK();

  NSMutableArray *events = RCTProfileGetThreadEvents();
  NSArray *event = events.lastObject;
  [events removeLastObject];

  if (!event) {
    return;
  }

  NSNumber *start = event[0];

  RCTProfileLock(
    RCTProfileAddEvent(RCTProfileTraceEvents,
      @"name": event[2],
      @"cat": category,
      @"ph": @"X",
      @"ts": start,
      @"dur": @(RCTProfileTimestamp(CACurrentMediaTime()).doubleValue - start.doubleValue),
      @"args": RCTProfileMergeArgs(event[3], args),
    );
  );
}

int RCTProfileBeginAsyncEvent(
  __unused uint64_t tag,
  NSString *name,
  NSDictionary *args
) {
  CHECK(0);

  static int eventID = 0;

  RCTProfileLock(
    RCTProfileOngoingEvents[@(eventID)] = @[
      RCTProfileTimestamp(CACurrentMediaTime()),
      name,
      RCTNullIfNil(args),
    ];
  );

  return eventID++;
}

void RCTProfileEndAsyncEvent(
  __unused uint64_t tag,
  NSString *category,
  int cookie,
  __unused NSString *name,
  NSDictionary *args
) {
  CHECK();
  RCTProfileLock(
    NSArray *event = RCTProfileOngoingEvents[@(cookie)];
    if (event) {
      NSNumber *endTimestamp = RCTProfileTimestamp(CACurrentMediaTime());

      RCTProfileAddEvent(RCTProfileTraceEvents,
        @"name": event[1],
        @"cat": category,
        @"ph": @"X",
        @"ts": event[0],
        @"dur": @(endTimestamp.doubleValue - [event[0] doubleValue]),
        @"args": RCTProfileMergeArgs(event[2], args),
      );
      [RCTProfileOngoingEvents removeObjectForKey:@(cookie)];
    }
  );
}

void RCTProfileImmediateEvent(
  __unused uint64_t tag,
  NSString *name,
  char scope
) {
  CHECK();

  RCTProfileLock(
    RCTProfileAddEvent(RCTProfileTraceEvents,
      @"name": name,
      @"ts": RCTProfileTimestamp(CACurrentMediaTime()),
      @"scope": @(scope),
      @"ph": @"i",
      @"args": RCTProfileGetMemoryUsage(),
    );
  );
}

NSNumber *_RCTProfileBeginFlowEvent(void)
{
  static NSUInteger flowID = 0;

  CHECK(@0);
  RCTProfileAddEvent(RCTProfileTraceEvents,
    @"name": @"flow",
    @"id": @(++flowID),
    @"cat": @"flow",
    @"ph": @"s",
    @"ts": RCTProfileTimestamp(CACurrentMediaTime()),
  );

  return @(flowID);
}

void _RCTProfileEndFlowEvent(NSNumber *flowID)
{
  CHECK();
  RCTProfileAddEvent(RCTProfileTraceEvents,
    @"name": @"flow",
    @"id": flowID,
    @"cat": @"flow",
    @"ph": @"f",
    @"ts": RCTProfileTimestamp(CACurrentMediaTime()),
  );
}

#endif
