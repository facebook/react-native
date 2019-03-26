/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

@protocol RCTRedBoxExtraDataActionDelegate <NSObject>
- (void)reload;
@end

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@interface RCTRedBoxExtraDataViewController : UIViewController <UITableViewDelegate, UITableViewDataSource>
#else // [TODO(macOS ISS#2323203)
@interface RCTRedBoxExtraDataViewController : UIViewController <NSTableViewDataSource, NSTableViewDelegate>
#endif // ]TODO(macOS ISS#2323203)

@property (nonatomic, weak) id<RCTRedBoxExtraDataActionDelegate> actionDelegate;

- (void)addExtraData:(NSDictionary *)data forIdentifier:(NSString *)identifier;

@end
