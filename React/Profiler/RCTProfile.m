/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTProfile.h"

#import <dlfcn.h>

#import <libkern/OSAtomic.h>
#import <mach/mach.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTDefines.h"
#import "RCTLog.h"
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

static volatile uint32_t RCTProfileProfiling;
static NSDictionary *RCTProfileInfo;
static NSMutableDictionary *RCTProfileOngoingEvents;
static NSTimeInterval RCTProfileStartTime;
static NSUInteger RCTProfileEventID = 0;

#pragma mark - Macros

#define RCTProfileAddEvent(type, props...) \
[RCTProfileInfo[type] addObject:@{ \
  @"pid": @([[NSProcessInfo processInfo] processIdentifier]), \
  props \
}];

#define CHECK(...) \
if (!RCTProfileIsProfiling()) { \
  return __VA_ARGS__; \
}

#pragma mark - systrace glue code

static RCTProfileCallbacks *callbacks;
static char *systrace_buffer;

static systrace_arg_t *RCTProfileSystraceArgsFromNSDictionary(NSDictionary *args)
{
  if (args.count == 0) {
    return NULL;
  }

  systrace_arg_t *systrace_args = malloc(sizeof(systrace_arg_t) * args.count);
  __block size_t i = 0;
  [args enumerateKeysAndObjectsUsingBlock:^(id key, id value, __unused BOOL *stop) {
    const char *keyc = [key description].UTF8String;
    systrace_args[i].key = keyc;
    systrace_args[i].key_len = (int)strlen(keyc);

    const char *valuec = RCTJSONStringify(value, nil).UTF8String;
    systrace_args[i].value = valuec;
    systrace_args[i].value_len = (int)strlen(valuec);
    i++;
  }];
  return systrace_args;
}

void RCTProfileRegisterCallbacks(RCTProfileCallbacks *cb)
{
  callbacks = cb;
}

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

static const char *RCTProfileProxyClassName(Class class)
{
  return [RCTProfilePrefix stringByAppendingString:NSStringFromClass(class)].UTF8String;
}

static dispatch_group_t RCTProfileGetUnhookGroup(void)
{
  static dispatch_group_t unhookGroup;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    unhookGroup = dispatch_group_create();
  });

  return unhookGroup;
}

RCT_EXTERN IMP RCTProfileGetImplementation(id obj, SEL cmd);
IMP RCTProfileGetImplementation(id obj, SEL cmd)
{
  return class_getMethodImplementation([obj class], cmd);
}

/**
 * For the profiling we have to execute some code before and after every
 * function being profiled, the only way of doing that with pure Objective-C is
 * by using `-forwardInvocation:`, which is slow and could skew the profile
 * results.
 *
 * The alternative in assembly is much simpler, we just need to store all the
 * state at the beginning of the function, start the profiler, restore all the
 * state, call the actual function we want to profile and stop the profiler.
 *
 * The implementation can be found in RCTProfileTrampoline-<arch>.s where arch
 * is one of: x86, x86_64, arm, arm64.
 */
#if defined(__x86__) || \
    defined(__x86_64__) || \
    defined(__arm__) || \
    defined(__arm64__)

  RCT_EXTERN void RCTProfileTrampoline(void);
#else
  static void *RCTProfileTrampoline = NULL;
#endif

RCT_EXTERN void RCTProfileTrampolineStart(id, SEL);
void RCTProfileTrampolineStart(id self, SEL cmd)
{
  NSString *name = [NSString stringWithFormat:@"-[%s %s]", class_getName([self class]), sel_getName(cmd)];
  RCTProfileBeginEvent(0, name, nil);
}

RCT_EXTERN void RCTProfileTrampolineEnd(void);
void RCTProfileTrampolineEnd(void)
{
  RCTProfileEndEvent(0, @"objc_call,modules,auto", nil);
}

void RCTProfileHookModules(RCTBridge *bridge)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wtautological-pointer-compare"
  if (RCTProfileTrampoline == NULL) {
    return;
  }
#pragma clang diagnostic pop

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
        const char *types = method_getTypeEncoding(method);

        class_addMethod(proxyClass, selector, (IMP)RCTProfileTrampoline, types);
      }
      free(methods);

      class_replaceMethod(object_getClass(proxyClass), @selector(initialize), imp_implementationWithBlock(^{}), "v@:");

      for (Class cls in @[proxyClass, object_getClass(proxyClass)]) {
        Method oldImp = class_getInstanceMethod(cls, @selector(class));
        class_replaceMethod(cls, @selector(class), imp_implementationWithBlock(^{ return moduleClass; }), method_getTypeEncoding(oldImp));
      }

      objc_registerClassPair(proxyClass);
      object_setClass(moduleData.instance, proxyClass);
    }];
  }
}

void RCTProfileUnhookModules(RCTBridge *bridge)
{
  dispatch_group_enter(RCTProfileGetUnhookGroup());

  for (RCTModuleData *moduleData in [bridge valueForKey:@"moduleDataByID"]) {
    Class proxyClass = object_getClass(moduleData.instance);
    if (moduleData.moduleClass != proxyClass) {
      object_setClass(moduleData.instance, moduleData.moduleClass);
      objc_disposeClassPair(proxyClass);
    }
  }

  dispatch_group_leave(RCTProfileGetUnhookGroup());
}


#pragma mark - Public Functions

dispatch_queue_t RCTProfileGetQueue(void)
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.react.Profiler", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

BOOL RCTProfileIsProfiling(void)
{
  return (BOOL)OSAtomicAnd32(1, &RCTProfileProfiling);
}

void RCTProfileInit(RCTBridge *bridge)
{
  // TODO: enable assert JS thread from any file (and assert here)

  OSAtomicOr32(1, &RCTProfileProfiling);

  if (callbacks != NULL) {
    size_t buffer_size = 1 << 22;
    systrace_buffer = calloc(1, buffer_size);
    callbacks->start(~((uint64_t)0), systrace_buffer, buffer_size);
  } else {
    NSTimeInterval time = CACurrentMediaTime();
    dispatch_async(RCTProfileGetQueue(), ^{
      RCTProfileStartTime = time;
      RCTProfileOngoingEvents = [NSMutableDictionary new];
      RCTProfileInfo = @{
        RCTProfileTraceEvents: [NSMutableArray new],
        RCTProfileSamples: [NSMutableArray new],
      };
    });
  }

  RCTProfileHookModules(bridge);

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidStartProfiling
                                                      object:nil];
}

void RCTProfileEnd(RCTBridge *bridge, void (^callback)(NSString *))
{
  // assert JavaScript thread here again

  if (!RCTProfileIsProfiling()) {
    return;
  }

  OSAtomicAnd32(0, &RCTProfileProfiling);

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidEndProfiling
                                                      object:nil];

  RCTProfileUnhookModules(bridge);

  if (callbacks != NULL) {
    callbacks->stop();

    callback(@(systrace_buffer));
  } else {
    dispatch_async(RCTProfileGetQueue(), ^{
      NSString *log = RCTJSONStringify(RCTProfileInfo, NULL);
      RCTProfileEventID = 0;
      RCTProfileInfo = nil;
      RCTProfileOngoingEvents = nil;

      callback(log);
    });
  }
}

static NSMutableArray<NSArray *> *RCTProfileGetThreadEvents(NSThread *thread)
{
  static NSString *const RCTProfileThreadEventsKey = @"RCTProfileThreadEventsKey";
  NSMutableArray<NSArray *> *threadEvents =
    thread.threadDictionary[RCTProfileThreadEventsKey];
  if (!threadEvents) {
    threadEvents = [NSMutableArray new];
    thread.threadDictionary[RCTProfileThreadEventsKey] = threadEvents;
  }
  return threadEvents;
}

void _RCTProfileBeginEvent(
  NSThread *calleeThread,
  NSTimeInterval time,
  uint64_t tag,
  NSString *name,
  NSDictionary *args
) {

  CHECK();

  RCTAssertThread(RCTProfileGetQueue(), @"Must be called RCTProfile queue");;

  if (callbacks != NULL) {
    callbacks->begin_section(tag, name.UTF8String, args.count, RCTProfileSystraceArgsFromNSDictionary(args));
    return;
  }

  NSMutableArray *events = RCTProfileGetThreadEvents(calleeThread);
  [events addObject:@[
    RCTProfileTimestamp(time),
    @(tag),
    name,
    RCTNullIfNil(args),
  ]];
}

void _RCTProfileEndEvent(
  NSThread *calleeThread,
  NSString *threadName,
  NSTimeInterval time,
  uint64_t tag,
  NSString *category,
  NSDictionary *args
) {
  CHECK();

  RCTAssertThread(RCTProfileGetQueue(), @"Must be called RCTProfile queue");;

  if (callbacks != NULL) {
    callbacks->end_section(tag, args.count, RCTProfileSystraceArgsFromNSDictionary(args));
    return;
  }

  NSMutableArray<NSArray *> *events = RCTProfileGetThreadEvents(calleeThread);
  NSArray *event = events.lastObject;
  [events removeLastObject];

  if (!event) {
    return;
  }

  NSNumber *start = event[0];

  RCTProfileAddEvent(RCTProfileTraceEvents,
    @"tid": threadName,
    @"name": event[2],
    @"cat": category,
    @"ph": @"X",
    @"ts": start,
    @"dur": @(RCTProfileTimestamp(time).doubleValue - start.doubleValue),
    @"args": RCTProfileMergeArgs(event[3], args),
  );
}

int RCTProfileBeginAsyncEvent(
  uint64_t tag,
  NSString *name,
  NSDictionary *args
) {
  CHECK(0);

  static int eventID = 0;

  NSTimeInterval time = CACurrentMediaTime();
  int currentEventID = ++eventID;

  if (callbacks != NULL) {
    callbacks->begin_async_section(tag, name.UTF8String, eventID, args.count, RCTProfileSystraceArgsFromNSDictionary(args));
  } else {
    dispatch_async(RCTProfileGetQueue(), ^{
      RCTProfileOngoingEvents[@(currentEventID)] = @[
        RCTProfileTimestamp(time),
        name,
        RCTNullIfNil(args),
      ];
    });
  }

  return currentEventID;
}

void RCTProfileEndAsyncEvent(
  uint64_t tag,
  NSString *category,
  int cookie,
  NSString *name,
  NSDictionary *args
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_async_section(tag, name.UTF8String, cookie, args.count, RCTProfileSystraceArgsFromNSDictionary(args));
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    NSArray *event = RCTProfileOngoingEvents[@(cookie)];

    if (event) {
      NSNumber *endTimestamp = RCTProfileTimestamp(time);

      RCTProfileAddEvent(RCTProfileTraceEvents,
        @"tid": threadName,
        @"name": event[1],
        @"cat": category,
        @"ph": @"X",
        @"ts": event[0],
        @"dur": @(endTimestamp.doubleValue - [event[0] doubleValue]),
        @"args": RCTProfileMergeArgs(event[2], args),
      );
      [RCTProfileOngoingEvents removeObjectForKey:@(cookie)];
    }
  });
}

void RCTProfileImmediateEvent(
  uint64_t tag,
  NSString *name,
  char scope
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->instant_section(tag, name.UTF8String, scope);
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": name,
      @"ts": RCTProfileTimestamp(time),
      @"scope": @(scope),
      @"ph": @"i",
      @"args": RCTProfileGetMemoryUsage(),
    );
  });
}

NSNumber *_RCTProfileBeginFlowEvent(void)
{
  static NSUInteger flowID = 0;

  CHECK(@0);

  if (callbacks != NULL) {
    // flow events not supported yet
    return @0;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSNumber *currentID = @(++flowID);
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": @"flow",
      @"id": currentID,
      @"cat": @"flow",
      @"ph": @"s",
      @"ts": RCTProfileTimestamp(time),
    );

  });

  return currentID;
}

void _RCTProfileEndFlowEvent(NSNumber *flowID)
{
  CHECK();

  if (callbacks != NULL) {
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": @"flow",
      @"id": flowID,
      @"cat": @"flow",
      @"ph": @"f",
      @"ts": RCTProfileTimestamp(time),
    );
  });
}

void RCTProfileSendResult(RCTBridge *bridge, NSString *route, NSData *data)
{
  if (![bridge.bundleURL.scheme hasPrefix:@"http"]) {
    RCTLogError(@"Cannot upload profile information");
    return;
  }

  NSURL *URL = [NSURL URLWithString:[@"/" stringByAppendingString:route] relativeToURL:bridge.bundleURL];

  NSMutableURLRequest *URLRequest = [NSMutableURLRequest requestWithURL:URL];
  URLRequest.HTTPMethod = @"POST";
  [URLRequest setValue:@"application/json"
    forHTTPHeaderField:@"Content-Type"];

  NSURLSessionTask *task =
    [[NSURLSession sharedSession] uploadTaskWithRequest:URLRequest
                                               fromData:data
                                    completionHandler:
   ^(NSData *responseData, __unused NSURLResponse *response, NSError *error) {
     if (error) {
       RCTLogError(@"%@", error.localizedDescription);
     } else {
       NSString *message = [[NSString alloc] initWithData:responseData
                                                 encoding:NSUTF8StringEncoding];

       if (message.length) {
         dispatch_async(dispatch_get_main_queue(), ^{
           [[[UIAlertView alloc] initWithTitle:@"Profile"
                                       message:message
                                      delegate:nil
                             cancelButtonTitle:@"OK"
                             otherButtonTitles:nil] show];
         });
       }
     }
   }];

  [task resume];
}

#endif
