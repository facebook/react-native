# frozen_string_literal: true

class Array
  NOT_SET = Object.new # :nodoc:
  def to_s(format = NOT_SET) # :nodoc:
    case format
    when :db
      ActiveSupport::Deprecation.warn(
        "Array#to_s(#{format.inspect}) is deprecated. Please use Array#to_fs(#{format.inspect}) instead."
      )
      if empty?
        "null"
      else
        collect(&:id).join(",")
      end
    when NOT_SET
      to_default_s
    else
      ActiveSupport::Deprecation.warn(
        "Array#to_s(#{format.inspect}) is deprecated. Please use Array#to_fs(#{format.inspect}) instead."
      )
      to_default_s
    end
  end
end
