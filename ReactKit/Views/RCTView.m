// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTConvert.h"
#import "RCTLog.h"

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = [subview accessibilityLabel];
    if (label) {
      [str appendString:@" "];
      [str appendString:label];
    } else {
      [str appendString:RCTRecursiveAccessibilityLabel(subview)];
    }
  }
  return str;
}

@implementation RCTView

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    _pointerEvents = RCTPointerEventsUnspecified;
  }
  return self;
}

- (NSString *)accessibilityLabel
{
  if (super.accessibilityLabel) {
    return super.accessibilityLabel;
  }
  return RCTRecursiveAccessibilityLabel(self);
}

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO; // TODO: find out what this is for
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  switch (_pointerEvents) {
    case RCTPointerEventsNone:
      return nil;
    case RCTPointerEventsUnspecified:
      return [super hitTest:point withEvent:event];
    case RCTPointerEventsBoxOnly:
      return [super hitTest:point withEvent:event] ? self: nil;
    case RCTPointerEventsBoxNone:
      for (UIView *subview in [self.subviews reverseObjectEnumerator]) {
        if (!subview.isHidden && subview.isUserInteractionEnabled && subview.alpha > 0) {
          CGPoint convertedPoint = [subview convertPoint:point fromView:self];
          UIView *subviewHitTestView = [subview hitTest:convertedPoint withEvent:event];
          if (subviewHitTestView != nil) {
            return subviewHitTestView;
          }
        }
      }
      return nil;
    default:
      RCTLogError(@"Invalid pointer-events specified %zd on %@", _pointerEvents, self);
      return [super hitTest:point withEvent:event];
  }
}

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = [self contentInsetsForView:parentView];
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
  [scrollView setContentInset:baseInset];
  [scrollView setScrollIndicatorInsets:baseInset];

  if (updateOffset) {
    // If we're adjusting the top inset, then let's also adjust the contentOffset so that the view
    // elements above the top guide do not cover the content.
    // This is generally only needed when your views are initially laid out, for
    // manual changes to contentOffset, you can optionally disable this step
    CGFloat currentInsetTop = scrollView.contentInset.top;
    if (currentInsetTop != previousInsetTop) {
      contentOffset.y -= (currentInsetTop - previousInsetTop);
      scrollView.contentOffset = contentOffset;
    }
  }
}

+ (UIViewController *)backingViewControllerForView:(UIView *)view
{
  id responder = [view nextResponder];
  if ([responder isKindOfClass:[UIViewController class]]) {
    return responder;
  }
  return nil;
}

+ (UIEdgeInsets)contentInsetsForView:(UIView *)view
{
  while (view) {
    UIViewController *controller = [self backingViewControllerForView:view];
    if (controller) {
      return (UIEdgeInsets){
        controller.topLayoutGuide.length, 0,
        controller.bottomLayoutGuide.length, 0
      };
    }
    view = view.superview;
  }
  return UIEdgeInsetsZero;
}

@end
