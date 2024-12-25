/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type TerminalReporter from 'metro/src/lib/TerminalReporter';

import chalk from 'chalk';

type PageDescription = $ReadOnly<{
  id: string,
  title: string,
  description: string,
  ...
}>;

export default class OpenDebuggerKeyboardHandler {
  #devServerUrl: string;
  #reporter: TerminalReporter;
  #targetsShownForSelection: ?$ReadOnlyArray<PageDescription> = null;

  constructor({
    devServerUrl,
    reporter,
  }: {
    devServerUrl: string,
    reporter: TerminalReporter,
  }) {
    this.#devServerUrl = devServerUrl;
    this.#reporter = reporter;
  }

  async #tryOpenDebuggerForTarget(target: PageDescription): Promise<void> {
    this.#targetsShownForSelection = null;
    this.#clearTerminalMenu();

    try {
      await fetch(
        new URL(
          '/open-debugger?target=' + encodeURIComponent(target.id),
          this.#devServerUrl,
        ).href,
        {method: 'POST'},
      );
    } catch (e) {
      this.#log(
        'error',
        'Failed to open debugger for %s (%s): %s',
        target.title,
        target.description,
        e.message,
      );
      this.#clearTerminalMenu();
    }
  }

  /**
   * Used in response to 'j' to debug - fetch the available debug targets and:
   *  - If no targets, warn
   *  - If one target, open it
   *  - If more, show a list. The keyboard listener should run subsequent key
   *    presses through maybeHandleTargetSelection, which will launch the
   *    debugger if a match is made.
   */
  async handleOpenDebugger(): Promise<void> {
    this.#setTerminalMenu('Fetching available debugging targets...');
    this.#targetsShownForSelection = null;

    try {
      const res = await fetch(this.#devServerUrl + '/json/list', {
        method: 'POST',
      });

      if (res.status !== 200) {
        throw new Error(`Unexpected status code: ${res.status}`);
      }
      const targets = (await res.json()) as $ReadOnlyArray<PageDescription>;
      if (!Array.isArray(targets)) {
        throw new Error('Expected array.');
      }

      if (targets.length === 0) {
        this.#log('warn', 'No connected targets');
        this.#clearTerminalMenu();
      } else if (targets.length === 1) {
        const target = targets[0];
        // eslint-disable-next-line no-void
        void this.#tryOpenDebuggerForTarget(target);
      } else {
        this.#targetsShownForSelection = targets;

        if (targets.length > 9) {
          this.#log(
            'warn',
            '10 or more debug targets available, showing the first 9.',
          );
        }

        this.#setTerminalMenu(
          `Multiple debug targets available, please select:\n  ${targets
            .slice(0, 9)
            .map(
              ({title}, i) =>
                `${chalk.white.inverse(` ${i + 1} `)} - "${title}"`,
            )
            .join('\n  ')}`,
        );
      }
    } catch (e) {
      this.#log('error', `Failed to fetch debug targets: ${e.message}`);
      this.#clearTerminalMenu();
    }
  }

  /**
   * Handle key presses that correspond to a valid selection from a visible
   * selection list.
   *
   * @return true if we've handled the key as a target selection, false if the
   *   caller should handle the key.
   */
  maybeHandleTargetSelection(keyName: string): boolean {
    if (keyName >= '1' && keyName <= '9') {
      const targetIndex = Number(keyName) - 1;
      if (
        this.#targetsShownForSelection != null &&
        targetIndex < this.#targetsShownForSelection.length
      ) {
        const target = this.#targetsShownForSelection[targetIndex];
        // eslint-disable-next-line no-void
        void this.#tryOpenDebuggerForTarget(target);
        return true;
      }
    }
    return false;
  }

  /**
   * Dismiss any target selection UI, if shown.
   */
  dismiss() {
    this.#clearTerminalMenu();
    this.#targetsShownForSelection = null;
  }

  #log(level: 'info' | 'warn' | 'error', ...data: Array<mixed>): void {
    this.#reporter.update({
      type: 'unstable_server_log',
      level,
      data,
    });
  }

  #setTerminalMenu(message: string) {
    this.#reporter.update({
      type: 'unstable_server_menu_updated',
      message,
    });
  }

  #clearTerminalMenu() {
    this.#reporter.update({
      type: 'unstable_server_menu_cleared',
    });
  }
}
