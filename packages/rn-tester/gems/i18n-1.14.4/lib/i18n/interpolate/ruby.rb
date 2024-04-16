# frozen_string_literal: true

# heavily based on Masao Mutoh's gettext String interpolation extension
# http://github.com/mutoh/gettext/blob/f6566738b981fe0952548c421042ad1e0cdfb31e/lib/gettext/core_ext/string.rb

module I18n
  DEFAULT_INTERPOLATION_PATTERNS = [
    /%%/,
    /%\{([\w|]+)\}/,                            # matches placeholders like "%{foo} or %{foo|word}"
    /%<(\w+)>([^\d]*?\d*\.?\d*[bBdiouxXeEfgGcps])/  # matches placeholders like "%<foo>.d"
  ].freeze
  INTERPOLATION_PATTERN = Regexp.union(DEFAULT_INTERPOLATION_PATTERNS)
  deprecate_constant :INTERPOLATION_PATTERN

  INTERPOLATION_PATTERNS_CACHE = Hash.new do |hash, patterns|
    hash[patterns] = Regexp.union(patterns)
  end
  private_constant :INTERPOLATION_PATTERNS_CACHE

  class << self
    # Return String or raises MissingInterpolationArgument exception.
    # Missing argument's logic is handled by I18n.config.missing_interpolation_argument_handler.
    def interpolate(string, values)
      raise ReservedInterpolationKey.new($1.to_sym, string) if string =~ I18n.reserved_keys_pattern
      raise ArgumentError.new('Interpolation values must be a Hash.') unless values.kind_of?(Hash)
      interpolate_hash(string, values)
    end

    def interpolate_hash(string, values)
      pattern = INTERPOLATION_PATTERNS_CACHE[config.interpolation_patterns]
      interpolated = false

      interpolated_string = string.gsub(pattern) do |match|
        interpolated = true

        if match == '%%'
          '%'
        else
          key = ($1 || $2 || match.tr("%{}", "")).to_sym
          value = if values.key?(key)
                    values[key]
                  else
                    config.missing_interpolation_argument_handler.call(key, values, string)
                  end
          value = value.call(values) if value.respond_to?(:call)
          $3 ? sprintf("%#{$3}", value) : value
        end
      end

      interpolated ? interpolated_string : string
    end
  end
end
