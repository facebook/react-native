/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      var result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject('error: incompatible types');
      }
    };
    reader.readAsDataURL(blob);
  });
}

const ContentSelector = (): React.Node => {
  const [base64Image, setBase64Image] = React.useState('');
  const imageSelector = React.useCallback(async () => {
    try {
      const NativeSampleTurboModule = require('react-native/Libraries/TurboModule/samples/NativeSampleTurboModule');
      const uri = await NativeSampleTurboModule.getImageUrl?.();
      if (uri != null) {
        console.log({uri});
        const response = await fetch(uri);
        const blob = await response.blob();
        setBase64Image(await blobToBase64(blob));
      }
    } catch (e) {
      ToastAndroid.show('' + e, ToastAndroid.LONG);
    }
  }, []);

  return (
    <>
      <TouchableOpacity onPress={imageSelector}>
        <View style={[styles.button, styles.buttonIntent]}>
          <RNTesterText>Select Image</RNTesterText>
        </View>
      </TouchableOpacity>
      {base64Image !== '' && (
        <Image style={styles.image} source={{uri: base64Image}} />
      )}
    </>
  );
};

class ContentURLAndroidExample extends React.Component<{}, {}> {
  render(): React.Node {
    return (
      <RNTesterPage title={'fetch content:// scheme urls on Android as a Blob'}>
        {Platform.OS === 'android' && (
          <RNTesterBlock title="Content fetch">
            <RNTesterText style={styles.textSeparator}>
              Choose content to fetch.
            </RNTesterText>
            <ContentSelector />
          </RNTesterBlock>
        )}
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  textSeparator: {
    paddingBottom: 8,
  },
  button: {
    padding: 10,
    backgroundColor: '#3B5998',
    marginBottom: 10,
  },
  buttonIntent: {
    backgroundColor: '#009688',
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    height: '300',
  },
});

exports.title = 'ContentURLAndroid';
exports.description = 'Android specific fetch content:// scheme urls as blob.';
exports.examples = [
  {
    title: 'fetch content:// urls as blob',
    render(): React.MixedElement {
      return <ContentURLAndroidExample />;
    },
  },
];
