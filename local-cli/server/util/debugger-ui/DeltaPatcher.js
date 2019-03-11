/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This file is a copy of the reference `DeltaPatcher`, located in
 * metro. The reason to not reuse that file is that in this context
 * we cannot have flow annotations or CJS syntax (since this file is directly)
 * injected into a static HTML page.
 *
 * TODO: Find a simple and lightweight way to compile `DeltaPatcher` to avoid
 * having this duplicated file.
 */
(function(global) {
  'use strict';

  /**
   * This is a reference client for the Delta Bundler: it maintains cached the
   * last patched bundle delta and it's capable of applying new Deltas received
   * from the Bundler.
   */
  class DeltaPatcher {
    constructor() {
      this._lastBundle = {
        revisionId: undefined,
        pre: '',
        post: '',
        modules: new Map(),
      };
      this._initialized = false;
      this._lastNumModifiedFiles = 0;
      this._lastModifiedDate = new Date();
    }

    static get(id) {
      let deltaPatcher = this._deltaPatchers.get(id);

      if (!deltaPatcher) {
        deltaPatcher = new DeltaPatcher();
        this._deltaPatchers.set(id, deltaPatcher);
      }

      return deltaPatcher;
    }

    /**
     * Applies a Delta Bundle to the current bundle.
     */
    applyDelta(bundle) {
      // Make sure that the first received bundle is a base.
      if (!this._initialized && !bundle.base) {
        throw new Error(
          'DeltaPatcher should receive a base Bundle when being initialized',
        );
      }

      this._initialized = true;

      // Reset the current bundle when we receive a base bundle.
      if (bundle.base) {
        this._lastNumModifiedFiles = bundle.modules.length;

        this._lastBundle = {
          revisionId: bundle.revisionId,
          pre: bundle.pre,
          post: bundle.post,
          modules: new Map(bundle.modules),
        };
      } else {
        this._lastNumModifiedFiles =
          bundle.modules.length + bundle.deleted.length;

        this._lastBundle.revisionId = bundle.revisionId;

        for (const [key, value] of bundle.modules) {
          this._lastBundle.modules.set(key, value);
        }

        for (const id of bundle.deleted) {
          this._lastBundle.modules.delete(id);
        }
      }

      if (this._lastNumModifiedFiles > 0) {
        this._lastModifiedDate = new Date();
      }

      return this;
    }

    getLastRevisionId() {
      return this._lastBundle.revisionId;
    }

    /**
     * Returns the number of modified files in the last received Delta. This is
     * currently used to populate the `X-Metro-Files-Changed-Count` HTTP header
     * when metro serves the whole JS bundle, and can potentially be removed once
     * we only send the actual deltas to clients.
     */
    getLastNumModifiedFiles() {
      return this._lastNumModifiedFiles;
    }

    getLastModifiedDate() {
      return this._lastModifiedDate;
    }

    getAllModules() {
      return [].concat(
        [this._lastBundle.pre],
        Array.from(this._lastBundle.modules.values()),
        [this._lastBundle.post],
      );
    }
  }

  DeltaPatcher._deltaPatchers = new Map();

  global.DeltaPatcher = DeltaPatcher;
})(window);
