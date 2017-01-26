/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTTEXTDECORATIONLINETYPE_H
#define RCTTEXTDECORATIONLINETYPE_H

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTTextDecorationLineType) {
  RCTTextDecorationLineTypeNone = 0,
  RCTTextDecorationLineTypeUnderline,
  RCTTextDecorationLineTypeStrikethrough,
  RCTTextDecorationLineTypeUnderlineStrikethrough,
};

#endif //RCTTEXTDECORATIONLINETYPE_H
