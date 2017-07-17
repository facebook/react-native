/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 17,
      "source": "canRecordVideos: function(callback: Function) \{\\n    return RCTImagePicker.canRecordVideos(callback);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "canRecordVideos"
    },
    \{
      "line": 20,
      "source": "canUseCamera: function(callback: Function) \{\\n    return RCTImagePicker.canUseCamera(callback);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "callback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "canUseCamera"
    },
    \{
      "line": 23,
      "source": "openCameraDialog: function(config: Object, successCallback: Function, cancelCallback: Function) \{\\n    config = \{\\n      videoMode: false,\\n      ...config,\\n    };\\n    return RCTImagePicker.openCameraDialog(config, successCallback, cancelCallback);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "config"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "successCallback"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "cancelCallback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "openCameraDialog"
    },
    \{
      "line": 30,
      "source": "openSelectDialog: function(config: Object, successCallback: Function, cancelCallback: Function) \{\\n    config = \{\\n      showImages: true,\\n      showVideos: false,\\n      ...config,\\n    };\\n    return RCTImagePicker.openSelectDialog(config, successCallback, cancelCallback);\\n  }",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "Object",
          "name": "config"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "successCallback"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "cancelCallback"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "openSelectDialog"
    }
  ],
  "properties": [],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 16,
  "name": "ImagePickerIOS",
  "docblock": "/**\\n */\\n",
  "requires": [
    \{
      "name": "NativeModules"
    }
  ],
  "filepath": "Libraries/CameraRoll/ImagePickerIOS.js",
  "componentName": "ImagePickerIOS",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"imagepickerios","title":"ImagePickerIOS","layout":"autodocs","category":"APIs","permalink":"docs/imagepickerios.html","platform":"ios","next":"imagestore","previous":"imageeditor","sidebar":true,"path":"Libraries/CameraRoll/ImagePickerIOS.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;