// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTEventDispatcher;

@interface RCTTextField : UITextField

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL autoCorrect;
@property (nonatomic, assign) UIEdgeInsets paddingEdgeInsets; // TODO: contentInset

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher;

@end
