//  Copyright (c) 2015 Doe Pics Hit, Inc. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIApplication.h>

typedef NSString*(^BBReturnNSStringCallback)();
typedef BOOL (^BBReturnBooleanCallback)();
typedef void (^BBCallback)();

@interface BuddyBuildSDK : NSObject

// Deprecated
+ (void)setup:(id<UIApplicationDelegate>)bbAppDelegate;

/**
 * Initialize the SDK
 *
 * This should be called at (or near) the start of the appdelegate
 */
+ (void)setup;

/*
 * Associate arbitrary key/value pairs with your crash reports
 * which will be visible from the buddybuild dashboard
 */
+ (void) setCrashMetadataObject:(id)object forKey:(NSString*)key;

/*
 * Programatically trigger the screenshot feedback UI without pressing the screenshot buttons
 * If you have screenshot feedback disabled through the buddybuild setting,
 * you can still trigger it by calling this method
 */

+ (void)takeScreenshotAndShowFeedbackScreen;

/*
 * If you distribute a build to someone with their email address, buddybuild can 
 * figure out who they are and attach their info to feedback and crash reports.
 *
 * However, if you send out a build to a mailing list, or through TestFlight or 
 * the App Store we are unable to infer who they are. If you see 'Unknown User' 
 * this is likely the cause.

 * Often you'll know the identity of your user, for example, after they've 
 * logged in. You can provide buddybuild a callback to identify the current user.
 */

+ (void)setUserDisplayNameCallback:(BBReturnNSStringCallback)bbCallback;

/*
 * You might have API keys and other secrets that your app needs to consume. 
 * However, you may not want to check these secrets into the source code.
 *
 * You can provide your secrets to buddybuild. Buddybuild can then expose them 
 * to you at build time through environment variables. These secrets can also be
 * configured to be included into built app. We obfuscate the device keys to 
 * prevent unauthorized access.
 */
+ (NSString*)valueForDeviceKey:(NSString*)bbKey;

/*
 * To temporarily disable screenshot interception you can provide a callback 
 * here.
 * 
 * When screenshotting is turned on through a buddybuild setting, and no
 * callback is provided then screenshotting is by default on.
 *
 * If screenshotting is disabled through the buddybuild setting, then this
 * callback has no effect
 *
 */
+ (void)setScreenshotAllowedCallback:(BBReturnBooleanCallback)bbCallback;

/*
 * Once a piece of feedback is sent this callback will be called
 * so you can take additional actions if necessary
 */
+ (void)setScreenshotFeedbackSentCallback:(BBCallback)bbCallback;

/*
 * Once a crash report is sent this callback will be called
 * so you can take additional actions if necessary
 */
+ (void)setCrashReportSentCallback:(BBCallback)bbCallback;

/* 
 * Buddybuild Build Number
 */
+ (NSString*)buildNumber;

/*
 * Scheme
 */
+ (NSString*)scheme;

/*
 * App ID
 */
+ (NSString*)appID;

/*
 * Build ID
 */
+ (NSString*)buildID;

/*
 * Build Configuration
 */

+ (NSString*)buildConfiguration;

/*
 * Branch name for this build
 */

+ (NSString*)branchName;

/*
 * Returns the user's email or more specifically, the email that was used to download and deploy the build.
 * Returns "Unknown User" in cases where buddybuild is unable to identify the user.
 * This is the same email seen in crash instances and feedbacks in the dashboard
 * NOTE: To be called after [BuddyBuildSDK setup]
 * this is different than the one returned in the user display name callback.
*/
+ (NSString*)userEmail;

/* Manually invoke the screenshot tutorial
 * If you don't want it to appear on app launch, disable it in the
 * dashboard by going to settings -> buddybuildSDK -> Feature Settings and turning off the screenshot tutorial
 * You will be able to show it at any time from anywhere in your app
 */
+ (void) showScreenshotTutorial;


+ (void) crash;

/*
 * Logs to the console only while the debugger is attached (when running in Xcode)
 * They can be downloaded in crash instances and feedbacks in the dashboard
 */
+ (void)log:(NSString *)message;

@end

@interface UIView (BuddyBuildSDK)

// Certain features of buddybuild involve capturing the screen (either through a static screenshot, or as a video for instant replays in crash reporting or video feedback.
// Your app may contain certain sensitive customer information that you do not want to be included in the video.
// If you set this property to be true, this view will be redacted from the screen capture and blacked out

@property (nonatomic, assign) BOOL buddybuildViewIsPrivate;

@end
