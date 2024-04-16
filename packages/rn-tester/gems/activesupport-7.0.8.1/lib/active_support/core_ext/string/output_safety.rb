# frozen_string_literal: true

require "erb"
require "active_support/core_ext/module/redefine_method"
require "active_support/multibyte/unicode"

class ERB
  module Util
    HTML_ESCAPE = { "&" => "&amp;",  ">" => "&gt;",   "<" => "&lt;", '"' => "&quot;", "'" => "&#39;" }
    JSON_ESCAPE = { "&" => '\u0026', ">" => '\u003e', "<" => '\u003c', "\u2028" => '\u2028', "\u2029" => '\u2029' }
    HTML_ESCAPE_ONCE_REGEXP = /["><']|&(?!([a-zA-Z]+|(#\d+)|(#[xX][\dA-Fa-f]+));)/
    JSON_ESCAPE_REGEXP = /[\u2028\u2029&><]/u

    # Following XML requirements: https://www.w3.org/TR/REC-xml/#NT-Name
    TAG_NAME_START_REGEXP_SET = "@:A-Z_a-z\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}" \
                                "\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}" \
                                "\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}"
    TAG_NAME_START_REGEXP = /[^#{TAG_NAME_START_REGEXP_SET}]/
    TAG_NAME_FOLLOWING_REGEXP = /[^#{TAG_NAME_START_REGEXP_SET}\-.0-9\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}]/
    TAG_NAME_REPLACEMENT_CHAR = "_"

    # A utility method for escaping HTML tag characters.
    # This method is also aliased as <tt>h</tt>.
    #
    #   puts html_escape('is a > 0 & a < 10?')
    #   # => is a &gt; 0 &amp; a &lt; 10?
    def html_escape(s)
      unwrapped_html_escape(s).html_safe
    end

    silence_redefinition_of_method :h
    alias h html_escape

    module_function :h

    singleton_class.silence_redefinition_of_method :html_escape
    module_function :html_escape

    # HTML escapes strings but doesn't wrap them with an ActiveSupport::SafeBuffer.
    # This method is not for public consumption! Seriously!
    def unwrapped_html_escape(s) # :nodoc:
      s = s.to_s
      if s.html_safe?
        s
      else
        CGI.escapeHTML(ActiveSupport::Multibyte::Unicode.tidy_bytes(s))
      end
    end
    module_function :unwrapped_html_escape

    # A utility method for escaping HTML without affecting existing escaped entities.
    #
    #   html_escape_once('1 < 2 &amp; 3')
    #   # => "1 &lt; 2 &amp; 3"
    #
    #   html_escape_once('&lt;&lt; Accept & Checkout')
    #   # => "&lt;&lt; Accept &amp; Checkout"
    def html_escape_once(s)
      result = ActiveSupport::Multibyte::Unicode.tidy_bytes(s.to_s).gsub(HTML_ESCAPE_ONCE_REGEXP, HTML_ESCAPE)
      s.html_safe? ? result.html_safe : result
    end

    module_function :html_escape_once

    # A utility method for escaping HTML entities in JSON strings. Specifically, the
    # &, > and < characters are replaced with their equivalent unicode escaped form -
    # \u0026, \u003e, and \u003c. The Unicode sequences \u2028 and \u2029 are also
    # escaped as they are treated as newline characters in some JavaScript engines.
    # These sequences have identical meaning as the original characters inside the
    # context of a JSON string, so assuming the input is a valid and well-formed
    # JSON value, the output will have equivalent meaning when parsed:
    #
    #   json = JSON.generate({ name: "</script><script>alert('PWNED!!!')</script>"})
    #   # => "{\"name\":\"</script><script>alert('PWNED!!!')</script>\"}"
    #
    #   json_escape(json)
    #   # => "{\"name\":\"\\u003C/script\\u003E\\u003Cscript\\u003Ealert('PWNED!!!')\\u003C/script\\u003E\"}"
    #
    #   JSON.parse(json) == JSON.parse(json_escape(json))
    #   # => true
    #
    # The intended use case for this method is to escape JSON strings before including
    # them inside a script tag to avoid XSS vulnerability:
    #
    #   <script>
    #     var currentUser = <%= raw json_escape(current_user.to_json) %>;
    #   </script>
    #
    # It is necessary to +raw+ the result of +json_escape+, so that quotation marks
    # don't get converted to <tt>&quot;</tt> entities. +json_escape+ doesn't
    # automatically flag the result as HTML safe, since the raw value is unsafe to
    # use inside HTML attributes.
    #
    # If your JSON is being used downstream for insertion into the DOM, be aware of
    # whether or not it is being inserted via <tt>html()</tt>. Most jQuery plugins do this.
    # If that is the case, be sure to +html_escape+ or +sanitize+ any user-generated
    # content returned by your JSON.
    #
    # If you need to output JSON elsewhere in your HTML, you can just do something
    # like this, as any unsafe characters (including quotation marks) will be
    # automatically escaped for you:
    #
    #   <div data-user-info="<%= current_user.to_json %>">...</div>
    #
    # WARNING: this helper only works with valid JSON. Using this on non-JSON values
    # will open up serious XSS vulnerabilities. For example, if you replace the
    # +current_user.to_json+ in the example above with user input instead, the browser
    # will happily <tt>eval()</tt> that string as JavaScript.
    #
    # The escaping performed in this method is identical to those performed in the
    # Active Support JSON encoder when +ActiveSupport.escape_html_entities_in_json+ is
    # set to true. Because this transformation is idempotent, this helper can be
    # applied even if +ActiveSupport.escape_html_entities_in_json+ is already true.
    #
    # Therefore, when you are unsure if +ActiveSupport.escape_html_entities_in_json+
    # is enabled, or if you are unsure where your JSON string originated from, it
    # is recommended that you always apply this helper (other libraries, such as the
    # JSON gem, do not provide this kind of protection by default; also some gems
    # might override +to_json+ to bypass Active Support's encoder).
    def json_escape(s)
      result = s.to_s.gsub(JSON_ESCAPE_REGEXP, JSON_ESCAPE)
      s.html_safe? ? result.html_safe : result
    end

    module_function :json_escape

    # A utility method for escaping XML names of tags and names of attributes.
    #
    #   xml_name_escape('1 < 2 & 3')
    #   # => "1___2___3"
    #
    # It follows the requirements of the specification: https://www.w3.org/TR/REC-xml/#NT-Name
    def xml_name_escape(name)
      name = name.to_s
      return "" if name.blank?

      starting_char = name[0].gsub(TAG_NAME_START_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      return starting_char if name.size == 1

      following_chars = name[1..-1].gsub(TAG_NAME_FOLLOWING_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      starting_char + following_chars
    end
    module_function :xml_name_escape
  end
end

class Object
  def html_safe?
    false
  end
end

class Numeric
  def html_safe?
    true
  end
end

module ActiveSupport # :nodoc:
  class SafeBuffer < String
    UNSAFE_STRING_METHODS = %w(
      capitalize chomp chop delete delete_prefix delete_suffix
      downcase lstrip next reverse rstrip scrub slice squeeze strip
      succ swapcase tr tr_s unicode_normalize upcase
    )

    UNSAFE_STRING_METHODS_WITH_BACKREF = %w(gsub sub)

    alias_method :original_concat, :concat
    private :original_concat

    # Raised when ActiveSupport::SafeBuffer#safe_concat is called on unsafe buffers.
    class SafeConcatError < StandardError
      def initialize
        super "Could not concatenate to the buffer because it is not html safe."
      end
    end

    def [](*args)
      if html_safe?
        new_string = super

        return unless new_string

        new_safe_buffer = new_string.is_a?(SafeBuffer) ? new_string : SafeBuffer.new(new_string)
        new_safe_buffer.instance_variable_set :@html_safe, true
        new_safe_buffer
      else
        to_str[*args]
      end
    end

    def safe_concat(value)
      raise SafeConcatError unless html_safe?
      original_concat(value)
    end

    def initialize(str = "")
      @html_safe = true
      super
    end

    def initialize_copy(other)
      super
      @html_safe = other.html_safe?
    end

    def clone_empty
      self[0, 0]
    end

    def concat(value)
      unless value.nil?
        super(implicit_html_escape_interpolated_argument(value))
      end
      self
    end
    alias << concat

    def bytesplice(*args, value)
      super(*args, implicit_html_escape_interpolated_argument(value))
    end

    def insert(index, value)
      super(index, implicit_html_escape_interpolated_argument(value))
    end

    def prepend(value)
      super(implicit_html_escape_interpolated_argument(value))
    end

    def replace(value)
      super(implicit_html_escape_interpolated_argument(value))
    end

    def []=(*args)
      if args.length == 3
        super(args[0], args[1], implicit_html_escape_interpolated_argument(args[2]))
      else
        super(args[0], implicit_html_escape_interpolated_argument(args[1]))
      end
    end

    def +(other)
      dup.concat(other)
    end

    def *(*)
      new_string = super
      new_safe_buffer = new_string.is_a?(SafeBuffer) ? new_string : SafeBuffer.new(new_string)
      new_safe_buffer.instance_variable_set(:@html_safe, @html_safe)
      new_safe_buffer
    end

    def %(args)
      case args
      when Hash
        escaped_args = args.transform_values { |arg| explicit_html_escape_interpolated_argument(arg) }
      else
        escaped_args = Array(args).map { |arg| explicit_html_escape_interpolated_argument(arg) }
      end

      self.class.new(super(escaped_args))
    end

    def html_safe?
      defined?(@html_safe) && @html_safe
    end

    def to_s
      self
    end

    def to_param
      to_str
    end

    def encode_with(coder)
      coder.represent_object nil, to_str
    end

    UNSAFE_STRING_METHODS.each do |unsafe_method|
      if unsafe_method.respond_to?(unsafe_method)
        class_eval <<-EOT, __FILE__, __LINE__ + 1
          def #{unsafe_method}(*args, &block)       # def capitalize(*args, &block)
            to_str.#{unsafe_method}(*args, &block)  #   to_str.capitalize(*args, &block)
          end                                       # end

          def #{unsafe_method}!(*args)              # def capitalize!(*args)
            @html_safe = false                      #   @html_safe = false
            super                                   #   super
          end                                       # end
        EOT
      end
    end

    UNSAFE_STRING_METHODS_WITH_BACKREF.each do |unsafe_method|
      class_eval <<-EOT, __FILE__, __LINE__ + 1
        def #{unsafe_method}(*args, &block)             # def gsub(*args, &block)
          if block                                      #   if block
            to_str.#{unsafe_method}(*args) { |*params|  #     to_str.gsub(*args) { |*params|
              set_block_back_references(block, $~)      #       set_block_back_references(block, $~)
              block.call(*params)                       #       block.call(*params)
            }                                           #     }
          else                                          #   else
            to_str.#{unsafe_method}(*args)              #     to_str.gsub(*args)
          end                                           #   end
        end                                             # end

        def #{unsafe_method}!(*args, &block)            # def gsub!(*args, &block)
          @html_safe = false                            #   @html_safe = false
          if block                                      #   if block
            super(*args) { |*params|                    #     super(*args) { |*params|
              set_block_back_references(block, $~)      #       set_block_back_references(block, $~)
              block.call(*params)                       #       block.call(*params)
            }                                           #     }
          else                                          #   else
            super                                       #     super
          end                                           #   end
        end                                             # end
      EOT
    end

    private
      def explicit_html_escape_interpolated_argument(arg)
        (!html_safe? || arg.html_safe?) ? arg : CGI.escapeHTML(arg.to_s)
      end

      def implicit_html_escape_interpolated_argument(arg)
        if !html_safe? || arg.html_safe?
          arg
        else
          arg_string = begin
            arg.to_str
          rescue NoMethodError => error
            if error.name == :to_str
              str = arg.to_s
              ActiveSupport::Deprecation.warn <<~MSG.squish
                Implicit conversion of #{arg.class} into String by ActiveSupport::SafeBuffer
                is deprecated and will be removed in Rails 7.1.
                You must explicitly cast it to a String.
              MSG
              str
            else
              raise
            end
          end
          CGI.escapeHTML(arg_string)
        end
      end

      def set_block_back_references(block, match_data)
        block.binding.eval("proc { |m| $~ = m }").call(match_data)
      rescue ArgumentError
        # Can't create binding from C level Proc
      end
  end
end

class String
  # Marks a string as trusted safe. It will be inserted into HTML with no
  # additional escaping performed. It is your responsibility to ensure that the
  # string contains no malicious content. This method is equivalent to the
  # +raw+ helper in views. It is recommended that you use +sanitize+ instead of
  # this method. It should never be called on user input.
  def html_safe
    ActiveSupport::SafeBuffer.new(self)
  end
end
