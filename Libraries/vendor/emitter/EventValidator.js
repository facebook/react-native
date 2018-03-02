/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule EventValidator
 * @flow
 */
'use strict';

/**
 * EventValidator is designed to validate event types to make it easier to catch
 * common mistakes. It accepts a map of all of the different types of events
 * that the emitter can emit. Then, if a user attempts to emit an event that is
 * not one of those specified types the emitter will throw an error. Also, it
 * provides a relatively simple matcher so that if it thinks that you likely
 * mistyped the event name it will suggest what you might have meant to type in
 * the error message.
 */
const EventValidator = {
  /**
   * @param {Object} emitter - The object responsible for emitting the actual
   *                             events
   * @param {Object} types - The collection of valid types that will be used to
   *                         check for errors
   * @return {Object} A new emitter with event type validation
   * @example
   *   const types = {someEvent: true, anotherEvent: true};
   *   const emitter = EventValidator.addValidation(emitter, types);
   */
  addValidation: function(emitter: Object, types: Object) {
    const eventTypes = Object.keys(types);
    const emitterWithValidation = Object.create(emitter);

    Object.assign(emitterWithValidation, {
      emit: function emit(type, a, b, c, d, e, _) {
        assertAllowsEventType(type, eventTypes);
        return emitter.emit.call(this, type, a, b, c, d, e, _);
      }
    });

    return emitterWithValidation;
  }
};

function assertAllowsEventType(type, allowedTypes) {
  if (allowedTypes.indexOf(type) === -1) {
    throw new TypeError(errorMessageFor(type, allowedTypes));
  }
}

function errorMessageFor(type, allowedTypes) {
  let message = 'Unknown event type "' + type + '". ';
  if (__DEV__) {
    message += recommendationFor(type, allowedTypes);
  }
  message += 'Known event types: ' + allowedTypes.join(', ') + '.';
  return message;
}

// Allow for good error messages
if (__DEV__) {
  var recommendationFor = function (type, allowedTypes) {
    const closestTypeRecommendation = closestTypeFor(type, allowedTypes);
    if (isCloseEnough(closestTypeRecommendation, type)) {
      return 'Did you mean "' + closestTypeRecommendation.type + '"? ';
    } else {
      return '';
    }
  };

  var closestTypeFor = function (type, allowedTypes) {
    const typeRecommendations = allowedTypes.map(
      typeRecommendationFor.bind(this, type)
    );
    return typeRecommendations.sort(recommendationSort)[0];
  };

  var typeRecommendationFor = function (type, recommendedType) {
    return {
      type: recommendedType,
      distance: damerauLevenshteinDistance(type, recommendedType)
    };
  };

  var recommendationSort = function (recommendationA, recommendationB) {
    if (recommendationA.distance < recommendationB.distance) {
      return -1;
    } else if (recommendationA.distance > recommendationB.distance) {
      return 1;
    } else {
      return 0;
    }
  };

  var isCloseEnough = function (closestType, actualType) {
    return (closestType.distance / actualType.length) < 0.334;
  };

  var damerauLevenshteinDistance = function (a, b) {
    let i, j;
    const d = [];

    for (i = 0; i <= a.length; i++) {
      d[i] = [i];
    }

    for (j = 1; j <= b.length; j++) {
      d[0][j] = j;
    }

    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;

        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );

        if (i > 1 && j > 1 &&
            a.charAt(i - 1) === b.charAt(j - 2) &&
            a.charAt(i - 2) === b.charAt(j - 1)) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
        }
      }
    }

    return d[a.length][b.length];
  };
}

module.exports = EventValidator;
