autoload :Nanaimo, 'nanaimo'
autoload :CFPropertyList, 'cfpropertylist'

module Xcodeproj
  # Provides support for loading and serializing property list files.
  #
  module Plist
    # @return [Hash] Returns the native objects loaded from a property list
    #         file.
    #
    # @param  [#to_s] path
    #         The path of the file.
    #
    def self.read_from_path(path)
      path = path.to_s
      unless File.exist?(path)
        raise Informative, "The plist file at path `#{path}` doesn't exist."
      end
      contents = File.read(path)
      if file_in_conflict?(contents)
        raise Informative, "The file `#{path}` is in a merge conflict."
      end
      case Nanaimo::Reader.plist_type(contents)
      when :xml, :binary
        CFPropertyList.native_types(CFPropertyList::List.new(:data => contents).value)
      else
        Nanaimo::Reader.new(contents).parse!.as_ruby
      end
    end

    # Serializes a hash as an XML property list file.
    #
    # @param  [#to_hash] hash
    #         The hash to store.
    #
    # @param  [#to_s] path
    #         The path of the file.
    #
    def self.write_to_path(hash, path)
      if hash.respond_to?(:to_hash)
        hash = hash.to_hash
      else
        raise TypeError, "The given `#{hash.inspect}` must respond " \
                          "to #to_hash'."
      end

      unless path.is_a?(String) || path.is_a?(Pathname)
        raise TypeError, "The given `#{path}` must be a string or 'pathname'."
      end
      path = path.to_s
      raise IOError, 'Empty path.' if path.empty?

      File.open(path, 'w') do |f|
        plist = Nanaimo::Plist.new(hash, :xml)
        Nanaimo::Writer::XMLWriter.new(plist, :pretty => true, :output => f, :strict => false).write
      end
    end

    # The known modules that can serialize plists.
    #
    KNOWN_IMPLEMENTATIONS = []

    class << self
      # @deprecated This method will be removed in 2.0
      #
      # @return [Nil]
      #
      attr_accessor :implementation
    end

    # @deprecated This method will be removed in 2.0
    #
    # @return [Nil]
    #
    def self.autoload_implementation
    end

    # @return [Bool] Checks whether there are merge conflicts in the file.
    #
    # @param  [#to_s] contents
    #         The contents of the file.
    #
    def self.file_in_conflict?(contents)
      conflict_regex = /
        ^<{7}(?!<) # Exactly 7 left arrows at the beginning of the line
        [\w\W]* # Anything
        ^={7}(?!=) # Exactly 7 equality symbols at the beginning of the line
        [\w\W]* # Anything
        ^>{7}(?!>) # Exactly 7 right arrows at the beginning of the line
      /xm
      contents.match(conflict_regex)
    end
  end
end
