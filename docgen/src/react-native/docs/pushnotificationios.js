/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "PushNotificationIOS",
  "docblock": "/**\\n * <div class=\\"banner-crna-ejected\\">\\n *   <h3>Projects with Native Code Only</h3>\\n *   <p>\\n *     This section only applies to projects made with <code>react-native init</code>\\n *     or to those made with Create React Native App which have since ejected. For\\n *     more information about ejecting, please see\\n *     the <a href=\\"https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md\\" target=\\"_blank\\">guide</a> on\\n *     the Create React Native App repository.\\n *   </p>\\n * </div>\\n *\\n * Handle push notifications for your app, including permission handling and\\n * icon badge number.\\n *\\n * To get up and running, [configure your notifications with Apple](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/AddingCapabilities/AddingCapabilities.html#//apple_ref/doc/uid/TP40012582-CH26-SW6)\\n * and your server-side system.\\n *\\n * [Manually link](docs/linking-libraries-ios.html#manual-linking) the PushNotificationIOS library\\n *\\n * - Add the following to your Project: \`node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj\`\\n * - Add the following to \`Link Binary With Libraries\`: \`libRCTPushNotification.a\`\\n *\\n * Finally, to enable support for \`notification\` and \`register\` events you need to augment your AppDelegate.\\n *\\n * At the top of your \`AppDelegate.m\`:\\n *\\n *   \`#import <React/RCTPushNotificationManager.h>\`\\n *\\n * And then in your AppDelegate implementation add the following:\\n *\\n *   \`\`\`\\n *    // Required to register for notifications\\n *    - (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings\\n *    \{\\n *     [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];\\n *    }\\n *    // Required for the register event.\\n *    - (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken\\n *    \{\\n *     [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];\\n *    }\\n *    // Required for the notification event. You must call the completion handler after handling the remote notification.\\n *    - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo\\n *                                                           fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler\\n *    \{\\n *      [RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];\\n *    }\\n *    // Required for the registrationError event.\\n *    - (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error\\n *    \{\\n *     [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];\\n *    }\\n *    // Required for the localNotification event.\\n *    - (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification\\n *    \{\\n *     [RCTPushNotificationManager didReceiveLocalNotification:notification];\\n *    }\\n *   \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 133,
      "source": "= \{\\n    NewData: 'UIBackgroundFetchResultNewData',\\n    NoData: 'UIBackgroundFetchResultNoData',\\n    ResultFailed: 'UIBackgroundFetchResultFailed',\\n  };\\n\\n  /**\\n   * Schedules the localNotification for immediate presentation.\\n   *\\n   * details is an object containing:\\n   *\\n   * - \`alertBody\` : The message displayed in the notification alert.\\n   * - \`alertAction\` : The \\"action\\" displayed beneath an actionable notification. Defaults to \\"view\\";\\n   * - \`soundName\` : The sound played when the notification is fired (optional).\\n   * - \`isSilent\`  : If true, the notification will appear without sound (optional).\\n   * - \`category\`  : The category of this notification, required for actionable notifications (optional).\\n   * - \`userInfo\`  : An optional object containing additional notification data.\\n   * - \`applicationIconBadgeNumber\` (optional) : The number to display as the app's icon badge. The default value of this property is 0, which means that no badge is displayed.\\n   */\\n  static presentLocalNotification(details: Object) \{\\n    RCTPushNotificationManager.presentLocalNotification(details);\\n  }",
      "modifiers": [],
      "params": [
        \{
          "typehint": "'UIBackgroundFetchResultNewData'",
          "name": "NewData"
        },
        \{
          "typehint": "'UIBackgroundFetchResultNoData'",
          "name": "NoData"
        },
        \{
          "typehint": "'UIBackgroundFetchResultFailed'",
          "name": "ResultFailed"
        },
        \{
          "typehint": null,
          "name": "}"
        },
        \{
          "typehint": null,
          "name": "static"
        },
        \{
          "typehint": null,
          "name": "("
        },
        \{
          "typehint": null,
          "name": ":"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "="
    },
    \{
      "line": 171,
      "source": "static scheduleLocalNotification(details: Object) \{\\n    RCTPushNotificationManager.scheduleLocalNotification(details);\\n  }",
      "docblock": "/**\\n   * Schedules the localNotification for future presentation.\\n   *\\n   * details is an object containing:\\n   *\\n   * - \`fireDate\` : The date and time when the system should deliver the notification.\\n   * - \`alertBody\` : The message displayed in the notification alert.\\n   * - \`alertAction\` : The \\"action\\" displayed beneath an actionable notification. Defaults to \\"view\\";\\n   * - \`soundName\` : The sound played when the notification is fired (optional).\\n   * - \`isSilent\`  : If true, the notification will appear without sound (optional).\\n   * - \`category\`  : The category of this notification, required for actionable notifications (optional).\\n   * - \`userInfo\` : An optional object containing additional notification data.\\n   * - \`applicationIconBadgeNumber\` (optional) : The number to display as the app's icon badge. Setting the number to 0 removes the icon badge.\\n   * - \`repeatInterval\` : The interval to repeat as a string.  Possible values: \`minute\`, \`hour\`, \`day\`, \`week\`, \`month\`, \`year\`.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "details"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "scheduleLocalNotification"
    },
    \{
      "line": 178,
      "source": "static cancelAllLocalNotifications() \{\\n    RCTPushNotificationManager.cancelAllLocalNotifications();\\n  }",
      "docblock": "/**\\n   * Cancels all scheduled localNotifications\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "cancelAllLocalNotifications"
    },
    \{
      "line": 185,
      "source": "static removeAllDeliveredNotifications(): void \{\\n    RCTPushNotificationManager.removeAllDeliveredNotifications();\\n  }",
      "docblock": "/**\\n   * Remove all delivered notifications from Notification Center\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "void",
      "name": "removeAllDeliveredNotifications"
    },
    \{
      "line": 203,
      "source": "atic getDeliveredNotifications(callback: (notifications: [Object]) => void): void \{\\n    RCTPushNotificationManager.getDeliveredNotifications(callback);\\n  }\\n\\n",
      "docblock": "/**\\n   * Provides you with a list of the app’s notifications that are still displayed in Notification Center\\n   *\\n   * @param callback Function which receive an array of delivered notifications\\n   *\\n   *  A delivered notification is an object containing:\\n   *\\n   * - \`identifier\`  : The identifier of this notification.\\n   * - \`title\`  : The title of this notification.\\n   * - \`body\`  : The body of this notification.\\n   * - \`category\`  : The category of this notification, if has one.\\n   * - \`userInfo\`  : An optional object containing additional notification data.\\n   * - \`thread-id\`  : The thread identifier of this notification, if has one.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "(notifications: [Object]) => void):",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": "void \{",
      "name": "getDeliveredNotifications"
    },
    \{
      "line": 212,
      "source": "atic removeDeliveredNotifications(identifiers: [string]): void \{\\n    RCTPushNotificationManager.removeDeliveredNotifications(identifiers);\\n  }\\n\\n",
      "docblock": "/**\\n   * Removes the specified notifications from Notification Center\\n   *\\n   * @param identifiers Array of notification identifiers\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "[string]):",
          "name": "identifiers"
        }
      ],
      "tparams": null,
      "returntypehint": "void \{",
      "name": "removeDeliveredNotifications"
    },
    \{
      "line": 219,
      "source": "atic setApplicationIconBadgeNumber(number: number) \{\\n    RCTPushNotificationManager.setApplicationIconBadgeNumber(number);\\n  }\\n\\n",
      "docblock": "/**\\n   * Sets the badge number for the app icon on the home screen\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "number) ",
          "name": "number"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "setApplicationIconBadgeNumber"
    },
    \{
      "line": 226,
      "source": "atic getApplicationIconBadgeNumber(callback: Function) \{\\n    RCTPushNotificationManager.getApplicationIconBadgeNumber(callback);\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the current badge number for the app icon on the home screen\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Function) ",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "getApplicationIconBadgeNumber"
    },
    \{
      "line": 237,
      "source": "atic cancelLocalNotifications(userInfo: Object) \{\\n    RCTPushNotificationManager.cancelLocalNotifications(userInfo);\\n  }\\n\\n",
      "docblock": "/**\\n   * Cancel local notifications.\\n   *\\n   * Optionally restricts the set of canceled notifications to those\\n   * notifications whose \`userInfo\` fields match the corresponding fields\\n   * in the \`userInfo\` argument.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object) ",
          "name": "userInfo"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "cancelLocalNotifications"
    },
    \{
      "line": 244,
      "source": "atic getScheduledLocalNotifications(callback: Function) \{\\n    RCTPushNotificationManager.getScheduledLocalNotifications(callback);\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the local notifications that are currently scheduled.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Function) ",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "getScheduledLocalNotifications"
    },
    \{
      "line": 265,
      "source": "atic addEventListener(type: PushNotificationEventName, handler: Function) \{\\n    invariant(\\n      type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification',\\n      'PushNotificationIOS only supports \`notification\`, \`register\`, \`registrationError\`, and \`localNotification\` events'\\n    );\\n    var listener;\\n    if (type === 'notification') \{\\n      listener =  PushNotificationEmitter.addListener(\\n        DEVICE_NOTIF_EVENT,\\n        (notifData) => \{\\n          handler(new PushNotificationIOS(notifData));\\n        }\\n      );\\n    } else if (type === 'localNotification') \{\\n      listener = PushNotificationEmitter.addListener(\\n        DEVICE_LOCAL_NOTIF_EVENT,\\n        (notifData) => \{\\n          handler(new PushNotificationIOS(notifData));\\n        }\\n      );\\n    } else if (type === 'register') \{\\n      listener = PushNotificationEmitter.addListener(\\n        NOTIF_REGISTER_EVENT,\\n        (registrationInfo) => \{\\n          handler(registrationInfo.deviceToken);\\n        }\\n      );\\n    } else if (type === 'registrationError') \{\\n      listener = PushNotificationEmitter.addListener(\\n        NOTIF_REGISTRATION_ERROR_EVENT,\\n        (errorInfo) => \{\\n          handler(errorInfo);\\n        }\\n      );\\n    }\\n    _notifHandlers.set(type, listener);\\n  }\\n\\n",
      "docblock": "/**\\n   * Attaches a listener to remote or local notification events while the app is running\\n   * in the foreground or the background.\\n   *\\n   * Valid events are:\\n   *\\n   * - \`notification\` : Fired when a remote notification is received. The\\n   *   handler will be invoked with an instance of \`PushNotificationIOS\`.\\n   * - \`localNotification\` : Fired when a local notification is received. The\\n   *   handler will be invoked with an instance of \`PushNotificationIOS\`.\\n   * - \`register\`: Fired when the user registers for remote notifications. The\\n   *   handler will be invoked with a hex string representing the deviceToken.\\n   * - \`registrationError\`: Fired when the user fails to register for remote\\n   *   notifications. Typically occurs when APNS is having issues, or the device\\n   *   is a simulator. The handler will be invoked with\\n   *   \{message: string, code: number, details: any}.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "PushNotificationEventName, ",
          "name": "type"
        },
        \{
          "typehint": "Function) ",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addEventListener"
    },
    \{
      "line": 307,
      "source": "atic removeEventListener(type: PushNotificationEventName, handler: Function) \{\\n    invariant(\\n      type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification',\\n      'PushNotificationIOS only supports \`notification\`, \`register\`, \`registrationError\`, and \`localNotification\` events'\\n    );\\n    var listener = _notifHandlers.get(type);\\n    if (!listener) \{\\n      return;\\n    }\\n    listener.remove();\\n    _notifHandlers.delete(type);\\n  }\\n\\n",
      "docblock": "/**\\n   * Removes the event listener. Do this in \`componentWillUnmount\` to prevent\\n   * memory leaks\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "PushNotificationEventName, ",
          "name": "type"
        },
        \{
          "typehint": "Function) ",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeEventListener"
    },
    \{
      "line": 338,
      "source": "atic requestPermissions(permissions?: \{\\n    alert?: boolean,\\n    badge?: boolean,\\n    sound?: boolean\\n  }): Promise<\{\\n    alert: boolean,\\n    badge: boolean,\\n    sound: boolean\\n  }> \{\\n    var requestedPermissions = \{};\\n    if (permissions) \{\\n      requestedPermissions = \{\\n        alert: !!permissions.alert,\\n        badge: !!permissions.badge,\\n        sound: !!permissions.sound\\n      };\\n    } else \{\\n      requestedPermissions = \{\\n        alert: true,\\n        badge: true,\\n        sound: true\\n      };\\n    }\\n    return RCTPushNotificationManager.requestPermissions(requestedPermissions);\\n  }\\n\\n",
      "docblock": "/**\\n   * Requests notification permissions from iOS, prompting the user's\\n   * dialog box. By default, it will request all notification permissions, but\\n   * a subset of these can be requested by passing a map of requested\\n   * permissions.\\n   * The following permissions are supported:\\n   *\\n   *   - \`alert\`\\n   *   - \`badge\`\\n   *   - \`sound\`\\n   *\\n   * If a map is provided to the method, only the permissions with truthy values\\n   * will be requested.\\n\\n   * This method returns a promise that will resolve when the user accepts,\\n   * rejects, or if the permissions were previously rejected. The promise\\n   * resolves to the current state of the permission.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\n    alert?: boolean,\\n    badge?: boolean,\\n    sound?: boolean\\n  }):",
          "name": "permissions?"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<\{\\n    alert: boolean,\\n    badge: boolean,\\n    sound: boolean\\n  }> \{",
      "name": "requestPermissions"
    },
    \{
      "line": 372,
      "source": "atic abandonPermissions() \{\\n    RCTPushNotificationManager.abandonPermissions();\\n  }\\n\\n",
      "docblock": "/**\\n   * Unregister for all remote notifications received via Apple Push Notification service.\\n   *\\n   * You should call this method in rare circumstances only, such as when a new version of\\n   * the app removes support for all types of remote notifications. Users can temporarily\\n   * prevent apps from receiving remote notifications through the Notifications section of\\n   * the Settings app. Apps unregistered through this method can always re-register.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "abandonPermissions"
    },
    \{
      "line": 384,
      "source": "atic checkPermissions(callback: Function) \{\\n    invariant(\\n      typeof callback === 'function',\\n      'Must provide a valid callback'\\n    );\\n    RCTPushNotificationManager.checkPermissions(callback);\\n  }\\n\\n",
      "docblock": "/**\\n   * See what push permissions are currently enabled. \`callback\` will be\\n   * invoked with a \`permissions\` object:\\n   *\\n   *  - \`alert\` :boolean\\n   *  - \`badge\` :boolean\\n   *  - \`sound\` :boolean\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Function) ",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "checkPermissions"
    },
    \{
      "line": 396,
      "source": "atic getInitialNotification(): Promise<?PushNotificationIOS> \{\\n    return RCTPushNotificationManager.getInitialNotification().then(notification => \{\\n      return notification && new PushNotificationIOS(notification);\\n    });\\n  }\\n\\n",
      "docblock": "/**\\n   * This method returns a promise that resolves to either the notification\\n   * object if the app was launched by a push notification, or \`null\` otherwise.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": "Promise<?PushNotificationIOS> \{",
      "name": "getInitialNotification"
    },
    \{
      "line": 407,
      "source": "nstructor(nativeNotif: Object) \{\\n    this._data = \{};\\n    this._remoteNotificationCompleteCallbackCalled = false;\\n    this._isRemote = nativeNotif.remote;\\n    if (this._isRemote) \{\\n      this._notificationId = nativeNotif.notificationId;\\n    }\\n\\n    if (nativeNotif.remote) \{\\n      // Extract data from Apple's \`aps\` dict as defined:\\n      // https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html\\n      Object.keys(nativeNotif).forEach((notifKey) => \{\\n        var notifVal = nativeNotif[notifKey];\\n        if (notifKey === 'aps') \{\\n          this._alert = notifVal.alert;\\n          this._sound = notifVal.sound;\\n          this._badgeCount = notifVal.badge;\\n          this._category = notifVal.category;\\n          this._contentAvailable = notifVal['content-available'];\\n        } else \{\\n          this._data[notifKey] = notifVal;\\n        }\\n      });\\n    } else \{\\n      // Local notifications aren't being sent down with \`aps\` dict.\\n      this._badgeCount = nativeNotif.applicationIconBadgeNumber;\\n      this._sound = nativeNotif.soundName;\\n      this._alert = nativeNotif.alertBody;\\n      this._data = nativeNotif.userInfo;\\n      this._category = nativeNotif.category;\\n    }\\n  }\\n\\n",
      "docblock": "/**\\n   * You will never need to instantiate \`PushNotificationIOS\` yourself.\\n   * Listening to the \`notification\` event and invoking\\n   * \`getInitialNotification\` is sufficient\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "Object) ",
          "name": "nativeNotif"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "constructor"
    },
    \{
      "line": 453,
      "source": "nish(fetchResult: FetchResult) \{\\n    if (!this._isRemote || !this._notificationId || this._remoteNotificationCompleteCallbackCalled) \{\\n      return;\\n    }\\n    this._remoteNotificationCompleteCallbackCalled = true;\\n\\n    RCTPushNotificationManager.onFinishRemoteNotification(this._notificationId, fetchResult);\\n  }\\n\\n",
      "docblock": "/**\\n   * This method is available for remote notifications that have been received via:\\n   * \`application:didReceiveRemoteNotification:fetchCompletionHandler:\`\\n   * https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/#//apple_ref/occ/intfm/UIApplicationDelegate/application:didReceiveRemoteNotification:fetchCompletionHandler:\\n   *\\n   * Call this to execute when the remote notification handling is complete. When\\n   * calling this block, pass in the fetch result value that best describes\\n   * the results of your operation. You *must* call this handler and should do so\\n   * as soon as possible. For a list of possible values, see \`PushNotificationIOS.FetchResult\`.\\n   *\\n   * If you do not call this method your background remote notifications could\\n   * be throttled, to read more about it see the above documentation link.\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "FetchResult) ",
          "name": "fetchResult"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "finish"
    },
    \{
      "line": 465,
      "source": "tMessage(): ?string | ?Object \{\\n    // alias because \\"alert\\" is an ambiguous name\\n    return this._alert;\\n  }\\n\\n",
      "docblock": "/**\\n   * An alias for \`getAlert\` to get the notification's main message string\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?string | ?Object \{",
      "name": "getMessage"
    },
    \{
      "line": 473,
      "source": "tSound(): ?string \{\\n    return this._sound;\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the sound string from the \`aps\` object\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?string \{",
      "name": "getSound"
    },
    \{
      "line": 480,
      "source": "tCategory(): ?string \{\\n    return this._category;\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the category string from the \`aps\` object\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?string \{",
      "name": "getCategory"
    },
    \{
      "line": 487,
      "source": "tAlert(): ?string | ?Object \{\\n    return this._alert;\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the notification's main message from the \`aps\` object\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?string | ?Object \{",
      "name": "getAlert"
    },
    \{
      "line": 494,
      "source": "tContentAvailable(): ContentAvailable \{\\n    return this._contentAvailable;\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the content-available number from the \`aps\` object\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "ContentAvailable \{",
      "name": "getContentAvailable"
    },
    \{
      "line": 501,
      "source": "tBadgeCount(): ?number \{\\n    return this._badgeCount;\\n  }\\n\\n",
      "docblock": "/**\\n   * Gets the badge count number from the \`aps\` object\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?number \{",
      "name": "getBadgeCount"
    },
    \{
      "line": 508,
      "source": "tData(): ?Object \{\\n    return this._data;\\n  }\\n}",
      "docblock": "/**\\n   * Gets the data object on the notif\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "?Object \{",
      "name": "getData"
    }
  ],
  "type": "api",
  "line": 122,
  "requires": [
    \{
      "name": "NativeEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/PushNotificationIOS/PushNotificationIOS.js",
  "componentName": "PushNotificationIOS",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"pushnotificationios","title":"PushNotificationIOS","layout":"autodocs","category":"APIs","permalink":"docs/pushnotificationios.html","platform":"ios","next":"settings","previous":"pixelratio","sidebar":true,"path":"Libraries/PushNotificationIOS/PushNotificationIOS.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;