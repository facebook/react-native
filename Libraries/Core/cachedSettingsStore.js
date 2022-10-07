
const settingsModule = require('../Settings/Settings');
const REACT_DEVTOOLS_SETTINGS_KEY_PREFIX = 'ReactDevTools::Settings::';

export type CachedSettingsStore = {
  setValue: (key: string, value: string) => void,
  getValue: (key: string) => ?string,
};

function getFullKey(suffix: string): string {
  return `${REACT_DEVTOOLS_SETTINGS_KEY_PREFIX}${suffix}`;
}

const cachedSettingsStore: CachedSettingsStore = {
  setValue: (key, value) => {
    try {
      settingsModule.set({
        [getFullKey(key)]: value,
      });
    } catch {}
  },
  getValue: (key) => {
    try {
      return settingsModule.get(getFullKey(key));
    } catch {}
  },
};

module.exports = cachedSettingsStore;
