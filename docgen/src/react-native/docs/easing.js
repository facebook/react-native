/**
 * @generated
 */
var React = require("React");
var Layout = require("AutodocsLayout");
var content = `\{
  "name": "Easing",
  "docblock": "/**\\n * The \`Easing\` module implements common easing functions. This module is used\\n * by [Animate.timing()](docs/animate.html#timing) to convey physically\\n * believable motion in animations.\\n *\\n * You can find a visualization of some common easing functions at\\n * http://easings.net/\\n *\\n * ### Predefined animations\\n *\\n * The \`Easing\` module provides several predefined animations through the\\n * following methods:\\n *\\n * - [\`back\`](docs/easing.html#back) provides a simple animation where the\\n *   object goes slightly back before moving forward\\n * - [\`bounce\`](docs/easing.html#bounce) provides a bouncing animation\\n * - [\`ease\`](docs/easing.html#ease) provides a simple inertial animation\\n * - [\`elastic\`](docs/easing.html#elastic) provides a simple spring interaction\\n *\\n * ### Standard functions\\n *\\n * Three standard easing functions are provided:\\n *\\n * - [\`linear\`](docs/easing.html#linear)\\n * - [\`quad\`](docs/easing.html#quad)\\n * - [\`cubic\`](docs/easing.html#cubic)\\n *\\n * The [\`poly\`](docs/easing.html#poly) function can be used to implement\\n * quartic, quintic, and other higher power functions.\\n *\\n * ### Additional functions\\n *\\n * Additional mathematical functions are provided by the following methods:\\n *\\n * - [\`bezier\`](docs/easing.html#bezier) provides a cubic bezier curve\\n * - [\`circle\`](docs/easing.html#circle) provides a circular function\\n * - [\`sin\`](docs/easing.html#sin) provides a sinusoidal function\\n * - [\`exp\`](docs/easing.html#exp) provides an exponential function\\n *\\n * The following helpers are used to modify other easing functions.\\n *\\n * - [\`in\`](docs/easing.html#in) runs an easing function forwards\\n * - [\`inOut\`](docs/easing.html#inout) makes any easing function symmetrical\\n * - [\`out\`](docs/easing.html#out) runs an easing function backwards\\n */\\n",
  "methods": [
    \{
      "line": 65,
      "source": "static step0(n) \{\\n    return n > 0 ? 1 : 0;\\n  }",
      "docblock": "/**\\n   * A stepping function, returns 1 for any positive value of \`n\`.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "n"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "step0"
    },
    \{
      "line": 72,
      "source": "static step1(n) \{\\n    return n >= 1 ? 1 : 0;\\n  }",
      "docblock": "/**\\n   * A stepping function, returns 1 if \`n\` is greater than or equal to 1.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "n"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "step1"
    },
    \{
      "line": 82,
      "source": "static linear(t) \{\\n    return t;\\n  }",
      "docblock": "/**\\n   * A linear function, \`f(t) = t\`. Position correlates to elapsed time one to\\n   * one.\\n   *\\n   * http://cubic-bezier.com/#0,0,1,1\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "linear"
    },
    \{
      "line": 92,
      "source": "static ease(t: number): number \{\\n    if (!ease) \{\\n      ease = Easing.bezier(0.42, 0, 1, 1);\\n    }\\n    return ease(t);\\n  }",
      "docblock": "/**\\n   * A simple inertial interaction, similar to an object slowly accelerating to\\n   * speed.\\n   *\\n   * http://cubic-bezier.com/#.42,0,1,1\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "ease"
    },
    \{
      "line": 105,
      "source": "static quad(t) \{\\n    return t * t;\\n  }",
      "docblock": "/**\\n   * A quadratic function, \`f(t) = t * t\`. Position equals the square of elapsed\\n   * time.\\n   *\\n   * http://easings.net/#easeInQuad\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "quad"
    },
    \{
      "line": 115,
      "source": "static cubic(t) \{\\n    return t * t * t;\\n  }",
      "docblock": "/**\\n   * A cubic function, \`f(t) = t * t * t\`. Position equals the cube of elapsed\\n   * time.\\n   *\\n   * http://easings.net/#easeInCubic\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "cubic"
    },
    \{
      "line": 125,
      "source": "static poly(n) \{\\n    return (t) => Math.pow(t, n);\\n  }",
      "docblock": "/**\\n   * A power function. Position is equal to the Nth power of elapsed time.\\n   *\\n   * n = 4: http://easings.net/#easeInQuart\\n   * n = 5: http://easings.net/#easeInQuint\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "n"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "poly"
    },
    \{
      "line": 134,
      "source": "static sin(t) \{\\n    return 1 - Math.cos(t * Math.PI / 2);\\n  }",
      "docblock": "/**\\n   * A sinusoidal function.\\n   *\\n   * http://easings.net/#easeInSine\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "sin"
    },
    \{
      "line": 143,
      "source": "static circle(t) \{\\n    return 1 - Math.sqrt(1 - t * t);\\n  }",
      "docblock": "/**\\n   * A circular function.\\n   *\\n   * http://easings.net/#easeInCirc\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "circle"
    },
    \{
      "line": 152,
      "source": "static exp(t) \{\\n    return Math.pow(2, 10 * (t - 1));\\n  }",
      "docblock": "/**\\n   * An exponential function.\\n   *\\n   * http://easings.net/#easeInExpo\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": null,
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": null,
      "name": "exp"
    },
    \{
      "line": 171,
      "source": "static elastic(bounciness: number = 1): (t: number) => number \{\\n    const p = bounciness * Math.PI;\\n    return (t) => 1 - Math.pow(Math.cos(t * Math.PI / 2), 3) * Math.cos(t * p);\\n  }",
      "docblock": "/**\\n   * A simple elastic interaction, similar to a spring oscillating back and\\n   * forth.\\n   *\\n   * Default bounciness is 1, which overshoots a little bit once. 0 bounciness\\n   * doesn't overshoot at all, and bounciness of N > 1 will overshoot about N\\n   * times.\\n   *\\n   * http://easings.net/#easeInElastic\\n   *\\n   * Wolfram Plots:\\n   *\\n   * - http://tiny.cc/elastic_b_1 (bounciness = 1, default)\\n   * - http://tiny.cc/elastic_b_3 (bounciness = 3)\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "bounciness"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "elastic"
    },
    \{
      "line": 184,
      "source": "static back(s: number): (t: number) => number \{\\n    if (s === undefined) \{\\n      s = 1.70158;\\n    }\\n    return (t) => t * t * ((s + 1) * t - s);\\n  }",
      "docblock": "/**\\n   * Use with \`Animated.parallel()\` to create a simple effect where the object\\n   * animates back slightly as the animation starts.\\n   *\\n   * Wolfram Plot:\\n   *\\n   * - http://tiny.cc/back_default (s = 1.70158, default)\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "s"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "back"
    },
    \{
      "line": 196,
      "source": "static bounce(t: number): number \{\\n    if (t < 1 / 2.75) \{\\n      return 7.5625 * t * t;\\n    }\\n\\n    if (t < 2 / 2.75) \{\\n      t -= 1.5 / 2.75;\\n      return 7.5625 * t * t + 0.75;\\n    }\\n\\n    if (t < 2.5 / 2.75) \{\\n      t -= 2.25 / 2.75;\\n      return 7.5625 * t * t + 0.9375;\\n    }\\n\\n    t -= 2.625 / 2.75;\\n    return 7.5625 * t * t + 0.984375;\\n  }",
      "docblock": "/**\\n   * Provides a simple bouncing effect.\\n   *\\n   * http://easings.net/#easeInBounce\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "t"
        }
      ],
      "tparams": null,
      "returntypehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
      "name": "bounce"
    },
    \{
      "line": 222,
      "source": "static bezier(\\n    x1: number,\\n    y1: number,\\n    x2: number,\\n    y2: number\\n  ): (t: number) => number \{\\n    const _bezier = require\('bezier');\\n    return _bezier(x1, y1, x2, y2);\\n  }",
      "docblock": "/**\\n   * Provides a cubic bezier curve, equivalent to CSS Transitions'\\n   * \`transition-timing-function\`.\\n   *\\n   * A useful tool to visualize cubic bezier curves can be found at\\n   * http://cubic-bezier.com/\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "x1"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "y1"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "x2"
        },
        \{
          "typehint": "\{\\"type\\":\\"simple\\",\\"value\\":\\"number\\",\\"length\\":1}",
          "name": "y2"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "bezier"
    },
    \{
      "line": 235,
      "source": "static in(\\n    easing: (t: number) => number,\\n  ): (t: number) => number \{\\n    return easing;\\n  }",
      "docblock": "/**\\n   * Runs an easing function forwards.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "(t: number) => number",
          "name": "easing"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "in"
    },
    \{
      "line": 244,
      "source": "static out(\\n    easing: (t: number) => number,\\n  ): (t: number) => number \{\\n    return (t) => 1 - easing(1 - t);\\n  }",
      "docblock": "/**\\n   * Runs an easing function backwards.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "(t: number) => number",
          "name": "easing"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "out"
    },
    \{
      "line": 255,
      "source": "static inOut(\\n    easing: (t: number) => number,\\n  ): (t: number) => number \{\\n    return (t) => \{\\n      if (t < 0.5) \{\\n        return easing(t * 2) / 2;\\n      }\\n      return 1 - easing((1 - t) * 2) / 2;\\n    };\\n  }",
      "docblock": "/**\\n   * Makes any easing function symmetrical. The easing function will run\\n   * forwards for half of the duration, then backwards for the rest of the\\n   * duration.\\n   */\\n",
      "modifiers": [
        "static"
      ],
      "params": [
        \{
          "typehint": "(t: number) => number",
          "name": "easing"
        }
      ],
      "tparams": null,
      "returntypehint": "(t: number) => number",
      "name": "inOut"
    }
  ],
  "type": "api",
  "line": 61,
  "requires": [],
  "filepath": "Libraries/Animated/src/Easing.js",
  "componentName": "Easing",
  "componentPlatform": "cross"
}`;
var Page = React.createClass({
  statics: { content: content },
  render: function() {
    return (
      <Layout metadata={{"id":"easing","title":"Easing","layout":"autodocs","category":"APIs","permalink":"docs/easing.html","platform":"cross","next":"geolocation","previous":"dimensions","sidebar":true,"path":"Libraries/Animated/src/Easing.js","filename":null}}>
        {content}
      </Layout>
    );
  }
});
module.exports = Page;