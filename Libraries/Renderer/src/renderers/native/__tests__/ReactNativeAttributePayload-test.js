jest.disableAutomock();

const ReactNativeAttributePayload = require('ReactNativeAttributePayload');
const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const StyleSheet = require('StyleSheet');

describe('ReactNativeAttributePayload', () => {

  describe('create', () => {
    it('works with custom style processors', () => {
      StyleSheet.setStyleAttributePreprocessor('fontFamily', (nextValue) => 'Wingdings');

      const updatePayload = ReactNativeAttributePayload.create(
        {style: {fontFamily: 'Comic Sans'}},
        {style: ReactNativeStyleAttributes},
      );

      expect(updatePayload.fontFamily).toEqual('Wingdings');
    });
  });

});
