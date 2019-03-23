/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>

// A little helper to make sure we have a set of lines including width ready for use.
// We assume that we will only this in one place so no reference counting is necessary.
// Needs to be freed when dealloced.

// This is fragile since this relies on these values not getting reused. Consider
// wrapping these in an Obj-C class or some ARC hackery to get refcounting.

typedef struct {
  size_t count;
  CGFloat baseLine; // Distance from the origin to the base line of the first line
  CGFloat lineHeight; // Distance between lines
  CTLineRef *lines;
  CGFloat *widths; // Width of each line
} ARTTextFrame;
