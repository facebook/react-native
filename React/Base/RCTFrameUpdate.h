/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class CADisplayLink;

/**
 * Interface containing the information about the last screen refresh.
 */
/// @class RCTFrameUpdate
/// @brief 屏幕刷新信息
@interface RCTFrameUpdate : NSObject

/**
 * Timestamp for the actual screen refresh
 */
/// @brief 实际屏幕刷新时间戳
@property (nonatomic, readonly) NSTimeInterval timestamp;

/**
 * Time since the last frame update ( >= 16.6ms )
 */
/// @brief 上次屏幕刷新至本次屏幕刷新时间间隔
@property (nonatomic, readonly) NSTimeInterval deltaTime;

/// @brief 指定初始化方法
/// @param displayLink CADisplayLink 实例
/// @return RCTFrameUpdate 实例
- (instancetype)initWithDisplayLink:(CADisplayLink *)displayLink NS_DESIGNATED_INITIALIZER;

@end

/**
 * Protocol that must be implemented for subscribing to display refreshes (DisplayLink updates)
 */
/// @protocol RCTFrameUpdateObserver
/// @brief 屏幕刷新监听协议
@protocol RCTFrameUpdateObserver <NSObject>

/**
 * Method called on every screen refresh (if paused != YES)
 */
/// @brief 更新当前帧
/// @param update 当前帧信息
- (void)didUpdateFrame:(RCTFrameUpdate *)update;

@optional

/**
 * Synthesize and set to true to pause the calls to -[didUpdateFrame:]
 */
/// @brief 如果返回 YES 则暂停接收屏幕刷新消息
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end
