/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSnapshotManager.h"

@interface RCTSnapshotView : UIView

@property (nonatomic, copy) RCTDirectEventBlock onSnapshotReady;
@property (nonatomic, copy) NSString *testIdentifier;

@end

@implementation RCTSnapshotView

- (void)setTestIdentifier:(NSString *)testIdentifier
{
  if (![_testIdentifier isEqualToString:testIdentifier]) {
    _testIdentifier = [testIdentifier copy];
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onSnapshotReady) {
        self.onSnapshotReady(@{@"testIdentifier" : self.testIdentifier});
      }
    });
  }
}

@end


@implementation RCTSnapshotManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTSnapshotView new];
}

RCT_EXPORT_VIEW_PROPERTY(testIdentifier, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, RCTDirectEventBlock)

@end
