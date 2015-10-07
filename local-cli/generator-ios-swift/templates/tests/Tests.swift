/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/

import UIKit
import XCTest

let TIMEOUT_SECONDS: Double = 240
let TEXT_TO_LOOK_FOR: String = "Welcome to React Native!"

class <%= name %>Tests: XCTestCase {

	override func setUp() {
		super.setUp()
	}

	override func tearDown() {
		super.tearDown()
	}

	func testRendersWelcomeScreen() {
		let vc: UIViewController? = UIApplication.sharedApplication().delegate?.window?!.rootViewController
		let date: NSDate = NSDate(timeIntervalSinceNow: TIMEOUT_SECONDS)
		var foundElement: Bool = false
		var redboxError: String? = nil

		RCTSetLogFunction({ (level, fileName, lineNumber, message) -> () in
			if level.rawValue >= RCTLogLevel.Error.rawValue {
				redboxError = message
			}
		})

		while date.timeIntervalSinceNow > 0 && !foundElement && redboxError == nil {
			NSRunLoop.mainRunLoop().runMode(NSDefaultRunLoopMode, beforeDate: NSDate(timeIntervalSinceNow: 0.1))
			NSRunLoop.mainRunLoop().runMode(NSRunLoopCommonModes, beforeDate: NSDate(timeIntervalSinceNow: 0.1))

			foundElement = findSubview(vc!.view!, matchingTest: { (view) -> Bool in
				return view.accessibilityLabel != nil && view.accessibilityLabel!.isEqual(TEXT_TO_LOOK_FOR)
			})
		}

		XCTAssertNil(redboxError, "Redbox error: \(redboxError)")
		XCTAssertTrue(foundElement, "Couldn't find element with text \(TEXT_TO_LOOK_FOR) in \(TIMEOUT_SECONDS) seconds")
	}

	func findSubview(view: UIView, matchingTest: UIView -> Bool) -> Bool {
		if matchingTest(view) {
			return true
		}
		for subview in view.subviews {
			if findSubview(subview, matchingTest: matchingTest) {
				return true
			}
		}
		return false
	}
}
