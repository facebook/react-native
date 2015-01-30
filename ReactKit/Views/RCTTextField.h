// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTJavaScriptEventDispatcher;

@interface RCTTextField : UITextField

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL autoCorrect;
@property (nonatomic, assign) UIEdgeInsets paddingEdgeInsets; // TODO: contentInset

- (instancetype)initWithFrame:(CGRect)frame eventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher;

@end
