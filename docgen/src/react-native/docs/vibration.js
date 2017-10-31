/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 77,
      "source": "vibrate: function(pattern: number | Array<number> = 400, repeat: boolean = false) \{\\n    if (Platform.OS === 'android') \{\\n      if (typeof pattern === 'number') \{\\n        RCTVibration.vibrate(pattern);\\n      } else if (Array.isArray(pattern)) \{\\n        RCTVibration.vibrateByPattern(pattern, repeat ? 0 : -1);\\n      } else \{\\n        throw new Error('Vibration pattern should be a number or array');\\n      }\\n    } else \{\\n      if (_vibrating) \{\\n        return;\\n      }\\n      if (typeof pattern === 'number') \{\\n        RCTVibration.vibrate();\\n      } else if (Array.isArray(pattern)) \{\\n        vibrateByPattern(pattern, repeat);\\n      } else \{\\n        throw new Error('Vibration pattern should be a number or array');\\n      }\\n    }\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "number | Array<number>",
          "name": "pattern"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"boolean\\",\\"length\\":1}",
          "name": "repeat"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "vibrate"
    },
    \{
      "line": 102,
      "source": "cancel: function() \{\\n    if (Platform.OS === 'ios') \{\\n      _vibrating = false;\\n    } else \{\\n      RCTVibration.cancel();\\n    }\\n  }",
      "docblock": "/**\\n   * Stop vibration\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "cancel"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 76,
  "name": "Vibration",
  "docblock": "/**\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    },
    \{
      "name": "Platform"
    }
  ],
  "filepath": "Libraries/Vibration/Vibration.js",
  "componentName": "Vibration",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"vibration","title":"Vibration","layout":"autodocs","category":"APIs","permalink":"docs/vibration.html","platform":"cross","next":"vibration","previous":"timepickerandroid","sidebar":true,"path":"Libraries/Vibration/Vibration.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;