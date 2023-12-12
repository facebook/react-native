import React
import React_RCTAppDelegate

@main
class AppDelegate: RCTAppDelegate {
    override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        self.moduleName = "HelloWorld"
        // You can add your custom initial props in the dictionary below.
        // They will be passed down to the ViewController used by React Native.
        self.initialProps = [:]

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    override func sourceURL(for bridge: RCTBridge!) -> URL! {
        return self.getBundleURL()
    }

    func getBundleURL() -> URL {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")!
        #endif
    }
}
