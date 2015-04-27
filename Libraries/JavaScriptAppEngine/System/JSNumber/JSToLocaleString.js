/*
 * This is a third-party polyfill grabbed from:
 * https://github.com/TheIronDeveloper/NumberToLocaleStringPatch
 *
 * @providesModule JSToLocaleString
 * @nolint
 */
'use strict';

var self = {};

/* Author: Tyler Stark 
 * Name: Localized Numbers Patch
 * Purpose: Patch Legacy Browsers Usage of toLocaleString
 *
 *  @preserve-header
 **/
(function(){
  var tempNumber = Math.PI*1000000;
  //  German and French localized numbers do not equal each other.
  // If the following passes, it suggests that the locale parameter is being ignored.
  if(tempNumber.toLocaleString('de') === tempNumber.toLocaleString('fr')) {
      // Helper Function to assist with formatting numbers
      var formatNumber = function(number, delimiter, decimalDelimiter){
        var numberString = number.toString(), 
          splitNumber = numberString.split('.'),
          splitFloats = '';

        // Check if the number's precision is greater than the thousanths place.
        // If so, build out the tail end of the formatted Number.
        if(splitNumber[1] && splitNumber[1].length > 3) {         
          splitFloats = decimalDelimiter + number.toFixed(3).toString().split('.')[1];
        }

        return splitNumber[0].split( /(?=(?:\d{3})+$)/g ).join(delimiter) + splitFloats;
      };
      self.toLocaleString = function(){
        var localeMap = {
            en: {
              delimiter: ',',
              decimal: '.'
            },
            au: {
              delimiter: ',',
              decimal: '.'
            },
            gb: {
              delimiter: ',',
              decimal: '.'
            },
            fr: {
              delimiter: ' ',
              decimal: ','
            },
            de: {
              delimiter: '.',
              decimal: ','
            },
            at: {
              delimiter: ',',
              decimal: '.'
            },
            fi: {
              delimiter: ' ',
              decimal: ','
            },
            nl: {
              delimiter: '.',
              decimal: ','
            },
            es: {
              delimiter: '.',
              decimal: ','
            },
            da: {
              delimiter: '.',
              decimal: ','
            },
            el: {
              delimiter: '.',
              decimal: ','
            },
            et: {
              delimiter: ' ',
              decimal: ','
            },
            it: {
              delimiter: '.',
              decimal: ','
            },
            pl: {
              delimiter: ' ',
              decimal: ','
            },
            sv: {
              delimiter: ' ',
              decimal: ','
            },
            ru: {
              delimiter: ' ',
              decimal: ','
            },
            no: {
              delimiter: ',',
              decimal: '.'
            }
          },
          locale,
          navigatorLanguage,
          localeCharacters;

        navigatorLanguage = (navigator && navigator.language) || 'en';
        navigatorLanguage = navigatorLanguage.replace(/\-\w+$/g, '');
        locale = arguments[0] || navigatorLanguage;

        localeCharacters = localeMap[locale];

        if (localeCharacters) {
          return formatNumber(this, localeCharacters.delimiter, localeCharacters.decimal);
        }

        // Failsafe scenerio
        return this.valueOf();
      };
  }
})(); // Imediately Invoke

/** End of the third-party code */

module.exports = self.toLocaleString;
