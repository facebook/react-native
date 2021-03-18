import * as React from 'react';

import Button from '../Button';
import {expectRendersMatchingSnapshot} from '../../Utilities/ReactNativeTestTools';

describe('<Button />', () => {
  it('should render as expected', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});

describe('<Button />', () => {
  it('should be disabled when disabled={true}', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" disabled={true} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});

describe('<Button />', () => {
  it('should be disabled when disabled={true} and accessibilityState={{disabled: true}}', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" disabled={true} accessibilityState={{disabled: true}} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});

describe('<Button />', () => {
  it('should be disabled when disabled is empty and accessibilityState={{disabled: true}}', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" accessibilityState={{disabled: true}} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});



describe('<Button />', () => {
  it('should overwrite accessibilityState with value of disabled prop', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" disabled={true} accessibilityState={{disabled: false}} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});

describe('<Button />', () => {
  it('should not be disabled when disabled={false} and accessibilityState={{disabled: true}}', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" disabled={false} accessibilityState={{disabled: true}} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});

describe('<Button />', () => {
  it('should not be disabled when disabled={false} and accessibilityState={{disabled: false}}', () => {
    expectRendersMatchingSnapshot(
      'Button',
      () => (
        <Button title="Test Button" disabled={false} accessibilityState={{disabled: false}} />
      ),
      () => {
        jest.dontMock('../Button');
      },
    );
  });
});
