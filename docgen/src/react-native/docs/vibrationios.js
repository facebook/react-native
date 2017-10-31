/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 35,
      "source": "vibrate: function() \{\\n    invariant(\\n      arguments[0] === undefined,\\n      'Vibration patterns not supported.'\\n    );\\n    RCTVibration.vibrate();\\n  }",
      "docblock": "/**\\n   * @deprecated\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [],
      "tparams": null,
      "returntypehint": null,
      "name": "vibrate"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 31,
  "name": "VibrationIOS",
  "docblock": "/**\\n * NOTE: \`VibrationIOS\` is being deprecated. Use \`Vibration\` instead.\\n *\\n * The Vibration API is exposed at \`VibrationIOS.vibrate()\`. On iOS, calling this\\n * function will trigger a one second vibration. The vibration is asynchronous\\n * so this method will return immediately.\\n *\\n * There will be no effect on devices that do not support Vibration, eg. the iOS\\n * simulator.\\n *\\n * Vibration patterns are currently unsupported.\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    },
    \{
      "name": "fbjs/lib/invariant"
    }
  ],
  "filepath": "Libraries/Vibration/VibrationIOS.ios.js",
  "componentName": "VibrationIOS",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"vibrationios","title":"VibrationIOS","layout":"autodocs","category":"APIs","permalink":"docs/vibrationios.html","platform":"ios","next":"vibrationios","previous":"toastandroid","sidebar":true,"path":"Libraries/Vibration/VibrationIOS.ios.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;