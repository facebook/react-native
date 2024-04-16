# frozen_string_literal: true

require "active_support/inflections"
require "active_support/core_ext/object/blank"

module ActiveSupport
  # The Inflector transforms words from singular to plural, class names to table
  # names, modularized class names to ones without, and class names to foreign
  # keys. The default inflections for pluralization, singularization, and
  # uncountable words are kept in inflections.rb.
  #
  # The Rails core team has stated patches for the inflections library will not
  # be accepted in order to avoid breaking legacy applications which may be
  # relying on errant inflections. If you discover an incorrect inflection and
  # require it for your application or wish to define rules for languages other
  # than English, please correct or add them yourself (explained below).
  module Inflector
    extend self

    # Returns the plural form of the word in the string.
    #
    # If passed an optional +locale+ parameter, the word will be
    # pluralized using rules defined for that language. By default,
    # this parameter is set to <tt>:en</tt>.
    #
    #   pluralize('post')             # => "posts"
    #   pluralize('octopus')          # => "octopi"
    #   pluralize('sheep')            # => "sheep"
    #   pluralize('words')            # => "words"
    #   pluralize('CamelOctopus')     # => "CamelOctopi"
    #   pluralize('ley', :es)         # => "leyes"
    def pluralize(word, locale = :en)
      apply_inflections(word, inflections(locale).plurals, locale)
    end

    # The reverse of #pluralize, returns the singular form of a word in a
    # string.
    #
    # If passed an optional +locale+ parameter, the word will be
    # singularized using rules defined for that language. By default,
    # this parameter is set to <tt>:en</tt>.
    #
    #   singularize('posts')            # => "post"
    #   singularize('octopi')           # => "octopus"
    #   singularize('sheep')            # => "sheep"
    #   singularize('word')             # => "word"
    #   singularize('CamelOctopi')      # => "CamelOctopus"
    #   singularize('leyes', :es)       # => "ley"
    def singularize(word, locale = :en)
      apply_inflections(word, inflections(locale).singulars, locale)
    end

    # Converts strings to UpperCamelCase.
    # If the +uppercase_first_letter+ parameter is set to false, then produces
    # lowerCamelCase.
    #
    # Also converts '/' to '::' which is useful for converting
    # paths to namespaces.
    #
    #   camelize('active_model')                # => "ActiveModel"
    #   camelize('active_model', false)         # => "activeModel"
    #   camelize('active_model/errors')         # => "ActiveModel::Errors"
    #   camelize('active_model/errors', false)  # => "activeModel::Errors"
    #
    # As a rule of thumb you can think of +camelize+ as the inverse of
    # #underscore, though there are cases where that does not hold:
    #
    #   camelize(underscore('SSLError'))        # => "SslError"
    def camelize(term, uppercase_first_letter = true)
      string = term.to_s
      # String#camelize takes a symbol (:upper or :lower), so here we also support :lower to keep the methods consistent.
      if !uppercase_first_letter || uppercase_first_letter == :lower
        string = string.sub(inflections.acronyms_camelize_regex) { |match| match.downcase! || match }
      else
        string = string.sub(/^[a-z\d]*/) { |match| inflections.acronyms[match] || match.capitalize! || match }
      end
      string.gsub!(/(?:_|(\/))([a-z\d]*)/i) do
        word = $2
        substituted = inflections.acronyms[word] || word.capitalize! || word
        $1 ? "::#{substituted}" : substituted
      end
      string
    end

    # Makes an underscored, lowercase form from the expression in the string.
    #
    # Changes '::' to '/' to convert namespaces to paths.
    #
    #   underscore('ActiveModel')         # => "active_model"
    #   underscore('ActiveModel::Errors') # => "active_model/errors"
    #
    # As a rule of thumb you can think of +underscore+ as the inverse of
    # #camelize, though there are cases where that does not hold:
    #
    #   camelize(underscore('SSLError'))  # => "SslError"
    def underscore(camel_cased_word)
      return camel_cased_word.to_s unless /[A-Z-]|::/.match?(camel_cased_word)
      word = camel_cased_word.to_s.gsub("::", "/")
      word.gsub!(inflections.acronyms_underscore_regex) { "#{$1 && '_' }#{$2.downcase}" }
      word.gsub!(/([A-Z])(?=[A-Z][a-z])|([a-z\d])(?=[A-Z])/) { ($1 || $2) << "_" }
      word.tr!("-", "_")
      word.downcase!
      word
    end

    # Tweaks an attribute name for display to end users.
    #
    # Specifically, performs these transformations:
    #
    # * Applies human inflection rules to the argument.
    # * Deletes leading underscores, if any.
    # * Removes an "_id" suffix if present.
    # * Replaces underscores with spaces, if any.
    # * Downcases all words except acronyms.
    # * Capitalizes the first word.
    # The capitalization of the first word can be turned off by setting the
    # +:capitalize+ option to false (default is true).
    #
    # The trailing '_id' can be kept and capitalized by setting the
    # optional parameter +keep_id_suffix+ to true (default is false).
    #
    #   humanize('employee_salary')                  # => "Employee salary"
    #   humanize('author_id')                        # => "Author"
    #   humanize('author_id', capitalize: false)     # => "author"
    #   humanize('_id')                              # => "Id"
    #   humanize('author_id', keep_id_suffix: true)  # => "Author id"
    #
    # If "SSL" was defined to be an acronym:
    #
    #   humanize('ssl_error') # => "SSL error"
    #
    def humanize(lower_case_and_underscored_word, capitalize: true, keep_id_suffix: false)
      result = lower_case_and_underscored_word.to_s.dup

      inflections.humans.each { |(rule, replacement)| break if result.sub!(rule, replacement) }

      result.tr!("_", " ")
      result.lstrip!
      if !keep_id_suffix && lower_case_and_underscored_word&.end_with?("_id")
        result.delete_suffix!(" id")
      end

      result.gsub!(/([a-z\d]+)/i) do |match|
        match.downcase!
        inflections.acronyms[match] || match
      end

      if capitalize
        result.sub!(/\A\w/) do |match|
          match.upcase!
          match
        end
      end

      result
    end

    # Converts just the first character to uppercase.
    #
    #   upcase_first('what a Lovely Day') # => "What a Lovely Day"
    #   upcase_first('w')                 # => "W"
    #   upcase_first('')                  # => ""
    def upcase_first(string)
      string.length > 0 ? string[0].upcase.concat(string[1..-1]) : ""
    end

    # Capitalizes all the words and replaces some characters in the string to
    # create a nicer looking title. +titleize+ is meant for creating pretty
    # output. It is not used in the Rails internals.
    #
    # The trailing '_id','Id'.. can be kept and capitalized by setting the
    # optional parameter +keep_id_suffix+ to true.
    # By default, this parameter is false.
    #
    #   titleize('man from the boondocks')                       # => "Man From The Boondocks"
    #   titleize('x-men: the last stand')                        # => "X Men: The Last Stand"
    #   titleize('TheManWithoutAPast')                           # => "The Man Without A Past"
    #   titleize('raiders_of_the_lost_ark')                      # => "Raiders Of The Lost Ark"
    #   titleize('string_ending_with_id', keep_id_suffix: true)  # => "String Ending With Id"
    def titleize(word, keep_id_suffix: false)
      humanize(underscore(word), keep_id_suffix: keep_id_suffix).gsub(/\b(?<!\w['’`()])[a-z]/) do |match|
        match.capitalize
      end
    end

    # Creates the name of a table like Rails does for models to table names.
    # This method uses the #pluralize method on the last word in the string.
    #
    #   tableize('RawScaledScorer') # => "raw_scaled_scorers"
    #   tableize('ham_and_egg')     # => "ham_and_eggs"
    #   tableize('fancyCategory')   # => "fancy_categories"
    def tableize(class_name)
      pluralize(underscore(class_name))
    end

    # Creates a class name from a plural table name like Rails does for table
    # names to models. Note that this returns a string and not a Class. (To
    # convert to an actual class follow +classify+ with #constantize.)
    #
    #   classify('ham_and_eggs') # => "HamAndEgg"
    #   classify('posts')        # => "Post"
    #
    # Singular names are not handled correctly:
    #
    #   classify('calculus')     # => "Calculu"
    def classify(table_name)
      # strip out any leading schema name
      camelize(singularize(table_name.to_s.sub(/.*\./, "")))
    end

    # Replaces underscores with dashes in the string.
    #
    #   dasherize('puni_puni') # => "puni-puni"
    def dasherize(underscored_word)
      underscored_word.tr("_", "-")
    end

    # Removes the module part from the expression in the string.
    #
    #   demodulize('ActiveSupport::Inflector::Inflections') # => "Inflections"
    #   demodulize('Inflections')                           # => "Inflections"
    #   demodulize('::Inflections')                         # => "Inflections"
    #   demodulize('')                                      # => ""
    #
    # See also #deconstantize.
    def demodulize(path)
      path = path.to_s
      if i = path.rindex("::")
        path[(i + 2)..-1]
      else
        path
      end
    end

    # Removes the rightmost segment from the constant expression in the string.
    #
    #   deconstantize('Net::HTTP')   # => "Net"
    #   deconstantize('::Net::HTTP') # => "::Net"
    #   deconstantize('String')      # => ""
    #   deconstantize('::String')    # => ""
    #   deconstantize('')            # => ""
    #
    # See also #demodulize.
    def deconstantize(path)
      path.to_s[0, path.rindex("::") || 0] # implementation based on the one in facets' Module#spacename
    end

    # Creates a foreign key name from a class name.
    # +separate_class_name_and_id_with_underscore+ sets whether
    # the method should put '_' between the name and 'id'.
    #
    #   foreign_key('Message')        # => "message_id"
    #   foreign_key('Message', false) # => "messageid"
    #   foreign_key('Admin::Post')    # => "post_id"
    def foreign_key(class_name, separate_class_name_and_id_with_underscore = true)
      underscore(demodulize(class_name)) + (separate_class_name_and_id_with_underscore ? "_id" : "id")
    end

    # Tries to find a constant with the name specified in the argument string.
    #
    #   constantize('Module')   # => Module
    #   constantize('Foo::Bar') # => Foo::Bar
    #
    # The name is assumed to be the one of a top-level constant, no matter
    # whether it starts with "::" or not. No lexical context is taken into
    # account:
    #
    #   C = 'outside'
    #   module M
    #     C = 'inside'
    #     C                # => 'inside'
    #     constantize('C') # => 'outside', same as ::C
    #   end
    #
    # NameError is raised when the name is not in CamelCase or the constant is
    # unknown.
    def constantize(camel_cased_word)
      Object.const_get(camel_cased_word)
    end

    # Tries to find a constant with the name specified in the argument string.
    #
    #   safe_constantize('Module')   # => Module
    #   safe_constantize('Foo::Bar') # => Foo::Bar
    #
    # The name is assumed to be the one of a top-level constant, no matter
    # whether it starts with "::" or not. No lexical context is taken into
    # account:
    #
    #   C = 'outside'
    #   module M
    #     C = 'inside'
    #     C                     # => 'inside'
    #     safe_constantize('C') # => 'outside', same as ::C
    #   end
    #
    # +nil+ is returned when the name is not in CamelCase or the constant (or
    # part of it) is unknown.
    #
    #   safe_constantize('blargle')                  # => nil
    #   safe_constantize('UnknownModule')            # => nil
    #   safe_constantize('UnknownModule::Foo::Bar')  # => nil
    def safe_constantize(camel_cased_word)
      constantize(camel_cased_word)
    rescue NameError => e
      raise if e.name && !(camel_cased_word.to_s.split("::").include?(e.name.to_s) ||
        e.name.to_s == camel_cased_word.to_s)
    rescue LoadError => e
      message = e.respond_to?(:original_message) ? e.original_message : e.message
      raise unless /Unable to autoload constant #{const_regexp(camel_cased_word)}/.match?(message)
    end

    # Returns the suffix that should be added to a number to denote the position
    # in an ordered sequence such as 1st, 2nd, 3rd, 4th.
    #
    #   ordinal(1)     # => "st"
    #   ordinal(2)     # => "nd"
    #   ordinal(1002)  # => "nd"
    #   ordinal(1003)  # => "rd"
    #   ordinal(-11)   # => "th"
    #   ordinal(-1021) # => "st"
    def ordinal(number)
      I18n.translate("number.nth.ordinals", number: number)
    end

    # Turns a number into an ordinal string used to denote the position in an
    # ordered sequence such as 1st, 2nd, 3rd, 4th.
    #
    #   ordinalize(1)     # => "1st"
    #   ordinalize(2)     # => "2nd"
    #   ordinalize(1002)  # => "1002nd"
    #   ordinalize(1003)  # => "1003rd"
    #   ordinalize(-11)   # => "-11th"
    #   ordinalize(-1021) # => "-1021st"
    def ordinalize(number)
      I18n.translate("number.nth.ordinalized", number: number)
    end

    private
      # Mounts a regular expression, returned as a string to ease interpolation,
      # that will match part by part the given constant.
      #
      #   const_regexp("Foo::Bar::Baz") # => "Foo(::Bar(::Baz)?)?"
      #   const_regexp("::")            # => "::"
      def const_regexp(camel_cased_word)
        parts = camel_cased_word.split("::")

        return Regexp.escape(camel_cased_word) if parts.blank?

        last = parts.pop

        parts.reverse!.inject(last) do |acc, part|
          part.empty? ? acc : "#{part}(::#{acc})?"
        end
      end

      # Applies inflection rules for +singularize+ and +pluralize+.
      #
      # If passed an optional +locale+ parameter, the uncountables will be
      # found for that locale.
      #
      #   apply_inflections('post', inflections.plurals, :en)    # => "posts"
      #   apply_inflections('posts', inflections.singulars, :en) # => "post"
      def apply_inflections(word, rules, locale = :en)
        result = word.to_s.dup

        if word.empty? || inflections(locale).uncountables.uncountable?(result)
          result
        else
          rules.each { |(rule, replacement)| break if result.sub!(rule, replacement) }
          result
        end
      end
  end
end
