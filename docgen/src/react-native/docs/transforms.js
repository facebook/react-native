/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "props": \{
    "transform": \{
      "type": \{
        "name": "arrayOf",
        "value": \{
          "name": "union",
          "value": [
            \{
              "name": "shape",
              "value": \{
                "perspective": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "rotate": \{
                  "name": "string",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "rotateX": \{
                  "name": "string",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "rotateY": \{
                  "name": "string",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "rotateZ": \{
                  "name": "string",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "scale": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "scaleX": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "scaleY": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "translateX": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "translateY": \{
                  "name": "number",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "skewX": \{
                  "name": "string",
                  "required": false
                }
              }
            },
            \{
              "name": "shape",
              "value": \{
                "skewY": \{
                  "name": "string",
                  "required": false
                }
              }
            }
          ]
        }
      },
      "required": false,
      "description": ""
    },
    "transformMatrix": \{
      "type": \{
        "name": "custom",
        "raw": "TransformMatrixPropType"
      },
      "required": false,
      "description": ""
    },
    "decomposedMatrix": \{
      "type": \{
        "name": "custom",
        "raw": "DecomposedMatrixPropType"
      },
      "required": false,
      "description": ""
    }
  },
  "type": "style",
  "filepath": "Libraries/StyleSheet/TransformPropTypes.js",
  "componentName": "Transforms",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"transforms","title":"Transforms","layout":"autodocs","category":"APIs","permalink":"docs/transforms.html","platform":"cross","next":"shadow-props","previous":"vibrationios","sidebar":false,"path":"Libraries/StyleSheet/TransformPropTypes.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;