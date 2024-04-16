# frozen_string_literal: true

# The InterpolationCompiler module contains optimizations that can tremendously
# speed up the interpolation process on the Simple backend.
#
# It works by defining a pre-compiled method on stored translation Strings that
# already bring all the knowledge about contained interpolation variables etc.
# so that the actual recurring interpolation will be very fast.
#
# To enable pre-compiled interpolations you can simply include the
# InterpolationCompiler module to the Simple backend:
#
#   I18n::Backend::Simple.include(I18n::Backend::InterpolationCompiler)
#
# Note that InterpolationCompiler does not yield meaningful results and consequently
# should not be used with Ruby 1.9 (YARV) but improves performance everywhere else
# (jRuby, Rubinius).
module I18n
  module Backend
    module InterpolationCompiler
      module Compiler
        extend self

        TOKENIZER = /(%%?\{[^}]+\})/

        def compile_if_an_interpolation(string)
          if interpolated_str?(string)
            string.instance_eval <<-RUBY_EVAL, __FILE__, __LINE__
              def i18n_interpolate(v = {})
                "#{compiled_interpolation_body(string)}"
              end
            RUBY_EVAL
          end

          string
        end

        def interpolated_str?(str)
          str.kind_of?(::String) && str =~ TOKENIZER
        end

        protected
        # tokenize("foo %{bar} baz %%{buz}") # => ["foo ", "%{bar}", " baz ", "%%{buz}"]
        def tokenize(str)
          str.split(TOKENIZER)
        end

        def compiled_interpolation_body(str)
          tokenize(str).map do |token|
            token.match(TOKENIZER) ? handle_interpolation_token(token) : escape_plain_str(token)
          end.join
        end

        def handle_interpolation_token(token)
          token.start_with?('%%') ? token[1..] : compile_interpolation_token(token[2..-2])
        end

        def compile_interpolation_token(key)
          "\#{#{interpolate_or_raise_missing(key)}}"
        end

        def interpolate_or_raise_missing(key)
          escaped_key = escape_key_sym(key)
          RESERVED_KEYS.include?(key) ? reserved_key(escaped_key) : interpolate_key(escaped_key)
        end

        def interpolate_key(key)
          [direct_key(key), nil_key(key), missing_key(key)].join('||')
        end

        def direct_key(key)
          "((t = v[#{key}]) && t.respond_to?(:call) ? t.call : t)"
        end

        def nil_key(key)
          "(v.has_key?(#{key}) && '')"
        end

        def missing_key(key)
          "I18n.config.missing_interpolation_argument_handler.call(#{key}, v, self)"
        end

        def reserved_key(key)
          "raise(ReservedInterpolationKey.new(#{key}, self))"
        end

        def escape_plain_str(str)
          str.gsub(/"|\\|#/) {|x| "\\#{x}"}
        end

        def escape_key_sym(key)
          # rely on Ruby to do all the hard work :)
          key.to_sym.inspect
        end
      end

      def interpolate(locale, string, values)
        if string.respond_to?(:i18n_interpolate)
          string.i18n_interpolate(values)
        elsif values
          super
        else
          string
        end
      end

      def store_translations(locale, data, options = EMPTY_HASH)
        compile_all_strings_in(data)
        super
      end

      protected
      def compile_all_strings_in(data)
        data.each_value do |value|
          Compiler.compile_if_an_interpolation(value)
          compile_all_strings_in(value) if value.kind_of?(Hash)
        end
      end
    end
  end
end
