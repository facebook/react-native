# frozen_string_literal: true

module Nanaimo
  class Writer
    # Transforms native ruby objects or Plist objects into their XML Plist
    # string representation.
    #
    class XMLWriter < Writer
      autoload :Base64, 'base64'
      autoload :Date, 'date'
      autoload :DateTime, 'date'

      def write
        write_xml_header
        write_object(@plist.root_object)
        write_newline
        write_xml_footer
      end

      private

      def plist_format
        :xml
      end

      def write_object(object)
        case object
        when Float, Integer
          write_number(object)
        when Time, Date, DateTime
          write_date(object)
        when true, false
          write_boolean(object)
        else
          super
        end
      end

      def write_xml_header
        output << <<-EOS
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
        EOS
      end

      def write_xml_footer
        output << <<-EOS
</plist>
        EOS
      end

      def write_annotation(_)
      end

      def write_number(object)
        type = object.integer? ? 'integer' : 'real'
        output << "<#{type}>#{object}</#{type}>"
      end

      def write_boolean(object)
        output << "<#{object}/>"
      end

      def write_date(object)
        output << '<date>' << object.iso8601 << '</date>'
      end

      def write_string(object)
        output << '<string>' << Unicode.xml_escape_string(value_for(object)) << '</string>'
      end

      def write_quoted_string(object)
        write_string(object)
      end

      def write_data(object)
        output << '<data>'
        data = Base64.encode64(value_for(object)).delete("\n")
        data = data.scan(/.{1,76}/).join("\n") if pretty
        output << data << '</data>'
      end

      def write_array(object)
        return output << '<array/>' if value_for(object).empty?
        super
      end

      def write_array_start
        output << '<array>'
        write_newline if newlines
        push_indent!
      end

      def write_array_end
        pop_indent!
        write_indent
        output << '</array>'
      end

      def write_array_element(object)
        write_indent
        write_object(object)
        write_newline
      end

      def write_dictionary(object)
        object = value_for(object)
        return output << '<dict/>' if object.empty?
        keys = object.keys.sort_by(&:to_s)
        object = keys.each_with_object({}) do |key, hash|
          hash[key.to_s] = object[key]
        end
        super(object)
      end

      def write_dictionary_start
        output << '<dict>'
        write_newline if newlines
        push_indent!
      end

      def write_dictionary_end
        pop_indent!
        write_indent
        output << '</dict>'
      end

      def write_dictionary_key_value_pair(key, value)
        write_indent
        output << '<key>' << Unicode.xml_escape_string(value_for(key)) << '</key>'
        write_newline
        write_indent
        write_object(value)
        write_newline
      end
    end
  end
end
