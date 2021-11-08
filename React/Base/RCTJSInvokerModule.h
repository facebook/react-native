/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This protocol should be adopted when a turbo module needs to directly call into JavaScript.
 * In bridge-less React Native, it is a replacement for [_bridge enqueueJSCall:].
 */
@protocol RCTJSInvokerModule

@property (nonatomic, copy, nonnull) void (^invokeJS)(NSString * _Nullable module, NSString * _Nullable method, NSArray * _Nullable args); // TODO(macOS GH#774)
@property (nonatomic, copy) void (^invokeJSWithModuleDotMethod)(NSString * _Nullable moduleDotMethod, NSArray * _Nullable args);

@end
