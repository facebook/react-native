'use strict';

const BlobRegistry = require('../BlobRegistry');

describe('BlobRegistry', () => {
  describe('register', () => {
    it('does not throw error', () => {
      expect(() => BlobRegistry.register('id1')).not.toThrowError();
    });

    it('registers new id', () => {
      BlobRegistry.register('id2');
      expect(BlobRegistry.has('id2')).toBeTruthy();
    });
  });

  describe('unregister', () => {
    it('does not throw error', () => {
      expect(() => BlobRegistry.unregister('id3')).not.toThrowError();
    });

    it('remove registered id', () => {
      BlobRegistry.register('id4');
      BlobRegistry.unregister('id4');
      expect(BlobRegistry.has('id4')).toBeFalsy();
    });
  });

  describe('has', () => {
    it('returns true for registered id', () => {
      BlobRegistry.register('id5');
      expect(BlobRegistry.has('id5')).toBeTruthy();
    });

    it('returns false for unregistered id', () => {
      expect(BlobRegistry.has('id6')).toBeFalsy();
    });
  });
});
