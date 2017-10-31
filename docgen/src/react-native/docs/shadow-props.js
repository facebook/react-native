/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "shadowColor": \{
      "type": \{
        "name": "custom",
        "raw": "ColorPropType"
      },
      "required": false,
      "description": "Sets the drop shadow color\\n@platform ios"
    },
    "shadowOffset": \{
      "type": \{
        "name": "shape",
        "value": \{
          "width": \{
            "name": "number",
            "required": false
          },
          "height": \{
            "name": "number",
            "required": false
          }
        }
      },
      "required": false,
      "description": "Sets the drop shadow offset\\n@platform ios"
    },
    "shadowOpacity": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Sets the drop shadow opacity (multiplied by the color's alpha component)\\n@platform ios"
    },
    "shadowRadius": \{
      "type": \{
        "name": "number"
      },
      "required": false,
      "description": "Sets the drop shadow blur radius\\n@platform ios"
    }
  },
  "type": "style",
  "filepath": "Libraries/Components/View/ShadowPropTypesIOS.js",
  "componentName": "Shadow Props",
  "componentPlatform": "ios"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"shadow-props","title":"Shadow Props","layout":"autodocs","category":"APIs","permalink":"docs/shadow-props.html","platform":"ios","next":"shadow-props","previous":"layout-props","sidebar":true,"path":"Libraries/Components/View/ShadowPropTypesIOS.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;