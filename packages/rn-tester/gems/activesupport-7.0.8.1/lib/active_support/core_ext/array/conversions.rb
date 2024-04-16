# frozen_string_literal: true

require "active_support/core_ext/hash/keys"
require "active_support/core_ext/string/inflections"
require "active_support/core_ext/object/to_param"
require "active_support/core_ext/object/to_query"

class Array
  # Converts the array to a comma-separated sentence where the last element is
  # joined by the connector word.
  #
  # You can pass the following options to change the default behavior. If you
  # pass an option key that doesn't exist in the list below, it will raise an
  # <tt>ArgumentError</tt>.
  #
  # ==== Options
  #
  # * <tt>:words_connector</tt> - The sign or word used to join all but the last
  #   element in arrays with three or more elements (default: ", ").
  # * <tt>:last_word_connector</tt> - The sign or word used to join the last element
  #   in arrays with three or more elements (default: ", and ").
  # * <tt>:two_words_connector</tt> - The sign or word used to join the elements
  #   in arrays with two elements (default: " and ").
  # * <tt>:locale</tt> - If +i18n+ is available, you can set a locale and use
  #   the connector options defined on the 'support.array' namespace in the
  #   corresponding dictionary file.
  #
  # ==== Examples
  #
  #   [].to_sentence                      # => ""
  #   ['one'].to_sentence                 # => "one"
  #   ['one', 'two'].to_sentence          # => "one and two"
  #   ['one', 'two', 'three'].to_sentence # => "one, two, and three"
  #
  #   ['one', 'two'].to_sentence(passing: 'invalid option')
  #   # => ArgumentError: Unknown key: :passing. Valid keys are: :words_connector, :two_words_connector, :last_word_connector, :locale
  #
  #   ['one', 'two'].to_sentence(two_words_connector: '-')
  #   # => "one-two"
  #
  #   ['one', 'two', 'three'].to_sentence(words_connector: ' or ', last_word_connector: ' or at least ')
  #   # => "one or two or at least three"
  #
  # Using <tt>:locale</tt> option:
  #
  #   # Given this locale dictionary:
  #   #
  #   #   es:
  #   #     support:
  #   #       array:
  #   #         words_connector: " o "
  #   #         two_words_connector: " y "
  #   #         last_word_connector: " o al menos "
  #
  #   ['uno', 'dos'].to_sentence(locale: :es)
  #   # => "uno y dos"
  #
  #   ['uno', 'dos', 'tres'].to_sentence(locale: :es)
  #   # => "uno o dos o al menos tres"
  def to_sentence(options = {})
    options.assert_valid_keys(:words_connector, :two_words_connector, :last_word_connector, :locale)

    default_connectors = {
      words_connector: ", ",
      two_words_connector: " and ",
      last_word_connector: ", and "
    }
    if options[:locale] != false && defined?(I18n)
      i18n_connectors = I18n.translate(:'support.array', locale: options[:locale], default: {})
      default_connectors.merge!(i18n_connectors)
    end
    options = default_connectors.merge!(options)

    case length
    when 0
      +""
    when 1
      +"#{self[0]}"
    when 2
      +"#{self[0]}#{options[:two_words_connector]}#{self[1]}"
    else
      +"#{self[0...-1].join(options[:words_connector])}#{options[:last_word_connector]}#{self[-1]}"
    end
  end

  # Extends <tt>Array#to_s</tt> to convert a collection of elements into a
  # comma separated id list if <tt>:db</tt> argument is given as the format.
  #
  # This method is aliased to <tt>to_formatted_s</tt>.
  #
  #   Blog.all.to_fs(:db)  # => "1,2,3"
  #   Blog.none.to_fs(:db) # => "null"
  #   [1,2].to_fs          # => "[1, 2]"
  def to_fs(format = :default)
    case format
    when :db
      if empty?
        "null"
      else
        collect(&:id).join(",")
      end
    else
      to_default_s
    end
  end
  alias_method :to_formatted_s, :to_fs
  alias_method :to_default_s, :to_s

  # Returns a string that represents the array in XML by invoking +to_xml+
  # on each element. Active Record collections delegate their representation
  # in XML to this method.
  #
  # All elements are expected to respond to +to_xml+, if any of them does
  # not then an exception is raised.
  #
  # The root node reflects the class name of the first element in plural
  # if all elements belong to the same type and that's not Hash:
  #
  #   customer.projects.to_xml
  #
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <projects type="array">
  #     <project>
  #       <amount type="decimal">20000.0</amount>
  #       <customer-id type="integer">1567</customer-id>
  #       <deal-date type="date">2008-04-09</deal-date>
  #       ...
  #     </project>
  #     <project>
  #       <amount type="decimal">57230.0</amount>
  #       <customer-id type="integer">1567</customer-id>
  #       <deal-date type="date">2008-04-15</deal-date>
  #       ...
  #     </project>
  #   </projects>
  #
  # Otherwise the root element is "objects":
  #
  #   [{ foo: 1, bar: 2}, { baz: 3}].to_xml
  #
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <objects type="array">
  #     <object>
  #       <bar type="integer">2</bar>
  #       <foo type="integer">1</foo>
  #     </object>
  #     <object>
  #       <baz type="integer">3</baz>
  #     </object>
  #   </objects>
  #
  # If the collection is empty the root element is "nil-classes" by default:
  #
  #   [].to_xml
  #
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <nil-classes type="array"/>
  #
  # To ensure a meaningful root element use the <tt>:root</tt> option:
  #
  #   customer_with_no_projects.projects.to_xml(root: 'projects')
  #
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <projects type="array"/>
  #
  # By default name of the node for the children of root is <tt>root.singularize</tt>.
  # You can change it with the <tt>:children</tt> option.
  #
  # The +options+ hash is passed downwards:
  #
  #   Message.all.to_xml(skip_types: true)
  #
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <messages>
  #     <message>
  #       <created-at>2008-03-07T09:58:18+01:00</created-at>
  #       <id>1</id>
  #       <name>1</name>
  #       <updated-at>2008-03-07T09:58:18+01:00</updated-at>
  #       <user-id>1</user-id>
  #     </message>
  #   </messages>
  #
  def to_xml(options = {})
    require "active_support/builder" unless defined?(Builder::XmlMarkup)

    options = options.dup
    options[:indent]  ||= 2
    options[:builder] ||= Builder::XmlMarkup.new(indent: options[:indent])
    options[:root]    ||= \
      if first.class != Hash && all?(first.class)
        underscored = ActiveSupport::Inflector.underscore(first.class.name)
        ActiveSupport::Inflector.pluralize(underscored).tr("/", "_")
      else
        "objects"
      end

    builder = options[:builder]
    builder.instruct! unless options.delete(:skip_instruct)

    root = ActiveSupport::XmlMini.rename_key(options[:root].to_s, options)
    children = options.delete(:children) || root.singularize
    attributes = options[:skip_types] ? {} : { type: "array" }

    if empty?
      builder.tag!(root, attributes)
    else
      builder.tag!(root, attributes) do
        each { |value| ActiveSupport::XmlMini.to_tag(children, value, options) }
        yield builder if block_given?
      end
    end
  end
end
