// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>

#if RCT_DEV

@class RCTInspectorRemoteConnection;

@interface RCTInspectorLocalConnection : NSObject
- (void)sendMessage:(NSString *)message;
- (void)disconnect;
@end

@interface RCTInspectorPage : NSObject
@property (nonatomic, readonly) NSInteger id;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) NSString *vm;
@end

@interface RCTInspector : NSObject
+ (NSArray<RCTInspectorPage *> *)pages;
+ (RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(RCTInspectorRemoteConnection *)remote;
@end

#endif
