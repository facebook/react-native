/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

	var window: UIWindow?

	func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {

		let jsCodeLocation: NSURL?

		/**
		* Loading JavaScript code - uncomment the one you want.
		*
		* OPTION 1
		* Load from development server. Start the server from the repository root:
		*
		* $ npm start
		*
		* To run on device, change `localhost` to the IP address of your computer
		* (you can get this by typing `ifconfig` into the terminal and selecting the
		* `inet` value under `en0:`) and make sure your computer and iOS device are
		* on the same Wi-Fi network.
		*/

		jsCodeLocation = NSURL(string: "http://localhost:8081/index.ios.bundle?platform=ios")

    /**
		  * OPTION 2
		  * Load from pre-bundled file on disk. To re-generate the static bundle
		  * from the root of your project directory, run
		  *
		  * $ react-native bundle --minify
		  *
		  * see http://facebook.github.io/react-native/docs/runningondevice.html
		  */

//		jsCodeLocation = NSBundle.mainBundle().URLForResource("main", withExtension: "jsbundle")


		let rootView = RCTRootView(bundleURL: jsCodeLocation,
			                         moduleName: "<%= name %>",
			                         initialProperties: nil,
			                         launchOptions: launchOptions)

		let rootViewController = ViewController()
		rootViewController.view = rootView

		self.window = UIWindow(frame: UIScreen.mainScreen().bounds)
		self.window?.rootViewController = rootViewController
		self.window?.makeKeyAndVisible()

		return true
	}

}
