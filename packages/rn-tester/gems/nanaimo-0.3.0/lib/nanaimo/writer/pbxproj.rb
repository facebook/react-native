# frozen_string_literal: true

module Nanaimo
  class Writer
    # Transforms native ruby objects or Plist objects into their ASCII Plist
    # string representation, formatted as Xcode writes Xcode projects.
    #
    class PBXProjWriter < Writer
      ISA = String.new('isa', '')
      private_constant :ISA

      def initialize(plist, **args)
        super(plist, **args)
        @objects_section = false
      end

      private

      def write_dictionary(object)
        n = newlines
        @newlines = false if flat_dictionary?(object)
        return super(sort_dictionary(object)) unless @objects_section
        @objects_section = false
        write_dictionary_start
        value = value_for(object)
        objects_by_isa = value.group_by { |_k, v| isa_for(v) }
        objects_by_isa.each do |isa, kvs|
          write_newline
          output << "/* Begin #{isa} section */"
          write_newline
          sort_dictionary(kvs, key_can_be_isa: false).each do |k, v|
            write_dictionary_key_value_pair(k, v)
          end
          output << "/* End #{isa} section */"
          write_newline
        end
        write_dictionary_end
      ensure
        @newlines = n
      end

      def write_dictionary_key_value_pair(k, v)
        # since the objects section is always at the top-level,
        # we can avoid checking if we're starting the 'objects'
        # section if we're further "indented" (aka deeper) in the project
        @objects_section = true if indent == 1 && value_for(k) == 'objects'

        super
      end

      def sort_dictionary(dictionary, key_can_be_isa: true)
        hash = value_for(dictionary)
        hash.sort_by do |k, _v|
          k = value_for(k)
          if key_can_be_isa
            k == 'isa' ? '' : k
          else
            k
          end
        end
      end

      def isa_for(dictionary)
        dictionary = value_for(dictionary)
        return unless dictionary.is_a?(Hash)
        if isa = dictionary['isa']
          value_for(isa)
        elsif isa = dictionary[ISA]
          value_for(isa)
        end
      end

      def flat_dictionary?(dictionary)
        case isa_for(dictionary)
        when 'PBXBuildFile', 'PBXFileReference'
          true
        else
          false
        end
      end
    end
  end
end
