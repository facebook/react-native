/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "methods": [
    \{
      "line": 152,
      "source": "function configureNext(config: Config, onAnimationDidEnd?: Function) \{\\n  if (__DEV__) \{\\n    checkConfig(config, 'config', 'LayoutAnimation.configureNext');\\n  }\\n  UIManager.configureNextLayoutAnimation(\\n    config,\\n    onAnimationDidEnd || function() \{},\\n    function() \{\\n      /* unused */\\n    },\\n  );\\n}",
      "docblock": "/**\\n   * Schedules an animation to happen on the next layout.\\n   *\\n   * @param config Specifies animation properties:\\n   *\\n   *   - \`duration\` in milliseconds\\n   *   - \`create\`, config for animating in new views (see \`Anim\` type)\\n   *   - \`update\`, config for animating views that have been updated\\n   * (see \`Anim\` type)\\n   *\\n   * @param onAnimationDidEnd Called when the animation finished.\\n   * Only supported on iOS.\\n   * @param onError Called on error. Only supported on iOS.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Config\\",\\"length\\":1}",
          "name": "config"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Function\\",\\"length\\":1}",
          "name": "onAnimationDidEnd?"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "configureNext"
    },
    \{
      "line": 156,
      "source": "function create(duration: number, type, creationProp): Config \{\\n  return \{\\n    duration,\\n    create: \{\\n      type,\\n      property: creationProp,\\n    },\\n    update: \{\\n      type,\\n    },\\n    delete: \{\\n      type,\\n      property: creationProp,\\n    },\\n  };\\n}",
      "docblock": "/**\\n   * Helper for creating a config for \`configureNext\`.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "duration"
        },
        \{
          "typehint": null,
          "name": "type"
        },
        \{
          "typehint": null,
          "name": "creationProp"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Config\\",\\"length\\":1}",
      "name": "create"
    },
    \{
      "line": 159,
      "source": "function checkConfig(config: Config, location: string, name: string) \{\\n  checkPropTypes(\{config: configType}, \{config}, location, name);\\n}",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"Config\\",\\"length\\":1}",
          "name": "config"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "location"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"string\\",\\"length\\":1}",
          "name": "name"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "checkConfig"
    }
  ],
  "properties": [
    \{
      "name": "Types",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "Types",
      "modifiers": [
        "static"
      ],
      "propertySource": "keyMirror(TypesEnum)"
    },
    \{
      "name": "Properties",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "Properties",
      "modifiers": [
        "static"
      ],
      "propertySource": "keyMirror(PropertiesEnum)"
    },
    \{
      "name": "Presets",
      "type": \{
        "name": "ObjectExpression"
      },
      "docblock": "",
      "source": "Presets",
      "modifiers": [
        "static"
      ],
      "propertySource": "\{\\n  easeInEaseOut: create(300, Types.easeInEaseOut, Properties.opacity),\\n  linear: create(500, Types.linear, Properties.opacity),\\n  spring: \{\\n    duration: 700,\\n    create: \{\\n      type: Types.linear,\\n      property: Properties.opacity,\\n    },\\n    update: \{\\n      type: Types.spring,\\n      springDamping: 0.4,\\n    },\\n    delete: \{\\n      type: Types.linear,\\n      property: Properties.opacity,\\n    },\\n  },\\n}"
    },
    \{
      "name": "easeInEaseOut",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "easeInEaseOut: configureNext.bind(null, Presets.easeInEaseOut)",
      "modifiers": [
        "static"
      ],
      "propertySource": "configureNext.bind(null, Presets.easeInEaseOut)"
    },
    \{
      "name": "linear",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "linear: configureNext.bind(null, Presets.linear)",
      "modifiers": [
        "static"
      ],
      "propertySource": "configureNext.bind(null, Presets.linear)"
    },
    \{
      "name": "spring",
      "type": \{
        "name": "CallExpression"
      },
      "docblock": "",
      "source": "spring: configureNext.bind(null, Presets.spring)",
      "modifiers": [
        "static"
      ],
      "propertySource": "configureNext.bind(null, Presets.spring)"
    }
  ],
  "classes": [],
  "superClass": null,
  "type": "api",
  "line": 137,
  "name": "LayoutAnimation",
  "docblock": "/**\\n * Automatically animates views to their new positions when the\\n * next layout happens.\\n *\\n * A common way to use this API is to call it before calling \`setState\`.\\n *\\n * Note that in order to get this to work on **Android** you need to set the following flags via \`UIManager\`:\\n *\\n *     UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);\\n */\\n",
  "requires": [
    \{
      "name": "prop-types"
    },
    \{
      "name": "UIManager"
    },
    \{
      "name": "fbjs/lib/keyMirror"
    }
  ],
  "filepath": "Libraries/LayoutAnimation/LayoutAnimation.js",
  "componentName": "LayoutAnimation",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"layoutanimation","title":"LayoutAnimation","layout":"autodocs","category":"APIs","permalink":"docs/layoutanimation.html","platform":"cross","next":"linking","previous":"keyboard","sidebar":true,"path":"Libraries/LayoutAnimation/LayoutAnimation.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;