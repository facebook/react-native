/**
 * @flow
 */
'use strict';

export type AsyncStorageBackend = {
  clear: Function,
  getAllKeys: Function,
  multiGet: Function,
  multiSet: Function,
  multiRemove: Function,
  multiMerge?: Function
};
