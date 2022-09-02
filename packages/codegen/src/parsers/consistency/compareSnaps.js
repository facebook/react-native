/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

function compareSnaps(
  flowFixtures,
  flowSnaps,
  flowExtraCases,
  tsFixtures,
  tsSnaps,
  tsExtraCases,
) {
  const flowCases = Object.keys(flowFixtures).sort();
  const tsCases = Object.keys(tsFixtures).sort();
  const commonCases = flowCases.filter(name => tsCases.indexOf(name) !== -1);

  describe('RN Codegen Parsers', () => {
    it('should not unintentionally contains test case for Flow but not for TypeScript', () => {
      expect(
        flowCases.filter(name => commonCases.indexOf(name) === -1),
      ).toEqual(flowExtraCases);
    });

    it('should not unintentionally contains test case for TypeScript but not for Flow', () => {
      expect(tsCases.filter(name => commonCases.indexOf(name) === -1)).toEqual(
        tsExtraCases,
      );
    });

    for (const commonCase of commonCases) {
      it(`should generate the same snap from Flow and TypeScript for fixture ${commonCase}`, () => {
        expect(
          flowSnaps[
            `RN Codegen Flow Parser can generate fixture ${commonCase}`
          ],
        ).toEqual(
          tsSnaps[
            `RN Codegen TypeScript Parser can generate fixture ${commonCase}`
          ],
        );
      });
    }
  });
}

function compareTsArraySnaps(tsSnaps, tsExtraCases) {
  for (const array2Case of tsExtraCases.filter(
    name => name.indexOf('ARRAY2') !== -1,
  )) {
    const arrayCase = array2Case.replace('ARRAY2', 'ARRAY');
    it(`should generate the same snap from fixture ${arrayCase} and ${array2Case}`, () => {
      expect(
        tsSnaps[
          `RN Codegen TypeScript Parser can generate fixture ${arrayCase}`
        ],
      ).toEqual(
        tsSnaps[
          `RN Codegen TypeScript Parser can generate fixture ${array2Case}`
        ],
      );
    });
  }
}

module.exports = {
  compareSnaps,
  compareTsArraySnaps,
};
