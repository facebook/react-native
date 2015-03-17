// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#define TIMEOUT_SECONDS 240

@interface UIExplorerTests : XCTestCase

@end

@implementation UIExplorerTests

- (BOOL)findSubviewInView:(UIView *)view matching:(BOOL(^)(UIView *view))test
{
  if (test(view)) {
    return YES;
  }
  for (UIView *subview in [view subviews]) {
    if ([self findSubviewInView:subview matching:test]) {
      return YES;
    }
  }
  return NO;
}

- (void)testRootViewLoadsAndRenders {
  UIViewController *vc = [[[[UIApplication sharedApplication] delegate] window] rootViewController];

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  BOOL foundElement = NO;

  while ([date timeIntervalSinceNow] > 0 && !foundElement) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:date];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:date];

    foundElement = [self findSubviewInView:vc.view matching:^BOOL(UIView *view) {
      if ([view respondsToSelector:@selector(attributedText)]) {
        NSString *text = [(id)view attributedText].string;
        if ([text isEqualToString:@"<View>"]) {
          return YES;
        }
      }
      return NO;
    }];
  }

  XCTAssertTrue(foundElement, @"Cound't find element with '<View>' text in %d seconds", TIMEOUT_SECONDS);
}


@end
