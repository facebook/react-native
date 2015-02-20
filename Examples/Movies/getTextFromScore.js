/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 * @flow
 */
'use strict';

function getTextFromScore(score: number): string {
  return score > 0 ? score + '%' : 'N/A';
}

module.exports = getTextFromScore;
