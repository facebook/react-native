/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "Linking",
  "docblock": "/**\\n * <div class=\\"banner-crna-ejected\\">\\n *   <h3>Projects with Native Code Only</h3>\\n *   <p>\\n *     This section only applies to projects made with <code>react-native init</code>\\n *     or to those made with Create React Native App which have since ejected. For\\n *     more information about ejecting, please see\\n *     the <a href=\\"https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md\\" target=\\"_blank\\">guide</a> on\\n *     the Create React Native App repository.\\n *   </p>\\n * </div>\\n *\\n * \`Linking\` gives you a general interface to interact with both incoming\\n * and outgoing app links.\\n *\\n * ### Basic Usage\\n *\\n * #### Handling deep links\\n *\\n * If your app was launched from an external url registered to your app you can\\n * access and handle it from any component you want with\\n *\\n * \`\`\`\\n * componentDidMount() \{\\n *   Linking.getInitialURL().then((url) => \{\\n *     if (url) \{\\n *       console.log('Initial url is: ' + url);\\n *     }\\n *   }).catch(err => console.error('An error occurred', err));\\n * }\\n * \`\`\`\\n *\\n * NOTE: For instructions on how to add support for deep linking on Android,\\n * refer to [Enabling Deep Links for App Content - Add Intent Filters for Your Deep Links](http://developer.android.com/training/app-indexing/deep-linking.html#adding-filters).\\n *\\n * If you wish to receive the intent in an existing instance of MainActivity,\\n * you may set the \`launchMode\` of MainActivity to \`singleTask\` in\\n * \`AndroidManifest.xml\`. See [\`<activity>\`](http://developer.android.com/guide/topics/manifest/activity-element.html)\\n * documentation for more information.\\n *\\n * \`\`\`\\n * <activity\\n *   android:name=\\".MainActivity\\"\\n *   android:launchMode=\\"singleTask\\">\\n * \`\`\`\\n *\\n * NOTE: On iOS, you'll need to link \`RCTLinking\` to your project by following\\n * the steps described [here](docs/linking-libraries-ios.html#manual-linking).\\n * If you also want to listen to incoming app links during your app's\\n * execution, you'll need to add the following lines to your \`*AppDelegate.m\`:\\n *\\n * \`\`\`\\n * // iOS 9.x or newer\\n * #import <React/RCTLinkingManager.h>\\n *\\n * - (BOOL)application:(UIApplication *)application\\n *    openURL:(NSURL *)url\\n *    options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options\\n * \{\\n *   return [RCTLinkingManager application:app openURL:url options:options];\\n * }\\n * \`\`\`\\n * \\n * If you're targeting iOS 8.x or older, you can use the following code instead:\\n *\\n * \`\`\`\\n * // iOS 8.x or older\\n * #import <React/RCTLinkingManager.h>\\n *\\n * - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url\\n *   sourceApplication:(NSString *)sourceApplication annotation:(id)annotation\\n * \{\\n *   return [RCTLinkingManager application:application openURL:url\\n *                       sourceApplication:sourceApplication annotation:annotation];\\n * }\\n * \`\`\`\\n *\\n *\\n * // If your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html),\\n * you'll need to add the following code as well:\\n *\\n * \`\`\`\\n * - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity\\n *  restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler\\n * \{\\n *  return [RCTLinkingManager application:application\\n *                   continueUserActivity:userActivity\\n *                     restorationHandler:restorationHandler];\\n * }\\n * \`\`\`\\n *\\n * And then on your React component you'll be able to listen to the events on\\n * \`Linking\` as follows\\n *\\n * \`\`\`\\n * componentDidMount() \{\\n *   Linking.addEventListener('url', this._handleOpenURL);\\n * },\\n * componentWillUnmount() \{\\n *   Linking.removeEventListener('url', this._handleOpenURL);\\n * },\\n * _handleOpenURL(event) \{\\n *   console.log(event.url);\\n * }\\n * \`\`\`\\n * #### Opening external links\\n *\\n * To start the corresponding activity for a link (web URL, email, contact etc.), call\\n *\\n * \`\`\`\\n * Linking.openURL(url).catch(err => console.error('An error occurred', err));\\n * \`\`\`\\n *\\n * If you want to check if any installed app can handle a given URL beforehand you can call\\n * \`\`\`\\n * Linking.canOpenURL(url).then(supported => \{\\n *   if (!supported) \{\\n *     console.log('Can\\\\'t handle url: ' + url);\\n *   } else \{\\n *     return Linking.openURL(url);\\n *   }\\n * }).catch(err => console.error('An error occurred', err));\\n * \`\`\`\\n */\\n",
  "methods": [
    \{
      "line": 149,
      "source": "constructor() \{\\n    super(LinkingManager);\\n  }",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "constructor"
    },
    \{
      "line": 157,
      "source": "addEventListener(type: string, handler: Function) \{\\n    this.addListener(type, handler);\\n  }",
      "docblock": "/**\\n   * Add a handler to Linking changes by listening to the \`url\` event type\\n   * and providing the handler\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "addEventListener"
    },
    \{
      "line": 164,
      "source": "removeEventListener(type: string, handler: Function ) \{\\n    this.removeListener(type, handler);\\n  }",
      "docblock": "/**\\n   * Remove a handler by passing the \`url\` event type and the handler\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "type"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "removeEventListener"
    },
    \{
      "line": 184,
      "source": "openURL(url: string): Promise<any> \{\\n    this._validateURL(url);\\n    return LinkingManager.openURL(url);\\n  }",
      "docblock": "/**\\n   * Try to open the given \`url\` with any of the installed apps.\\n   *\\n   * You can use other URLs, like a location (e.g. \\"geo:37.484847,-122.148386\\" on Android\\n   * or \\"http://maps.apple.com/?ll=37.484847,-122.148386\\" on iOS), a contact,\\n   * or any other URL that can be opened with the installed apps.\\n   *\\n   * The method returns a \`Promise\` object. If the user confirms the open dialog or the\\n   * url automatically opens, the promise is resolved.  If the user cancels the open dialog\\n   * or there are no registered applications for the url, the promise is rejected.\\n   *\\n   * NOTE: This method will fail if the system doesn't know how to open the specified URL.\\n   * If you're passing in a non-http(s) URL, it's best to check \{@code canOpenURL} first.\\n   *\\n   * NOTE: For web URLs, the protocol (\\"http://\\", \\"https://\\") must be set accordingly!\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "url"
        }
      ],
      "tparams": null,
      "returntypehint": "Promise<any>",
      "name": "openURL"
    },
    \{
      "line": 199,
      "source": "canOpenURL(url: string): Promise<boolean> \{\\n    this._validateURL(url);\\n    return LinkingManager.canOpenURL(url);\\n  }",
      "docblock": "/**\\n   * Determine whether or not an installed app can handle a given URL.\\n   *\\n   * NOTE: For web URLs, the protocol (\\"http://\\", \\"https://\\") must be set accordingly!\\n   *\\n   * NOTE: As of iOS 9, your app needs to provide the \`LSApplicationQueriesSchemes\` key\\n   * inside \`Info.plist\` or canOpenURL will always return false.\\n   *\\n   * @param URL the URL to open\\n   */\\n",
      "modifiers": [],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "url"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}],\\"length\\":4}",
      "name": "canOpenURL"
    },
    \{
      "line": 210,
      "source": "getInitialURL(): Promise<?string> \{\\n    return LinkingManager.getInitialURL();\\n  }",
      "docblock": "/**\\n   * If the app launch was triggered by an app link,\\n   * it will give the link url, otherwise it will give \`null\`\\n   *\\n   * NOTE: To support deep linking on Android, refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents\\n   */\\n",
      "modifiers": [],
      "params": [],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"generic\\",\\"value\\":[\{\\"type\\":\\"simple\\",\\"value\\":\\"Promise\\",\\"length\\":1},\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":2,\\"nullable\\":true}],\\"length\\":5}",
      "name": "getInitialURL"
    }
  ],
  "superClass": "NativeEventEmitter",
  "type": "api",
  "line": 147,
  "requires": [
    \{
      "name": "NativeEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "Platform"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/Linking/Linking.js",
  "componentName": "Linking",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"linking","title":"Linking","layout":"autodocs","category":"APIs","permalink":"docs/linking.html","platform":"cross","next":"netinfo","previous":"layoutanimation","sidebar":true,"path":"Libraries/Linking/Linking.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;