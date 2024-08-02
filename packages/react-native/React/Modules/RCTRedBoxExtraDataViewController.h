/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@protocol RCTRedBoxExtraDataActionDelegate <NSObject>
- (void)reload;
@end

#if !TARGET_OS_OSX // [macOS]
@interface RCTRedBoxExtraDataViewController : UIViewController <UITableViewDelegate, UITableViewDataSource>
#else // [macOS
@interface RCTRedBoxExtraDataViewController : NSViewController <NSTableViewDelegate, NSTableViewDataSource>
#endif // macOS]

@property (nonatomic, weak) id<RCTRedBoxExtraDataActionDelegate> actionDelegate;

- (void)addExtraData:(NSDictionary *)data forIdentifier:(NSString *)identifier;

@end

