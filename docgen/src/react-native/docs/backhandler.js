/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 73,
      "source": "exitApp: function() \{\\n    DeviceEventManager.invokeDefaultBackPressHandler();\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "exitApp"
    },
    \{
      "line": 77,
      "source": "addEventListener: function (\\n    eventName: BackPressEventName,\\n    handler: Function\\n  ): \{remove: () => void} \{\\n    _backPressSubscriptions.add(handler);\\n    return \{\\n      remove: () => BackHandler.removeEventListener(eventName, handler),\\n    };\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"BackPressEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "\{remove: () => void}",
      "name": "addEventListener"
    },
    \{
      "line": 87,
      "source": "removeEventListener: function(\\n    eventName: BackPressEventName,\\n    handler: Function\\n  ): void \{\\n    _backPressSubscriptions.delete(handler);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"BackPressEventName\\",\\"length\\":1}",
          "name": "eventName"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "handler"
        }
      ],
      "tparams": null,
      "returntypehint": "void",
      "name": "removeEventListener"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 71,
  "name": "BackHandler",
  "docblock": "/**\\n * Detect hardware button presses for back navigation.\\n *\\n * Android: Detect hardware back button presses, and programmatically invoke the default back button\\n * functionality to exit the app if there are no listeners or if none of the listeners return true.\\n *\\n * tvOS: Detect presses of the menu button on the TV remote.  (Still to be implemented:\\n * programmatically disable menu button handling\\n * functionality to exit the app if there are no listeners or if none of the listeners return true.)\\n *\\n * iOS: Not applicable.\\n *\\n * The event subscriptions are called in reverse order (i.e. last registered subscription first),\\n * and if one subscription returns true then subscriptions registered earlier will not be called.\\n *\\n * Example:\\n *\\n * \`\`\`javascript\\n * BackHandler.addEventListener('hardwareBackPress', function() \{\\n *  // this.onMainScreen and this.goBack are just examples, you need to use your own implementation here\\n *  // Typically you would use the navigator here to go to the last state.\\n *\\n *  if (!this.onMainScreen()) \{\\n *    this.goBack();\\n *    return true;\\n *  }\\n *  return false;\\n * });\\n * \`\`\`\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    },
    \{
      "name": "RCTDeviceEventEmitter"
    }
  ],
  "filepath": "Libraries/Utilities/BackHandler.android.js",
  "componentName": "BackHandler",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"backhandler","title":"BackHandler","layout":"autodocs","category":"APIs","permalink":"docs/backhandler.html","platform":"cross","next":"cameraroll","previous":"backhandler","sidebar":true,"path":"Libraries/Utilities/BackHandler.android.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;