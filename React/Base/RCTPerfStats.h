/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridge.h"
#import "RCTFPSGraph.h"

/// @class RCTPerfStats
/// @brief 性能统计视图包装
@interface RCTPerfStats : NSObject

/// @brief js 执行线程屏幕刷新监控视图（FPS）
@property (nonatomic, strong) RCTFPSGraph *jsGraph;
/// @brief 主线程屏幕刷新监控视图（FPS）
@property (nonatomic, strong) RCTFPSGraph *uiGraph;

- (void)show;
- (void)hide;

@end

@interface RCTBridge (RCTPerfStats)

/// @brief 性能统计实例
@property (nonatomic, strong, readonly) RCTPerfStats *perfStats;

@end
