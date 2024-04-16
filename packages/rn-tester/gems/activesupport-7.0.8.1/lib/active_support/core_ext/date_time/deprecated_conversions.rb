# frozen_string_literal: true

require "date"

class DateTime
  NOT_SET = Object.new # :nodoc:
  def to_s(format = NOT_SET) # :nodoc:
    if formatter = ::Time::DATE_FORMATS[format]
      ActiveSupport::Deprecation.warn(
        "DateTime#to_s(#{format.inspect}) is deprecated. Please use DateTime#to_fs(#{format.inspect}) instead."
      )
      formatter.respond_to?(:call) ? formatter.call(self).to_s : strftime(formatter)
    elsif format == NOT_SET
      if formatter = ::Time::DATE_FORMATS[:default]
        ActiveSupport::Deprecation.warn(<<-MSG.squish)
          Using a :default format for DateTime#to_s is deprecated. Please use DateTime#to_fs instead. If you fixed all
          places inside your application that you see this deprecation, you can set
          `ENV['RAILS_DISABLE_DEPRECATED_TO_S_CONVERSION']` to `"true"` in the `config/application.rb` file before
          the `Bundler.require` call to fix all the callers outside of your application.
        MSG
        if formatter.respond_to?(:call)
          formatter.call(self).to_s
        else
          strftime(formatter)
        end
      else
        to_default_s
      end
    else
      ActiveSupport::Deprecation.warn(
        "DateTime#to_s(#{format.inspect}) is deprecated. Please use DateTime#to_fs(#{format.inspect}) instead."
      )
      to_default_s
    end
  end
end
