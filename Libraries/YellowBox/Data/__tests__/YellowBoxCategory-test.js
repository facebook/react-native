/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow strict-local
 */

'use strict';

const YellowBoxCategory = require('../YellowBoxCategory');

describe('YellowBoxCategory', () => {
  it('parses strings', () => {
    expect(YellowBoxCategory.parse(['A'])).toEqual({
      category: 'A',
      message: {
        content: 'A',
        substitutions: [],
      },
    });
  });

  it('parses strings with arguments', () => {
    expect(YellowBoxCategory.parse(['A', 'B', 'C'])).toEqual({
      category: 'A "B" "C"',
      message: {
        content: 'A "B" "C"',
        substitutions: [],
      },
    });
  });

  it('parses formatted strings', () => {
    expect(YellowBoxCategory.parse(['%s', 'A'])).toEqual({
      category: '\ufeff%s',
      message: {
        content: '"A"',
        substitutions: [
          {
            length: 3,
            offset: 0,
          },
        ],
      },
    });
  });

  it('parses formatted strings with insufficient arguments', () => {
    expect(YellowBoxCategory.parse(['%s %s', 'A'])).toEqual({
      category: '\ufeff%s %s',
      message: {
        content: '"A" %s',
        substitutions: [
          {
            length: 3,
            offset: 0,
          },
          {
            length: 2,
            offset: 4,
          },
        ],
      },
    });
  });

  it('parses formatted strings with excess arguments', () => {
    expect(YellowBoxCategory.parse(['%s', 'A', 'B'])).toEqual({
      category: '\ufeff%s "B"',
      message: {
        content: '"A" "B"',
        substitutions: [
          {
            length: 3,
            offset: 0,
          },
        ],
      },
    });
  });

  it('treats "%s" in arguments as literals', () => {
    expect(YellowBoxCategory.parse(['%s', '%s', 'A'])).toEqual({
      category: '\ufeff%s "A"',
      message: {
        content: '"%s" "A"',
        substitutions: [
          {
            length: 4,
            offset: 0,
          },
        ],
      },
    });
  });

  it('renders content with no substitutions', () => {
    expect(
      YellowBoxCategory.render(
        {content: 'A', substitutions: []},
        {fontWeight: 'bold'},
      ),
    ).toMatchSnapshot();
  });

  it('renders a single substitution', () => {
    expect(
      YellowBoxCategory.render(
        {
          content: '"A"',
          substitutions: [
            {
              length: 3,
              offset: 0,
            },
          ],
        },
        {fontWeight: 'bold'},
      ),
    ).toMatchSnapshot();
  });

  it('renders multiple substitutions', () => {
    expect(
      YellowBoxCategory.render(
        {
          content: '"A" "B" "C"',
          substitutions: [
            {
              length: 3,
              offset: 0,
            },
            {
              length: 3,
              offset: 4,
            },
            {
              length: 3,
              offset: 8,
            },
          ],
        },
        {fontWeight: 'bold'},
      ),
    ).toMatchSnapshot();
  });

  it('renders substitutions with leading content', () => {
    expect(
      YellowBoxCategory.render(
        {
          content: '!"A"',
          substitutions: [
            {
              length: 3,
              offset: 1,
            },
          ],
        },
        {fontWeight: 'bold'},
      ),
    ).toMatchSnapshot();
  });

  it('renders substitutions with trailing content', () => {
    expect(
      YellowBoxCategory.render(
        {
          content: '"A"!',
          substitutions: [
            {
              length: 3,
              offset: 0,
            },
          ],
        },
        {fontWeight: 'bold'},
      ),
    ).toMatchSnapshot();
  });
});
