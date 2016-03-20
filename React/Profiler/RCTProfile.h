/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTDefines.h"

/**
 * RCTProfile
 *
 * This file provides a set of functions and macros for performance profiling
 *
 * NOTE: This API is a work in progress, please consider carefully before
 * using it.
 */

RCT_EXTERN NSString *const RCTProfileDidStartProfiling;
RCT_EXTERN NSString *const RCTProfileDidEndProfiling;

#if RCT_DEV

@class RCTBridge;

#define RCTProfileBeginFlowEvent() \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
NSNumber *__rct_profile_flow_id = _RCTProfileBeginFlowEvent(); \
_Pragma("clang diagnostic pop")

#define RCTProfileEndFlowEvent() \
_RCTProfileEndFlowEvent(__rct_profile_flow_id)

RCT_EXTERN dispatch_queue_t RCTProfileGetQueue(void);

RCT_EXTERN NSNumber *_RCTProfileBeginFlowEvent(void);
RCT_EXTERN void _RCTProfileEndFlowEvent(NSNumber *);

/**
 * Returns YES if the profiling information is currently being collected
 */
RCT_EXTERN BOOL RCTProfileIsProfiling(void);

/**
 * Start collecting profiling information
 */
RCT_EXTERN void RCTProfileInit(RCTBridge *);

/**
 * Stop profiling and return a JSON string of the collected data - The data
 * returned is compliant with google's trace event format - the format used
 * as input to trace-viewer
 */
RCT_EXTERN void RCTProfileEnd(RCTBridge *, void (^)(NSString *));

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN void _RCTProfileBeginEvent(NSThread *calleeThread,
                                      NSTimeInterval time,
                                      uint64_t tag,
                                      NSString *name,
                                      NSDictionary *args);
#define RCT_PROFILE_BEGIN_EVENT(...) \
  do { \
    if (RCTProfileIsProfiling()) { \
      NSThread *__calleeThread = [NSThread currentThread]; \
      NSTimeInterval __time = CACurrentMediaTime(); \
      dispatch_async(RCTProfileGetQueue(), ^{ \
        _RCTProfileBeginEvent(__calleeThread, __time, __VA_ARGS__); \
      }); \
    } \
  } while(0)

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void _RCTProfileEndEvent(NSThread *calleeThread,
                                    NSString *threadName,
                                    NSTimeInterval time,
                                    uint64_t tag,
                                    NSString *category,
                                    NSDictionary *args);

#define RCT_PROFILE_END_EVENT(...) \
  do { \
    if (RCTProfileIsProfiling()) { \
      NSThread *__calleeThread = [NSThread currentThread]; \
      NSString *__threadName = RCTCurrentThreadName(); \
      NSTimeInterval __time = CACurrentMediaTime(); \
      dispatch_async(RCTProfileGetQueue(), ^{ \
        _RCTProfileEndEvent(__calleeThread, __threadName, __time, __VA_ARGS__); \
      }); \
    } \
  } while(0)

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN NSUInteger RCTProfileBeginAsyncEvent(uint64_t tag,
                                                NSString *name,
                                                NSDictionary *args);

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void RCTProfileEndAsyncEvent(uint64_t tag,
                                        NSString *category,
                                        NSUInteger cookie,
                                        NSString *name,
                                        NSString *threadName,
                                        NSDictionary *args);

/**
 * An event that doesn't have a duration (i.e. Notification, VSync, etc)
 */
RCT_EXTERN void RCTProfileImmediateEvent(uint64_t tag,
                                         NSString *name,
                                         NSTimeInterval time,
                                         char scope);

/**
 * Helper to profile the duration of the execution of a block. This method uses
 * self and _cmd to name this event for simplicity sake.
 *
 * NOTE: The block can't expect any argument
 */
#define RCTProfileBlock(block, tag, category, arguments) \
^{ \
  RCT_PROFILE_BEGIN_EVENT(tag, @(__PRETTY_FUNCTION__), nil); \
  block(); \
  RCT_PROFILE_END_EVENT(tag, category, arguments); \
}

/**
 * Hook into a bridge instance to log all bridge module's method calls
 */
RCT_EXTERN void RCTProfileHookModules(RCTBridge *);

/**
 * Unhook from a given bridge instance's modules
 */
RCT_EXTERN void RCTProfileUnhookModules(RCTBridge *);

/**
 * Send systrace or cpu profiling information to the packager
 * to present to the user
 */
RCT_EXTERN void RCTProfileSendResult(RCTBridge *bridge, NSString *route, NSData *profileData);

/**
 * Systrace gluecode
 *
 * allow to use systrace to back RCTProfile
 */

typedef struct {
  const char *key;
  int key_len;
  const char *value;
  int value_len;
} systrace_arg_t;

typedef struct {
  void (*start)(uint64_t enabledTags, char *buffer, size_t bufferSize);
  void (*stop)(void);

  void (*begin_section)(uint64_t tag, const char *name, size_t numArgs, systrace_arg_t *args);
  void (*end_section)(uint64_t tag, size_t numArgs, systrace_arg_t *args);

  void (*begin_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);
  void (*end_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);

  void (*instant_section)(uint64_t tag, const char *name, char scope);
} RCTProfileCallbacks;

RCT_EXTERN void RCTProfileRegisterCallbacks(RCTProfileCallbacks *);

/**
 * Systrace control window
 */
RCT_EXTERN void RCTProfileShowControls(void);
RCT_EXTERN void RCTProfileHideControls(void);

#else

#define RCTProfileBeginFlowEvent()
#define _RCTProfileBeginFlowEvent() @0

#define RCTProfileEndFlowEvent()
#define _RCTProfileEndFlowEvent(...)

#define RCTProfileIsProfiling(...) NO
#define RCTProfileInit(...)
#define RCTProfileEnd(...) @""

#define _RCTProfileBeginEvent(...)
#define _RCTProfileEndEvent(...)

#define RCT_PROFILE_BEGIN_EVENT(...)
#define RCT_PROFILE_END_EVENT(...)

#define RCTProfileBeginAsyncEvent(...) 0
#define RCTProfileEndAsyncEvent(...)

#define RCTProfileImmediateEvent(...)

#define RCTProfileBlock(block, ...) block

#define RCTProfileHookModules(...)
#define RCTProfileUnhookModules(...)

#define RCTProfileSendResult(...)

#define RCTProfileShowControls(...)
#define RCTProfileHideControls(...)

#endif
