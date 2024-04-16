# frozen_string_literal: true

module ActiveSupport
  module RangeWithFormat
    RANGE_FORMATS = {
      db: -> (start, stop) do
        case start
        when String then "BETWEEN '#{start}' AND '#{stop}'"
        else
          "BETWEEN '#{start.to_fs(:db)}' AND '#{stop.to_fs(:db)}'"
        end
      end
    }

    # Convert range to a formatted string. See RANGE_FORMATS for predefined formats.
    #
    # This method is aliased to <tt>to_formatted_s</tt>.
    #
    #   range = (1..100)           # => 1..100
    #
    #   range.to_s                 # => "1..100"
    #   range.to_fs(:db)            # => "BETWEEN '1' AND '100'"
    #
    # == Adding your own range formats to to_s
    # You can add your own formats to the Range::RANGE_FORMATS hash.
    # Use the format name as the hash key and a Proc instance.
    #
    #   # config/initializers/range_formats.rb
    #   Range::RANGE_FORMATS[:short] = ->(start, stop) { "Between #{start.to_fs(:db)} and #{stop.to_fs(:db)}" }
    def to_fs(format = :default)
      if formatter = RANGE_FORMATS[format]
        formatter.call(first, last)
      else
        to_s
      end
    end
    alias_method :to_formatted_s, :to_fs
  end
end

Range.prepend(ActiveSupport::RangeWithFormat)
