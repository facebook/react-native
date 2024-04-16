# frozen_string_literal: true

module I18n
  module Backend
    autoload :Base,                  'i18n/backend/base'
    autoload :Cache,                 'i18n/backend/cache'
    autoload :CacheFile,             'i18n/backend/cache_file'
    autoload :Cascade,               'i18n/backend/cascade'
    autoload :Chain,                 'i18n/backend/chain'
    autoload :Fallbacks,             'i18n/backend/fallbacks'
    autoload :Flatten,               'i18n/backend/flatten'
    autoload :Gettext,               'i18n/backend/gettext'
    autoload :InterpolationCompiler, 'i18n/backend/interpolation_compiler'
    autoload :KeyValue,              'i18n/backend/key_value'
    autoload :LazyLoadable,          'i18n/backend/lazy_loadable'
    autoload :Memoize,               'i18n/backend/memoize'
    autoload :Metadata,              'i18n/backend/metadata'
    autoload :Pluralization,         'i18n/backend/pluralization'
    autoload :Simple,                'i18n/backend/simple'
    autoload :Transliterator,        'i18n/backend/transliterator'
  end
end
