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
 * Holds a native view class and a set of attributes associated with it.
 */
class RCTComponentViewClassDescriptor final {
 public:
  /*
   * Associated (and owned) native view class.
   */
  Class<RCTComponentViewProtocol> viewClass;

  /*
   * Indicates a requirement to call on the view methods from
   * `RCTMountingTransactionObserving` protocol.
   */
  bool observesMountingTransactionWillMount{false};
  bool observesMountingTransactionDidMount{false};
};

NS_ASSUME_NONNULL_END
