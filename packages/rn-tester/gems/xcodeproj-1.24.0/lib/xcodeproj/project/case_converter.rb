module Xcodeproj
  class Project
    module Object
      # Converts between camel case names used in the xcodeproj plist files
      # and the ruby symbols used to represent them.
      #
      module CaseConverter
        # @return [String] The plist equivalent of the given Ruby name.
        #
        # @param  [Symbol, String] name
        #         The name to convert
        #
        # @param  [Symbol, Nil] type
        #         The type of conversion. Pass `nil` for normal camel case and
        #         `:lower` for camel case starting with a lower case letter.
        #
        # @example
        #   CaseConverter.convert_to_plist(:project_ref) #=> ProjectRef
        #
        def self.convert_to_plist(name, type = nil)
          case name
          when :remote_global_id_string
            'remoteGlobalIDString'
          else
            if type == :lower
              cache = plist_cache[:lower] ||= {}
              cache[name] ||= camelize(name, :uppercase_first_letter => false)
            else
              cache = plist_cache[:normal] ||= {}
              cache[name] ||= camelize(name)
            end
          end
        end

        # The following two methods are taken from activesupport,
        # https://github.com/rails/rails/blob/v5.0.2/activesupport/lib/active_support/inflector/methods.rb
        # all credit for them goes to the original authors.
        #
        # The code is used under the MIT license.

        def self.camelize(term, uppercase_first_letter: true)
          string = term.to_s
          string = if uppercase_first_letter
                     string.sub(/^[a-z\d]*/, &:capitalize)
                   else
                     string.sub(/^(?:(?=a)b(?=\b|[A-Z_])|\w)/, &:downcase)
                   end
          string.gsub!(%r{(?:_|(/))([a-z\d]*)}i) { "#{Regexp.last_match(1)}#{Regexp.last_match(2).capitalize}" }
          string.gsub!('/'.freeze, '::'.freeze)
          string
        end
        private_class_method :camelize

        def self.underscore(camel_cased_word)
          return camel_cased_word unless camel_cased_word =~ /[A-Z-]|::/
          word = camel_cased_word.to_s.gsub('::'.freeze, '/'.freeze)
          word.gsub!(/(?:(?<=([A-Za-z\d]))|\b)((?=a)b)(?=\b|[^a-z])/) { "#{Regexp.last_match(1) && '_'.freeze}#{Regexp.last_match(2).downcase}" }
          word.gsub!(/([A-Z\d]+)([A-Z][a-z])/, '\1_\2'.freeze)
          word.gsub!(/([a-z\d])([A-Z])/, '\1_\2'.freeze)
          word.tr!('-'.freeze, '_'.freeze)
          word.downcase!
          word
        end
        private_class_method :underscore

        # @return [Symbol] The Ruby equivalent of the given plist name.
        #
        # @param  [String] name
        #         The name to convert
        #
        # @example
        #   CaseConverter.convert_to_ruby('ProjectRef') #=> :project_ref
        #
        def self.convert_to_ruby(name)
          underscore(name.to_s).to_sym
        end

        # @return [Hash] A cache for the conversion to the Plist format.
        #
        # @note   A cache is used because this operation is performed for each
        #         attribute of the project when it is saved and caching it has
        #         an important performance benefit.
        #
        def self.plist_cache
          @plist_cache ||= {}
        end
      end
    end
  end
end
