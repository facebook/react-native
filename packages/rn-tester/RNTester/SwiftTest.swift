/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The SwiftTest here in rn-tester acts as a guard to make sure that we can build React-Core clang module and import from Swift.
import React

func getReactNativeVersion() -> String {
  let version = RCTGetReactNativeVersion()
  guard let major = version?[RCTVersionMajor],
        let minor = version?[RCTVersionMinor],
        let patch = version?[RCTVersionPatch] else {
    fatalError()
  }
  var result = "\(major).\(minor).\(patch)"
  if let prerelease = version?[RCTVersionPrerelease] {
    result += "-\(prerelease)"
  }
  return result
}
