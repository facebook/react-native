# frozen_string_literal: true

# Hack to load json gem first so we can override its to_json.
require "json"
require "bigdecimal"
require "ipaddr"
require "uri/generic"
require "pathname"
require "active_support/core_ext/big_decimal/conversions" # for #to_s
require "active_support/core_ext/hash/except"
require "active_support/core_ext/hash/slice"
require "active_support/core_ext/object/instance_variables"
require "time"
require "active_support/core_ext/time/conversions"
require "active_support/core_ext/date_time/conversions"
require "active_support/core_ext/date/conversions"

#--
# The JSON gem adds a few modules to Ruby core classes containing :to_json definition, overwriting
# their default behavior. That said, we need to define the basic to_json method in all of them,
# otherwise they will always use to_json gem implementation, which is backwards incompatible in
# several cases (for instance, the JSON implementation for Hash does not work) with inheritance.
#
# On the other hand, we should avoid conflict with ::JSON.{generate,dump}(obj). Unfortunately, the
# JSON gem's encoder relies on its own to_json implementation to encode objects. Since it always
# passes a ::JSON::State object as the only argument to to_json, we can detect that and forward the
# calls to the original to_json method.
#
# It should be noted that when using ::JSON.{generate,dump} directly, ActiveSupport's encoder is
# bypassed completely. This means that as_json won't be invoked and the JSON gem will simply
# ignore any options it does not natively understand. This also means that ::JSON.{generate,dump}
# should give exactly the same results with or without active support.

module ActiveSupport
  module ToJsonWithActiveSupportEncoder # :nodoc:
    def to_json(options = nil)
      if options.is_a?(::JSON::State)
        # Called from JSON.{generate,dump}, forward it to JSON gem's to_json
        super(options)
      else
        # to_json is being invoked directly, use ActiveSupport's encoder
        ActiveSupport::JSON.encode(self, options)
      end
    end
  end
end

[Enumerable, Object, Array, FalseClass, Float, Hash, Integer, NilClass, String, TrueClass].reverse_each do |klass|
  klass.prepend(ActiveSupport::ToJsonWithActiveSupportEncoder)
end

class Module
  def as_json(options = nil) # :nodoc:
    name
  end
end

class Object
  def as_json(options = nil) # :nodoc:
    if respond_to?(:to_hash)
      to_hash.as_json(options)
    else
      instance_values.as_json(options)
    end
  end
end

class Struct # :nodoc:
  def as_json(options = nil)
    Hash[members.zip(values)].as_json(options)
  end
end

class TrueClass
  def as_json(options = nil) # :nodoc:
    self
  end
end

class FalseClass
  def as_json(options = nil) # :nodoc:
    self
  end
end

class NilClass
  def as_json(options = nil) # :nodoc:
    self
  end
end

class String
  def as_json(options = nil) # :nodoc:
    self
  end
end

class Symbol
  def as_json(options = nil) # :nodoc:
    to_s
  end
end

class Numeric
  def as_json(options = nil) # :nodoc:
    self
  end
end

class Float
  # Encoding Infinity or NaN to JSON should return "null". The default returns
  # "Infinity" or "NaN" which are not valid JSON.
  def as_json(options = nil) # :nodoc:
    finite? ? self : nil
  end
end

class BigDecimal
  # A BigDecimal would be naturally represented as a JSON number. Most libraries,
  # however, parse non-integer JSON numbers directly as floats. Clients using
  # those libraries would get in general a wrong number and no way to recover
  # other than manually inspecting the string with the JSON code itself.
  #
  # That's why a JSON string is returned. The JSON literal is not numeric, but
  # if the other end knows by contract that the data is supposed to be a
  # BigDecimal, it still has the chance to post-process the string and get the
  # real value.
  def as_json(options = nil) # :nodoc:
    finite? ? to_s : nil
  end
end

class Regexp
  def as_json(options = nil) # :nodoc:
    to_s
  end
end

module Enumerable
  def as_json(options = nil) # :nodoc:
    to_a.as_json(options)
  end
end

class IO
  def as_json(options = nil) # :nodoc:
    to_s
  end
end

class Range
  def as_json(options = nil) # :nodoc:
    to_s
  end
end

class Array
  def as_json(options = nil) # :nodoc:
    map { |v| options ? v.as_json(options.dup) : v.as_json }
  end
end

class Hash
  def as_json(options = nil) # :nodoc:
    # create a subset of the hash by applying :only or :except
    subset = if options
      if attrs = options[:only]
        slice(*Array(attrs))
      elsif attrs = options[:except]
        except(*Array(attrs))
      else
        self
      end
    else
      self
    end

    result = {}
    subset.each do |k, v|
      result[k.to_s] = options ? v.as_json(options.dup) : v.as_json
    end
    result
  end
end

class Time
  def as_json(options = nil) # :nodoc:
    if ActiveSupport::JSON::Encoding.use_standard_json_time_format
      xmlschema(ActiveSupport::JSON::Encoding.time_precision)
    else
      %(#{strftime("%Y/%m/%d %H:%M:%S")} #{formatted_offset(false)})
    end
  end
end

class Date
  def as_json(options = nil) # :nodoc:
    if ActiveSupport::JSON::Encoding.use_standard_json_time_format
      strftime("%Y-%m-%d")
    else
      strftime("%Y/%m/%d")
    end
  end
end

class DateTime
  def as_json(options = nil) # :nodoc:
    if ActiveSupport::JSON::Encoding.use_standard_json_time_format
      xmlschema(ActiveSupport::JSON::Encoding.time_precision)
    else
      strftime("%Y/%m/%d %H:%M:%S %z")
    end
  end
end

class URI::Generic # :nodoc:
  def as_json(options = nil)
    to_s
  end
end

class Pathname # :nodoc:
  def as_json(options = nil)
    to_s
  end
end

class IPAddr # :nodoc:
  def as_json(options = nil)
    to_s
  end
end

class Process::Status # :nodoc:
  def as_json(options = nil)
    { exitstatus: exitstatus, pid: pid }
  end
end

class Exception
  def as_json(options = nil)
    to_s
  end
end
