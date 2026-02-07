/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Foundation
import React

/// A sample Swift TurboModule that performs basic arithmetic operations.
/// This demonstrates how to write TurboModules in pure Swift.
@objc(NativeCalculator)
public class NativeCalculator: NSObject, NativeCalculatorSpec {

  @objc public static func moduleName() -> String! {
    return "NativeCalculator"
  }

  @objc public func add(_ a: Double, b: Double) -> NSNumber {
    return NSNumber(value: a + b)
  }

  @objc public func subtract(_ a: Double, b: Double) -> NSNumber {
    return NSNumber(value: a - b)
  }

  @objc public func multiply(_ a: Double, b: Double) -> NSNumber {
    return NSNumber(value: a * b)
  }

  @objc public func divide(_ a: Double, b: Double) -> NSNumber {
    guard b != 0 else {
      return NSNumber(value: Double.nan)
    }
    return NSNumber(value: a / b)
  }
}
