/**
 * @jest-environment <rootDir>/packages/react-native/jest/react-native-env.js
 */
import testModuleExportString from 'react-native-env-test-module';

test('ReactNativeEnv is a node environment', () => {
  expect(testModuleExportString).toBe('node');
});
