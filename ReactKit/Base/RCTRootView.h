// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@protocol RCTJavaScriptExecutor;

@interface RCTRootView : UIView

@property (nonatomic, strong) NSURL *scriptURL;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSDictionary *initialProperties;
@property (nonatomic, strong) id<RCTJavaScriptExecutor> executor;

/**
 * Reload this root view, or all root views, respectively.
 */
- (void)reload;
+ (void)reloadAll;

@end
