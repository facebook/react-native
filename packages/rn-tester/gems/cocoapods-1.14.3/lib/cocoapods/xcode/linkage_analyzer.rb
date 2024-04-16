require 'macho'

module Pod
  module Xcode
    class LinkageAnalyzer
      # @param  [Pathname] binary
      #         The file to be checked for being a dynamic Mach-O binary.
      #
      # @return [Boolean] Whether `binary` can be dynamically linked.
      #
      def self.dynamic_binary?(binary)
        @cached_dynamic_binary_results ||= {}
        return @cached_dynamic_binary_results[binary] unless @cached_dynamic_binary_results[binary].nil?
        return false unless binary.file?

        @cached_dynamic_binary_results[binary] = MachO.open(binary).dylib?
      rescue MachO::MachOError
        @cached_dynamic_binary_results[binary] = false
      end
    end
  end
end
