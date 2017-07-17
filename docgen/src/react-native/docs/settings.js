/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 24,
      "source": "get(key: string): mixed \{\\n    return this._settings[key];\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "key"
        }
      ],
      "tparams": null,
      "returntypehint": "mixed",
      "name": "get"
    },
    \{
      "line": 28,
      "source": "set(settings: Object) \{\\n    this._settings = Object.assign(this._settings, settings);\\n    RCTSettingsManager.setValues(settings);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "settings"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "set"
    },
    \{
      "line": 33,
      "source": "watchKeys(keys: string | Array<string>, callback: Function): number \{\\n    if (typeof keys === 'string') \{\\n      keys = [keys];\\n    }\\n\\n    invariant(\\n      Array.isArray(keys),\\n      'keys should be a string or array of strings'\\n    );\\n\\n    var sid = subscriptions.length;\\n    subscriptions.push(\{keys: keys, callback: callback});\\n    return sid;\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "string | Array<string>",
          "name": "keys"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "watchKeys"
    },
    \{
      "line": 48,
      "source": "clearWatch(watchId: number) \{\\n    if (watchId < subscriptions.length) \{\\n      subscriptions[watchId] = \{keys: [], callback: null};\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "watchId"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "clearWatch"
    }
  ],
  "properties": [
    \{
      "name": "_settings",
      "type": \{
        "name": "LogicalExpression"
      },
      "docblock": "",
      "source": "_settings: RCTSettingsManager && RCTSettingsManager.settings",
      "modifiers": [
        "static"
      ],
      "propertySource": "RCTSettingsManager && RCTSettingsManager.settings"
    }
  ],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 21,
  "name": "Settings",
  "docblock": "/**\\n */\\n",
  "requires": [
    \{
      "name": "RCTDeviceEventEmitter"
    },
    \{
      "name": "NativeModules"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/Settings/Settings.ios.js",
  "componentName": "Settings",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"settings","title":"Settings","layout":"autodocs","category":"APIs","permalink":"docs/settings.html","platform":"cross","next":"share","previous":"pushnotificationios","sidebar":true,"path":"Libraries/Settings/Settings.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;