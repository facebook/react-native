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

import * as React from 'react';

import {PermissionsAndroid, StyleSheet, Text, View} from 'react-native';
import RNTOption from '../../components/RNTOption';
import RNTesterButton from '../../components/RNTesterButton';

function PermissionsExample() {
  const [permission, setPermission] = React.useState(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  const [hasPermission, setHasPermission] = React.useState('Not Checked');

  const requestPermission = async () => {
    let result;
    try {
      result = await PermissionsAndroid.request(permission, {
        title: 'Permission Explanation',
        message:
          'The app needs the following permission ' +
          permission +
          ' because of reasons. Please approve.',
      });
      setHasPermission(result + ' for ' + permission);
    } catch (e) {
      throw e;
    }
  };

  const checkPermission = async () => {
    let result;
    try {
      result = await PermissionsAndroid.check(permission);
    } catch (e) {
      throw e;
    }
    setHasPermission(`${result ? 'Granted' : 'Revoked'} for ${permission}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <Text style={styles.title}>Select Permission</Text>
        <View style={styles.row}>
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.CAMERA}
            key={PermissionsAndroid.PERMISSIONS.CAMERA}
            onPress={() => setPermission(PermissionsAndroid.PERMISSIONS.CAMERA)}
            selected={permission === PermissionsAndroid.PERMISSIONS.CAMERA}
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.READ_CALENDAR}
            key={PermissionsAndroid.PERMISSIONS.READ_CALENDAR}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.READ_CALENDAR)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.READ_CALENDAR
            }
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION}
            key={PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            }
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION}
            key={PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION
            }
            style={styles.option}
          />
        </View>
      </View>
      <RNTesterButton onPress={checkPermission}>
        <View>
          <Text style={[styles.touchable, styles.text]}>Check Permission</Text>
        </View>
      </RNTesterButton>
      <RNTesterButton onPress={requestPermission}>
        <View>
          <Text style={[styles.touchable, styles.text]}>
            Request Permission
          </Text>
        </View>
      </RNTesterButton>
      <Text style={styles.text}>Permission Status: {hasPermission}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  block: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
  },
  touchable: {
    color: '#007AFF',
  },
  option: {
    margin: 6,
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = 'PermissionsAndroid';
exports.category = 'Android';
exports.description = 'Permissions example for API 23+.';
exports.examples = [
  {
    title: 'Permissions Example',
    description:
      'Short example of how to use the runtime permissions API introduced in Android M.',
    render: (): React.Node => <PermissionsExample />,
  },
];
