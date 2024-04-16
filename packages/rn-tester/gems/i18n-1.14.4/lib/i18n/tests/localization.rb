module I18n
  module Tests
    module Localization
      autoload :Date,     'i18n/tests/localization/date'
      autoload :DateTime, 'i18n/tests/localization/date_time'
      autoload :Time,     'i18n/tests/localization/time'
      autoload :Procs,    'i18n/tests/localization/procs'

      def self.included(base)
        base.class_eval do
          include I18n::Tests::Localization::Date
          include I18n::Tests::Localization::DateTime
          include I18n::Tests::Localization::Procs
          include I18n::Tests::Localization::Time
        end
      end
    end
  end
end