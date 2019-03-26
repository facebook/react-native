/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <XCTest/XCTest.h>

#import <React/RCTUIManager.h>
#import <React/UIView+React.h>

@interface RCTUIManager (Testing)

- (void)_manageChildren:(NSNumber *)containerReactTag
        moveFromIndices:(NSArray *)moveFromIndices
          moveToIndices:(NSArray *)moveToIndices
      addChildReactTags:(NSArray *)addChildReactTags
           addAtIndices:(NSArray *)addAtIndices
        removeAtIndices:(NSArray *)removeAtIndices
               registry:(NSDictionary<NSNumber *, id<RCTComponent>> *)registry;

@property (nonatomic, copy, readonly) NSMutableDictionary<NSNumber *, UIView *> *viewRegistry;

@end

@interface RCTUIManagerTests : XCTestCase

@property (nonatomic, readwrite, strong) RCTUIManager *uiManager;

@end

@implementation RCTUIManagerTests

- (void)setUp
{
  [super setUp];

  _uiManager = [RCTUIManager new];

  // Register 20 views to use in the tests
  for (NSInteger i = 1; i <= 20; i++) {
    UIView *registeredView = [UIView new];
    registeredView.reactTag = @(i);
    _uiManager.viewRegistry[@(i)] = registeredView;
  }
}

- (void)testManagingChildrenToAddViews
{
  UIView *containerView = _uiManager.viewRegistry[@20];
  NSMutableArray *addedViews = [NSMutableArray array];

  NSArray *tagsToAdd = @[@1, @2, @3, @4, @5];
  NSArray *addAtIndices = @[@0, @1, @2, @3, @4];
  for (NSNumber *tag in tagsToAdd) {
    [addedViews addObject:_uiManager.viewRegistry[tag]];
  }

  // Add views 1-5 to view 20
  [_uiManager _manageChildren:@20
              moveFromIndices:nil
                moveToIndices:nil
            addChildReactTags:tagsToAdd
                 addAtIndices:addAtIndices
              removeAtIndices:nil
                     registry:_uiManager.viewRegistry];

  [containerView didUpdateReactSubviews];

  XCTAssertTrue([[containerView reactSubviews] count] == 5,
               @"Expect to have 5 react subviews after calling manage children \
               with 5 tags to add, instead have %lu", (unsigned long)[[containerView reactSubviews] count]);
  for (UIView *view in addedViews) {
    XCTAssertTrue([view reactSuperview] == containerView,
                  @"Expected to have manage children successfully add children");
    [view removeFromSuperview];
  }
}

- (void)testManagingChildrenToRemoveViews
{
  UIView *containerView = _uiManager.viewRegistry[@20];
  NSMutableArray *removedViews = [NSMutableArray array];

  NSArray *removeAtIndices = @[@0, @4, @8, @12, @16];
  for (NSNumber *index in removeAtIndices) {
    NSNumber *reactTag = @(index.integerValue + 2);
    [removedViews addObject:_uiManager.viewRegistry[reactTag]];
  }
  for (NSInteger i = 2; i < 20; i++) {
    UIView *view = _uiManager.viewRegistry[@(i)];
    [containerView insertReactSubview:view atIndex:containerView.reactSubviews.count];
  }

  // Remove views 1-5 from view 20
  [_uiManager _manageChildren:@20
              moveFromIndices:nil
                moveToIndices:nil
            addChildReactTags:nil
                 addAtIndices:nil
              removeAtIndices:removeAtIndices
                     registry:_uiManager.viewRegistry];

  [containerView didUpdateReactSubviews];

  XCTAssertEqual(containerView.reactSubviews.count, (NSUInteger)13,
               @"Expect to have 13 react subviews after calling manage children\
               with 5 tags to remove and 18 prior children, instead have %zd",
               containerView.reactSubviews.count);
  for (UIView *view in removedViews) {
    XCTAssertTrue([view reactSuperview] == nil,
                 @"Expected to have manage children successfully remove children");
    // After removing views are unregistered - we need to reregister
    _uiManager.viewRegistry[view.reactTag] = view;
  }
  for (NSInteger i = 2; i < 20; i++) {
    UIView *view = _uiManager.viewRegistry[@(i)];
    if (![removedViews containsObject:view]) {
      XCTAssertTrue([view superview] == containerView,
                   @"Should not have removed view with react tag %ld during delete but did", (long)i);
      [view removeFromSuperview];
    }
  }
}

// We want to start with views 1-10 added at indices 0-9
// Then we'll remove indices 2, 3, 5 and 8
// Add views 11 and 12 to indices 0 and 6
// And move indices 4 and 9 to 1 and 7
// So in total it goes from:
// [1,2,3,4,5,6,7,8,9,10]
// to
// [11,5,1,2,7,8,12,10]
- (void)testManagingChildrenToAddRemoveAndMove
{
  UIView *containerView = _uiManager.viewRegistry[@20];

  NSArray *removeAtIndices = @[@2, @3, @5, @8];
  NSArray *addAtIndices = @[@0, @6];
  NSArray *tagsToAdd = @[@11, @12];
  NSArray *moveFromIndices = @[@4, @9];
  NSArray *moveToIndices = @[@1, @7];

  // We need to keep these in array to keep them around
  NSMutableArray *viewsToRemove = [NSMutableArray array];
  for (NSUInteger i = 0; i < removeAtIndices.count; i++) {
    NSNumber *reactTagToRemove = @([removeAtIndices[i] integerValue] + 1);
    UIView *viewToRemove = _uiManager.viewRegistry[reactTagToRemove];
    [viewsToRemove addObject:viewToRemove];
  }

  for (NSInteger i = 1; i < 11; i++) {
    UIView *view = _uiManager.viewRegistry[@(i)];
    [containerView insertReactSubview:view atIndex:containerView.reactSubviews.count];
  }

  [_uiManager _manageChildren:@20
              moveFromIndices:moveFromIndices
                moveToIndices:moveToIndices
            addChildReactTags:tagsToAdd
                 addAtIndices:addAtIndices
              removeAtIndices:removeAtIndices
                     registry:_uiManager.viewRegistry];

  [containerView didUpdateReactSubviews];

  XCTAssertTrue([[containerView reactSubviews] count] == 8,
               @"Expect to have 8 react subviews after calling manage children,\
               instead have the following subviews %@", [containerView reactSubviews]);

  NSArray *expectedReactTags = @[@11, @5, @1, @2, @7, @8, @12, @10];
  for (NSUInteger i = 0; i < containerView.subviews.count; i++) {
    XCTAssertEqualObjects([[containerView reactSubviews][i] reactTag], expectedReactTags[i],
                 @"Expected subview at index %ld to have react tag #%@ but has tag #%@",
                         (long)i, expectedReactTags[i], [[containerView reactSubviews][i] reactTag]);
  }

  // Clean up after ourselves
  for (NSInteger i = 1; i < 13; i++) {
    UIView *view = _uiManager.viewRegistry[@(i)];
    [view removeFromSuperview];
  }
  for (UIView *view in viewsToRemove) {
    _uiManager.viewRegistry[view.reactTag] = view;
  }
}

@end
