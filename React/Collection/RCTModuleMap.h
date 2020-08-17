/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/// @class RCTModuleMap
/// @brief 简单的 NSDictionary 包装
@interface RCTModuleMap : NSDictionary

/// @brief 指定初始化方法
/// @param modulesByName module KV 集合
/// @return RCTModuleMap 实例
- (instancetype)initWithDictionary:(NSDictionary *)modulesByName NS_DESIGNATED_INITIALIZER;

/// @brief 通过 moduleName 获取 id<RCTBridgeModule> 类型实例
/// @param moduleName 组件名称
/// @return id<RCTBridgeModule> 类型组件实例
- (id)objectForKey:(NSString *)moduleName;

@end
