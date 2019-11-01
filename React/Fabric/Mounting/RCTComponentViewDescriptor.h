/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Holds a native view instance and a set of attributes associated with it.
 * Mounting infrastructure uses these objects to bookkeep views and cache their
 * attributes for efficient access.
 */
class RCTComponentViewDescriptor final {
 public:
  /*
   * Associated (and owned) native view instance.
   */
  UIView<RCTComponentViewProtocol> *view;
};

NS_ASSUME_NONNULL_END
