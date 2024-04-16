# frozen_string_literal: true

module ActiveSupport
  module DeprecatedRangeWithFormat # :nodoc:
    NOT_SET = Object.new # :nodoc:
    def to_s(format = NOT_SET)
      if formatter = RangeWithFormat::RANGE_FORMATS[format]
        ActiveSupport::Deprecation.warn(
          "Range#to_s(#{format.inspect}) is deprecated. Please use Range#to_fs(#{format.inspect}) instead."
        )
        formatter.call(first, last)
      elsif format == NOT_SET
        if formatter = RangeWithFormat::RANGE_FORMATS[:default]
          ActiveSupport::Deprecation.warn(<<-MSG.squish)
            Using a :default format for Range#to_s is deprecated. Please use Range#to_fs instead. If you fixed all
            places inside your application that you see this deprecation, you can set
            `ENV['RAILS_DISABLE_DEPRECATED_TO_S_CONVERSION']` to `"true"` in the `config/application.rb` file before
            the `Bundler.require` call to fix all the callers outside of your application.
          MSG
          formatter.call(first, last)
        else
          super()
        end
      else
        ActiveSupport::Deprecation.warn(
          "Range#to_s(#{format.inspect}) is deprecated. Please use Range#to_fs(#{format.inspect}) instead."
        )
        super()
      end
    end
    alias_method :to_default_s, :to_s
    deprecate :to_default_s
  end
end

Range.prepend(ActiveSupport::DeprecatedRangeWithFormat)
