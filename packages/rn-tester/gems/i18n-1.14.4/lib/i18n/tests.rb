# frozen_string_literal: true

module I18n
  module Tests
    autoload :Basics,        'i18n/tests/basics'
    autoload :Defaults,      'i18n/tests/defaults'
    autoload :Interpolation, 'i18n/tests/interpolation'
    autoload :Link,          'i18n/tests/link'
    autoload :Localization,  'i18n/tests/localization'
    autoload :Lookup,        'i18n/tests/lookup'
    autoload :Pluralization, 'i18n/tests/pluralization'
    autoload :Procs,         'i18n/tests/procs'
  end
end
