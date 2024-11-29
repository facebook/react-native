/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol RCTRedBoxExtraDataActionDelegate <NSObject>
- (void)reload;
@end

@interface RCTRedBoxExtraDataViewController : UIViewController <UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, weak) id<RCTRedBoxExtraDataActionDelegate> actionDelegate;

- (void)addExtraData:(NSDictionary *)data forIdentifier:(NSString *)identifier;

@end
