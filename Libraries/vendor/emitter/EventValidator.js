/**
 * @generated SignedSource<<7149bdac6fb48595f245ad6e76938e44>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * @providesModule EventValidator
 */
'use strict';

var copyProperties = require('copyProperties');

/**
 * EventValidator is designed to validate event types to make it easier to catch
 * common mistakes. It accepts a map of all of the different types of events
 * that the emitter can emit. Then, if a user attempts to emit an event that is
 * not one of those specified types the emitter will throw an error. Also, it
 * provides a relatively simple matcher so that if it thinks that you likely
 * mistyped the event name it will suggest what you might have meant to type in
 * the error message.
 */
var EventValidator = {
  /**
   * @param {Object} emitter - The object responsible for emitting the actual
   *                             events
   * @param {Object} types - The collection of valid types that will be used to
   *                         check for errors
   * @return {Object} A new emitter with event type validation
   * @example
   *   var types = {someEvent: true, anotherEvent: true};
   *   var emitter = EventValidator.addValidation(emitter, types);
   */
  addValidation: function(emitter: Object, types: Object) {
    var eventTypes = Object.keys(types);
    var emitterWithValidation = Object.create(emitter);

    copyProperties(emitterWithValidation, {
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
  var message = 'Unknown event type "' + type + '". ';
  if (__DEV__) {
    message += recommendationFor(type, allowedTypes);
  }
  message += 'Known event types: ' + allowedTypes.join(', ') + '.';
  return message;
}

// Allow for good error messages
if (__DEV__) {
  var recommendationFor = function (type, allowedTypes) {
    var closestTypeRecommendation = closestTypeFor(type, allowedTypes);
    if (isCloseEnough(closestTypeRecommendation, type)) {
      return 'Did you mean "' + closestTypeRecommendation.type + '"? ';
    } else {
      return '';
    }
  };

  var closestTypeFor = function (type, allowedTypes) {
    var typeRecommendations = allowedTypes.map(
      typeRecommendationFor.bind(this, type)
    );
    return typeRecommendations.sort(recommendationSort)[0];
  };

  var typeRecommendationFor = function (type, recomendedType) {
    return {
      type: recomendedType,
      distance: damerauLevenshteinDistance(type, recomendedType)
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
    var i, j;
    var d = [];

    for (i = 0; i <= a.length; i++) {
      d[i] = [i];
    }

    for (j = 1; j <= b.length; j++) {
      d[0][j] = j;
    }

    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;

        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        );

        if (i > 1 && j > 1 &&
            a.charAt(i - 1) == b.charAt(j - 2) &&
            a.charAt(i - 2) == b.charAt(j - 1)) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
        }
      }
    }

    return d[a.length][b.length];
  };
}

module.exports = EventValidator;
