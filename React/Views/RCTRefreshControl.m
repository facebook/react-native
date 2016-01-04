/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRefreshControl.h"

#import "RCTUtils.h"

@implementation RCTRefreshControl

- (instancetype)init
{
  if ((self = [super init])) {
    [self addTarget:self action:@selector(refreshControlValueChanged) forControlEvents:UIControlEventValueChanged];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (NSString *)title
{
  return self.attributedTitle.string;
}

- (void)setTitle:(NSString *)title
{
  self.attributedTitle = [[NSAttributedString alloc] initWithString:title];
}

- (void)setRefreshing:(BOOL)refreshing
{
  if (super.refreshing != refreshing) {
    if (refreshing) {
      [self beginRefreshing];
    } else {
      [self endRefreshing];
    }
  }
}

- (void)refreshControlValueChanged
{
  if (_onRefresh) {
    _onRefresh(nil);
  }
}

@end
