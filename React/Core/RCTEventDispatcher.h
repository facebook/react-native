/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import "RCTBridge.h"

typedef NS_ENUM(NSInteger, RCTTextEventType) {
  RCTTextEventTypeFocus,
  RCTTextEventTypeBlur,
  RCTTextEventTypeChange,
  RCTTextEventTypeSubmit,
  RCTTextEventTypeEnd
};

typedef NS_ENUM(NSInteger, RCTScrollEventType) {
  RCTScrollEventTypeStart,
  RCTScrollEventTypeMove,
  RCTScrollEventTypeEnd,
  RCTScrollEventTypeStartDeceleration,
  RCTScrollEventTypeEndDeceleration,
  RCTScrollEventTypeEndAnimation,
};

extern const NSInteger RCTTextUpdateLagWarningThreshold;

@protocol RCTEvent <NSObject>

@required

@property (nonatomic, strong, readonly) NSNumber *viewTag;
@property (nonatomic, copy, readonly) NSString *eventName;
@property (nonatomic, copy, readonly) NSDictionary *body;
@property (nonatomic, assign, readonly) uint16_t coalescingKey;

/// @brief 判断该 event 是否可以合并
/// @return 当前 event 是否可以合并
- (BOOL)canCoalesce;

/// @brief 合并事件并返回一个新的 event 事件对象（默认直接返回 `newEvent`）
/// @param newEvent 新的事件实例
/// @return 返回新的事件实例
- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;

+ (NSString *)moduleDotMethod;

@end

@interface RCTBaseEvent : NSObject <RCTEvent>

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      eventName:(NSString *)eventName
                           body:(NSDictionary *)body NS_DESIGNATED_INITIALIZER;

@end

/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
/// @class RCTEventDispatcher
/// @brief 事件分发器，也是一个 module 类型，内部遵守了 `RCTBridgeModule` 协议，包装了
///        `- [RCTBridge enqueueJSCall:args:]` 方法，并且为生成事件提供了一些便捷方法
@interface RCTEventDispatcher : NSObject

/**
 * Send an application-specific event that does not relate to a specific
 * view, e.g. a navigation or data update notification.
 */
/// @brief 发送与特定视图无关的应用程序特定事件，例如导航或数据更新通知
- (void)sendAppEventWithName:(NSString *)name body:(id)body;

/**
 * Send a device or iOS event that does not relate to a specific view,
 * e.g.rotation, location, keyboard show/hide, background/awake, etc.
 */
/// @brief 发送与特定视图无关的设备或iOS事件，例如旋转、位置、键盘显示/隐藏、背景/唤醒等
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body;

/**
 * Send a user input event. The body dictionary must contain a "target"
 * parameter, representing the React tag of the view sending the event
 */
/// @brief 发送用户输入事件，主体字典必须包含一个 `target` 参数，表示发送事件的视图的 `React` 标签
- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body;


/**
 * Send a text input/focus event.
 */
/// @brief 发送文本输入/焦点事件
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
                   eventCount:(NSInteger)eventCount;

/// @brief 分发事件
- (void)sendEvent:(id<RCTEvent>)event;

@end
