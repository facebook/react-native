/**
 * @format
 */

import 'react-native';
import React from 'react';
import {it} from '@jest/globals';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
