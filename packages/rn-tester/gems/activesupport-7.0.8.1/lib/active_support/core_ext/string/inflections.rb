# frozen_string_literal: true

require "active_support/inflector/methods"
require "active_support/inflector/transliterate"

# String inflections define new methods on the String class to transform names for different purposes.
# For instance, you can figure out the name of a table from the name of a class.
#
#   'ScaleScore'.tableize # => "scale_scores"
#
class String
  # Returns the plural form of the word in the string.
  #
  # If the optional parameter +count+ is specified,
  # the singular form will be returned if <tt>count == 1</tt>.
  # For any other value of +count+ the plural will be returned.
  #
  # If the optional parameter +locale+ is specified,
  # the word will be pluralized as a word of that language.
  # By default, this parameter is set to <tt>:en</tt>.
  # You must define your own inflection rules for languages other than English.
  #
  #   'post'.pluralize             # => "posts"
  #   'octopus'.pluralize          # => "octopi"
  #   'sheep'.pluralize            # => "sheep"
  #   'words'.pluralize            # => "words"
  #   'the blue mailman'.pluralize # => "the blue mailmen"
  #   'CamelOctopus'.pluralize     # => "CamelOctopi"
  #   'apple'.pluralize(1)         # => "apple"
  #   'apple'.pluralize(2)         # => "apples"
  #   'ley'.pluralize(:es)         # => "leyes"
  #   'ley'.pluralize(1, :es)      # => "ley"
  #
  # See ActiveSupport::Inflector.pluralize.
  def pluralize(count = nil, locale = :en)
    locale = count if count.is_a?(Symbol)
    if count == 1
      dup
    else
      ActiveSupport::Inflector.pluralize(self, locale)
    end
  end

  # The reverse of +pluralize+, returns the singular form of a word in a string.
  #
  # If the optional parameter +locale+ is specified,
  # the word will be singularized as a word of that language.
  # By default, this parameter is set to <tt>:en</tt>.
  # You must define your own inflection rules for languages other than English.
  #
  #   'posts'.singularize            # => "post"
  #   'octopi'.singularize           # => "octopus"
  #   'sheep'.singularize            # => "sheep"
  #   'word'.singularize             # => "word"
  #   'the blue mailmen'.singularize # => "the blue mailman"
  #   'CamelOctopi'.singularize      # => "CamelOctopus"
  #   'leyes'.singularize(:es)       # => "ley"
  #
  # See ActiveSupport::Inflector.singularize.
  def singularize(locale = :en)
    ActiveSupport::Inflector.singularize(self, locale)
  end

  # +constantize+ tries to find a declared constant with the name specified
  # in the string. It raises a NameError when the name is not in CamelCase
  # or is not initialized.
  #
  #   'Module'.constantize  # => Module
  #   'Class'.constantize   # => Class
  #   'blargle'.constantize # => NameError: wrong constant name blargle
  #
  # See ActiveSupport::Inflector.constantize.
  def constantize
    ActiveSupport::Inflector.constantize(self)
  end

  # +safe_constantize+ tries to find a declared constant with the name specified
  # in the string. It returns +nil+ when the name is not in CamelCase
  # or is not initialized.
  #
  #   'Module'.safe_constantize  # => Module
  #   'Class'.safe_constantize   # => Class
  #   'blargle'.safe_constantize # => nil
  #
  # See ActiveSupport::Inflector.safe_constantize.
  def safe_constantize
    ActiveSupport::Inflector.safe_constantize(self)
  end

  # By default, +camelize+ converts strings to UpperCamelCase. If the argument to camelize
  # is set to <tt>:lower</tt> then camelize produces lowerCamelCase.
  #
  # +camelize+ will also convert '/' to '::' which is useful for converting paths to namespaces.
  #
  #   'active_record'.camelize                # => "ActiveRecord"
  #   'active_record'.camelize(:lower)        # => "activeRecord"
  #   'active_record/errors'.camelize         # => "ActiveRecord::Errors"
  #   'active_record/errors'.camelize(:lower) # => "activeRecord::Errors"
  #
  # See ActiveSupport::Inflector.camelize.
  def camelize(first_letter = :upper)
    case first_letter
    when :upper
      ActiveSupport::Inflector.camelize(self, true)
    when :lower
      ActiveSupport::Inflector.camelize(self, false)
    else
      raise ArgumentError, "Invalid option, use either :upper or :lower."
    end
  end
  alias_method :camelcase, :camelize

  # Capitalizes all the words and replaces some characters in the string to create
  # a nicer looking title. +titleize+ is meant for creating pretty output. It is not
  # used in the Rails internals.
  #
  # The trailing '_id','Id'.. can be kept and capitalized by setting the
  # optional parameter +keep_id_suffix+ to true.
  # By default, this parameter is false.
  #
  #   'man from the boondocks'.titleize                       # => "Man From The Boondocks"
  #   'x-men: the last stand'.titleize                        # => "X Men: The Last Stand"
  #   'string_ending_with_id'.titleize(keep_id_suffix: true)  # => "String Ending With Id"
  #
  # See ActiveSupport::Inflector.titleize.
  def titleize(keep_id_suffix: false)
    ActiveSupport::Inflector.titleize(self, keep_id_suffix: keep_id_suffix)
  end
  alias_method :titlecase, :titleize

  # The reverse of +camelize+. Makes an underscored, lowercase form from the expression in the string.
  #
  # +underscore+ will also change '::' to '/' to convert namespaces to paths.
  #
  #   'ActiveModel'.underscore         # => "active_model"
  #   'ActiveModel::Errors'.underscore # => "active_model/errors"
  #
  # See ActiveSupport::Inflector.underscore.
  def underscore
    ActiveSupport::Inflector.underscore(self)
  end

  # Replaces underscores with dashes in the string.
  #
  #   'puni_puni'.dasherize # => "puni-puni"
  #
  # See ActiveSupport::Inflector.dasherize.
  def dasherize
    ActiveSupport::Inflector.dasherize(self)
  end

  # Removes the module part from the constant expression in the string.
  #
  #   'ActiveSupport::Inflector::Inflections'.demodulize # => "Inflections"
  #   'Inflections'.demodulize                           # => "Inflections"
  #   '::Inflections'.demodulize                         # => "Inflections"
  #   ''.demodulize                                      # => ''
  #
  # See ActiveSupport::Inflector.demodulize.
  #
  # See also +deconstantize+.
  def demodulize
    ActiveSupport::Inflector.demodulize(self)
  end

  # Removes the rightmost segment from the constant expression in the string.
  #
  #   'Net::HTTP'.deconstantize   # => "Net"
  #   '::Net::HTTP'.deconstantize # => "::Net"
  #   'String'.deconstantize      # => ""
  #   '::String'.deconstantize    # => ""
  #   ''.deconstantize            # => ""
  #
  # See ActiveSupport::Inflector.deconstantize.
  #
  # See also +demodulize+.
  def deconstantize
    ActiveSupport::Inflector.deconstantize(self)
  end

  # Replaces special characters in a string so that it may be used as part of a 'pretty' URL.
  #
  # If the optional parameter +locale+ is specified,
  # the word will be parameterized as a word of that language.
  # By default, this parameter is set to <tt>nil</tt> and it will use
  # the configured <tt>I18n.locale</tt>.
  #
  #   class Person
  #     def to_param
  #       "#{id}-#{name.parameterize}"
  #     end
  #   end
  #
  #   @person = Person.find(1)
  #   # => #<Person id: 1, name: "Donald E. Knuth">
  #
  #   <%= link_to(@person.name, person_path) %>
  #   # => <a href="/person/1-donald-e-knuth">Donald E. Knuth</a>
  #
  # To preserve the case of the characters in a string, use the +preserve_case+ argument.
  #
  #   class Person
  #     def to_param
  #       "#{id}-#{name.parameterize(preserve_case: true)}"
  #     end
  #   end
  #
  #   @person = Person.find(1)
  #   # => #<Person id: 1, name: "Donald E. Knuth">
  #
  #   <%= link_to(@person.name, person_path) %>
  #   # => <a href="/person/1-Donald-E-Knuth">Donald E. Knuth</a>
  #
  # See ActiveSupport::Inflector.parameterize.
  def parameterize(separator: "-", preserve_case: false, locale: nil)
    ActiveSupport::Inflector.parameterize(self, separator: separator, preserve_case: preserve_case, locale: locale)
  end

  # Creates the name of a table like Rails does for models to table names. This method
  # uses the +pluralize+ method on the last word in the string.
  #
  #   'RawScaledScorer'.tableize # => "raw_scaled_scorers"
  #   'ham_and_egg'.tableize     # => "ham_and_eggs"
  #   'fancyCategory'.tableize   # => "fancy_categories"
  #
  # See ActiveSupport::Inflector.tableize.
  def tableize
    ActiveSupport::Inflector.tableize(self)
  end

  # Creates a class name from a plural table name like Rails does for table names to models.
  # Note that this returns a string and not a class. (To convert to an actual class
  # follow +classify+ with +constantize+.)
  #
  #   'ham_and_eggs'.classify # => "HamAndEgg"
  #   'posts'.classify        # => "Post"
  #
  # See ActiveSupport::Inflector.classify.
  def classify
    ActiveSupport::Inflector.classify(self)
  end

  # Capitalizes the first word, turns underscores into spaces, and (by default)strips a
  # trailing '_id' if present.
  # Like +titleize+, this is meant for creating pretty output.
  #
  # The capitalization of the first word can be turned off by setting the
  # optional parameter +capitalize+ to false.
  # By default, this parameter is true.
  #
  # The trailing '_id' can be kept and capitalized by setting the
  # optional parameter +keep_id_suffix+ to true.
  # By default, this parameter is false.
  #
  #   'employee_salary'.humanize                    # => "Employee salary"
  #   'author_id'.humanize                          # => "Author"
  #   'author_id'.humanize(capitalize: false)       # => "author"
  #   '_id'.humanize                                # => "Id"
  #   'author_id'.humanize(keep_id_suffix: true)    # => "Author id"
  #
  # See ActiveSupport::Inflector.humanize.
  def humanize(capitalize: true, keep_id_suffix: false)
    ActiveSupport::Inflector.humanize(self, capitalize: capitalize, keep_id_suffix: keep_id_suffix)
  end

  # Converts just the first character to uppercase.
  #
  #   'what a Lovely Day'.upcase_first # => "What a Lovely Day"
  #   'w'.upcase_first                 # => "W"
  #   ''.upcase_first                  # => ""
  #
  # See ActiveSupport::Inflector.upcase_first.
  def upcase_first
    ActiveSupport::Inflector.upcase_first(self)
  end

  # Creates a foreign key name from a class name.
  # +separate_class_name_and_id_with_underscore+ sets whether
  # the method should put '_' between the name and 'id'.
  #
  #   'Message'.foreign_key        # => "message_id"
  #   'Message'.foreign_key(false) # => "messageid"
  #   'Admin::Post'.foreign_key    # => "post_id"
  #
  # See ActiveSupport::Inflector.foreign_key.
  def foreign_key(separate_class_name_and_id_with_underscore = true)
    ActiveSupport::Inflector.foreign_key(self, separate_class_name_and_id_with_underscore)
  end
end
