/**
 * BezierEasing - use bezier curve for transition easing function
 * https://github.com/gre/bezier-easing
 *
 * @copyright 2014-2015 Gaëtan Renaudeau. MIT License.
 * @noflow
 */

/* eslint-disable */

'use strict';

jest.unmock('bezier');
var bezier = require('bezier');

var identity = function (x) { return x; };

function assertClose (a, b, precision = 3) {
  expect(a).toBeCloseTo(b, precision);
}

function makeAssertCloseWithPrecision (precision) {
  return function (a, b) {
    assertClose(a, b, precision);
  };
}

function allEquals (be1, be2, samples, assertion) {
  if (!assertion) assertion = assertClose;
  for (var i=0; i<=samples; ++i) {
    var x = i / samples;
    assertion(be1(x), be2(x));
  }
}

function repeat (n) {
  return function (f) {
    for (var i=0; i<n; ++i) f(i);
  };
}

describe('bezier', function(){
  it('should be a function', function(){
    expect(typeof bezier === 'function').toBe(true);
  });
  it('should creates an object', function(){
    expect(typeof bezier(0, 0, 1, 1) === 'function').toBe(true);
  });
  it('should fail with wrong arguments', function () {
    expect(function () { bezier(0.5, 0.5, -5, 0.5); }).toThrow();
    expect(function () { bezier(0.5, 0.5, 5, 0.5); }).toThrow();
    expect(function () { bezier(-2, 0.5, 0.5, 0.5); }).toThrow();
    expect(function () { bezier(2, 0.5, 0.5, 0.5); }).toThrow();
  });
  describe('linear curves', function () {
    it('should be linear', function () {
      allEquals(bezier(0, 0, 1, 1), bezier(1, 1, 0, 0), 100);
      allEquals(bezier(0, 0, 1, 1), identity, 100);
    });
  });
  describe('common properties', function () {
    it('should be the right value at extremes', function () {
      repeat(10)(function () {
        var a = Math.random(), b = 2*Math.random()-0.5, c = Math.random(), d = 2*Math.random()-0.5;
        var easing = bezier(a, b, c, d);
        expect(easing(0)).toBe(0);
        expect(easing(1)).toBe(1);
      });
    });

    it('should approach the projected value of its x=y projected curve', function () {
      repeat(10)(function () {
        var a = Math.random(), b = Math.random(), c = Math.random(), d = Math.random();
        var easing = bezier(a, b, c, d);
        var projected = bezier(b, a, d, c);
        var composed = function (x) { return projected(easing(x)); };
        allEquals(identity, composed, 100, makeAssertCloseWithPrecision(2));
      });
    });
  });
  describe('two same instances', function () {
    it('should be strictly equals', function () {
      repeat(10)(function () {
        var a = Math.random(), b = 2*Math.random()-0.5, c = Math.random(), d = 2*Math.random()-0.5;
        allEquals(bezier(a, b, c, d), bezier(a, b, c, d), 100, 0);
      });
    });
  });
  describe('symetric curves', function () {
    it('should have a central value y~=0.5 at x=0.5', function () {
      repeat(10)(function () {
        var a = Math.random(), b = 2*Math.random()-0.5, c = 1-a, d = 1-b;
        var easing = bezier(a, b, c, d);
        assertClose(easing(0.5), 0.5, 2);
      });
    });
    it('should be symetrical', function () {
      repeat(10)(function () {
        var a = Math.random(), b = 2*Math.random()-0.5, c = 1-a, d = 1-b;
        var easing = bezier(a, b, c, d);
        var sym = function (x) { return 1 - easing(1-x); };
        allEquals(easing, sym, 100, makeAssertCloseWithPrecision(2));
      });
    });
  });
});
