/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The easing functions come from the the jQuery UI project.
 * See http://api.jqueryui.com/easings/
 * Copyright jQuery Foundation and other contributors, https://jquery.org/
 * Copyright (c) 2008 George McGinley Smith
 * Copyright (c) 2001 Robert Penner
 *
 * @providesModule AnimationUtils
 * @flow
 */
'use strict';

type EasingFunction = (t: number) => number;

var defaults = {
  easeInQuad: function(t) {
    return t * t;
  },
  easeOutQuad: function(t) {
    return -t * (t - 2);
  },
  easeInOutQuad: function(t) {
    t = t * 2;
    if (t < 1) {
      return 0.5 * t * t;
    }
    return -((t - 1) * (t - 3) - 1) / 2;
  },
  easeInCubic: function(t) {
    return t * t * t;
  },
  easeOutCubic: function(t) {
    t -= 1;
    return t * t * t + 1;
  },
  easeInOutCubic: function(t) {
    t *= 2;
    if (t < 1) {
      return 0.5 * t * t * t;
    }
    t -= 2;
    return (t * t * t + 2) / 2;
  },
  easeInQuart: function(t) {
    return t * t * t * t;
  },
  easeOutQuart: function(t) {
    t -= 1;
    return -(t * t * t * t - 1);
  },
  easeInOutQuart: function(t) {
    t *= 2;
    if (t < 1) {
      return 0.5 * t * t * t * t;
    }
    t -= 2;
    return -(t * t * t * t - 2) / 2;
  },
  easeInQuint: function(t) {
    return t * t * t * t * t;
  },
  easeOutQuint: function(t) {
    t -= 1;
    return t * t * t * t * t + 1;
  },
  easeInOutQuint: function(t) {
    t *= 2;
    if (t < 1) {
      return (t * t * t * t * t) / 2;
    }
    t -= 2;
    return (t * t * t * t * t + 2) / 2;
  },
  easeInSine: function(t) {
    return -Math.cos(t * (Math.PI / 2)) + 1;
  },
  easeOutSine: function(t) {
    return Math.sin(t * (Math.PI / 2));
  },
  easeInOutSine: function(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  },
  easeInExpo: function(t) {
    return (t === 0) ? 0 : Math.pow(2, 10 * (t - 1));
  },
  easeOutExpo: function(t) {
    return (t === 1) ? 1 : (-Math.pow(2, -10 * t) + 1);
  },
  easeInOutExpo: function(t) {
    if (t === 0) {
      return 0;
    }
    if (t === 1) {
      return 1;
    }
    t *= 2;
    if (t < 1) {
      return 0.5 * Math.pow(2, 10 * (t - 1));
    }
    return (-Math.pow(2, -10 * (t - 1)) + 2) / 2;
  },
  easeInCirc: function(t) {
    return -(Math.sqrt(1 - t * t) - 1);
  },
  easeOutCirc: function(t) {
    t -= 1;
    return Math.sqrt(1 - t * t);
  },
  easeInOutCirc: function(t) {
    t *= 2;
    if (t < 1) {
      return -(Math.sqrt(1 - t * t) - 1) / 2;
    }
    t -= 2;
    return (Math.sqrt(1 - t * t) + 1) / 2;
  },
  easeInElastic: function(t) {
    var s = 1.70158;
    var p = 0.3;
    if (t === 0) {
      return 0;
    }
    if (t === 1) {
      return 1;
    }
    var s = p / (2 * Math.PI) * Math.asin(1);
    t -= 1;
    return -(Math.pow(2, 10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
  },
  easeOutElastic: function(t) {
    var s = 1.70158;
    var p = 0.3;
    if (t === 0) {
      return 0;
    }
    if (t === 1) {
      return 1;
    }
    var s = p / (2 * Math.PI) * Math.asin(1);
    return Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) + 1;
  },
  easeInOutElastic: function(t) {
    var s = 1.70158;
    var p = 0.3 * 1.5;
    if (t === 0) {
      return 0;
    }
    t *= 2;
    if (t === 2) {
      return 1;
    }
    var s = p / (2 * Math.PI) * Math.asin(1);
    if (t < 1) {
      t -= 1;
      return -(Math.pow(2, 10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p)) / 2;
    }
    t -= 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) / 2 + 1;
  },
  easeInBack: function(t) {
    var s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  easeOutBack: function(t) {
    var s = 1.70158;
    t -= 1;
    return (t * t * ((s + 1) * t + s) + 1);
  },
  easeInOutBack: function(t) {
    var s = 1.70158 * 1.525;
    t *= 2;
    if (t < 1) {
      return (t * t * ((s + 1) * t - s)) / 2;
    }
    t -= 2;
    return (t * t * ((s + 1) * t + s) + 2) / 2;
  },
  easeInBounce: function(t) {
    return 1 - this.easeOutBounce(1 - t);
  },
  easeOutBounce: function(t) {
    if (t < (1 / 2.75)) {
      return 7.5625 * t * t;
    } else if (t < (2 / 2.75)) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < (2.5 / 2.75)) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  },
  easeInOutBounce: function(t) {
    if (t < 0.5) {
      return this.easeInBounce(t * 2) / 2;
    }
    return this.easeOutBounce(t * 2 - 1) / 2 + 0.5;
  },
};

var ticksPerSecond = 60;
var lastUsedTag = 0;

module.exports = {
  allocateTag: function(): number {
    return ++lastUsedTag;
  },

  evaluateEasingFunction: function(duration: number, easing: string | EasingFunction): Array<number> {
    if (typeof easing === 'string') {
      easing = defaults[easing] || defaults.easeOutQuad;
    }

    var tickCount = Math.round(duration * ticksPerSecond / 1000);
    var sample = [];
    for (var i = 0; i <= tickCount; i++) {
      sample.push(easing(i / tickCount));
    }

    return sample;
  },
};
