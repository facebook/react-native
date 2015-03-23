// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTText : UIView

@property (nonatomic, copy) NSAttributedString *attributedText;
@property (nonatomic, assign) NSLineBreakMode lineBreakMode;
@property (nonatomic, assign) NSUInteger numberOfLines;

- (NSNumber *)reactTagAtPoint:(CGPoint)point;

@end
