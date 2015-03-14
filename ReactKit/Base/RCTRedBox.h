// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTRedBox : NSObject

+ (instancetype)sharedInstance;

- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray *)stack;

- (NSString *)currentErrorMessage;

- (void)dismiss;

@end
