/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 83,
      "source": "requestAuthorization: function() \{\\n    RCTLocationObserver.requestAuthorization();\\n  }",
      "docblock": "/*\\n   * Request suitable Location permission based on the key configured on pList.\\n   * If NSLocationAlwaysUsageDescription is set, it will request Always authorization,\\n   * although if NSLocationWhenInUseUsageDescription is set, it will request InUse\\n   * authorization.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "requestAuthorization"
    },
    \{
      "line": 93,
      "source": "getCurrentPosition: async function(\\n    geo_success: Function,\\n    geo_error?: Function,\\n    geo_options?: GeoOptions\\n  ) \{\\n    invariant(\\n      typeof geo_success === 'function',\\n      'Must provide a valid geo_success callback.'\\n    );\\n    let hasPermission = true;\\n    // Supports Android's new permission model. For Android older devices,\\n    // it's always on.\\n    if (Platform.OS === 'android' && Platform.Version >= 23) \{\\n      hasPermission = await PermissionsAndroid.check(\\n        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,\\n      );\\n      if (!hasPermission) \{\\n        const status = await PermissionsAndroid.request(\\n          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,\\n        );\\n        hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;\\n      }\\n    }\\n    if (hasPermission) \{\\n      RCTLocationObserver.getCurrentPosition(\\n        geo_options || \{},\\n        geo_success,\\n        geo_error || logError,\\n      );\\n    }\\n  }",
      "docblock": "/*\\n   * Invokes the success callback once with the latest location info.  Supported\\n   * options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool)\\n   * On Android, if the location is cached this can return almost immediately,\\n   * or it will request an update which might take a while.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "geo_success"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "geo_error?"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"GeoOptions\\",\\"length\\":1}",
          "name": "geo_options?"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "getCurrentPosition"
    },
    \{
      "line": 129,
      "source": "watchPosition: function(success: Function, error?: Function, options?: GeoOptions): number \{\\n    if (!updatesEnabled) \{\\n      RCTLocationObserver.startObserving(options || \{});\\n      updatesEnabled = true;\\n    }\\n    var watchID = subscriptions.length;\\n    subscriptions.push([\\n      LocationEventEmitter.addListener(\\n        'geolocationDidChange',\\n        success\\n      ),\\n      error ? LocationEventEmitter.addListener(\\n        'geolocationError',\\n        error\\n      ) : null,\\n    ]);\\n    return watchID;\\n  }",
      "docblock": "/*\\n   * Invokes the success callback whenever the location changes.  Supported\\n   * options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool), distanceFilter(m)\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "success"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "error?"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"GeoOptions\\",\\"length\\":1}",
          "name": "options?"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "watchPosition"
    },
    \{
      "line": 148,
      "source": "clearWatch: function(watchID: number) \{\\n    var sub = subscriptions[watchID];\\n    if (!sub) \{\\n      // Silently exit when the watchID is invalid or already cleared\\n      // This is consistent with timers\\n      return;\\n    }\\n\\n    sub[0].remove();\\n    // array element refinements not yet enabled in Flow\\n    var sub1 = sub[1]; sub1 && sub1.remove();\\n    subscriptions[watchID] = undefined;\\n    var noWatchers = true;\\n    for (var ii = 0; ii < subscriptions.length; ii++) \{\\n      if (subscriptions[ii]) \{\\n        noWatchers = false; // still valid subscriptions\\n      }\\n    }\\n    if (noWatchers) \{\\n      Geolocation.stopObserving();\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "watchID"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "clearWatch"
    },
    \{
      "line": 171,
      "source": "stopObserving: function() \{\\n    if (updatesEnabled) \{\\n      RCTLocationObserver.stopObserving();\\n      updatesEnabled = false;\\n      for (var ii = 0; ii < subscriptions.length; ii++) \{\\n        var sub = subscriptions[ii];\\n        if (sub) \{\\n          warning(false, 'Called stopObserving with existing subscriptions.');\\n          sub[0].remove();\\n          // array element refinements not yet enabled in Flow\\n          var sub1 = sub[1]; sub1 && sub1.remove();\\n        }\\n      }\\n      subscriptions = [];\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "stopObserving"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 75,
  "name": "Geolocation",
  "docblock": "/**\\n * The Geolocation API extends the web spec:\\n * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation\\n *\\n * As a browser polyfill, this API is available through the \`navigator.geolocation\`\\n * global - you do not need to \`import\` it.\\n *\\n * ### Configuration and Permissions\\n *\\n * <div class=\\"banner-crna-ejected\\">\\n *   <h3>Projects with Native Code Only</h3>\\n *   <p>\\n *     This section only applies to projects made with <code>react-native init</code>\\n *     or to those made with Create React Native App which have since ejected. For\\n *     more information about ejecting, please see\\n *     the <a href=\\"https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md\\" target=\\"_blank\\">guide</a> on\\n *     the Create React Native App repository.\\n *   </p>\\n * </div>\\n *\\n * #### iOS\\n * You need to include the \`NSLocationWhenInUseUsageDescription\` key\\n * in Info.plist to enable geolocation when using the app. Geolocation is\\n * enabled by default when you create a project with \`react-native init\`.\\n *\\n * In order to enable geolocation in the background, you need to include the\\n * 'NSLocationAlwaysUsageDescription' key in Info.plist and add location as\\n * a background mode in the 'Capabilities' tab in Xcode.\\n *\\n * #### Android\\n * To request access to location, you need to add the following line to your\\n * app's \`AndroidManifest.xml\`:\\n *\\n * \`<uses-permission android:name=\\"android.permission.ACCESS_FINE_LOCATION\\" />\`\\n *\\n * Android API >= 18 Positions will also contain a \`mocked\` boolean to indicate if position\\n * was created from a mock provider.\\n *\\n */\\n",
  "requires": [
    \{
      "name": "NativeEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "fbjs/lib/invariant"
    },
    \{
      "name": "logError"
    },
    \{
      "name": "fbjs/lib/warning"
    },
    \{
      "name": "Platform"
    },
    \{
      "name": "PermissionsAndroid"
    }
  ],
  "filepath": "Libraries/Geolocation/Geolocation.js",
  "componentName": "Geolocation",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"geolocation","title":"Geolocation","layout":"autodocs","category":"APIs","permalink":"docs/geolocation.html","platform":"cross","next":"geolocation","previous":"dimensions","sidebar":true,"path":"Libraries/Geolocation/Geolocation.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;