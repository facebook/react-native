# frozen_string_literal: true

module MachO
  # A collection of convenient methods for common operations on Mach-O and Fat
  # binaries.
  module Tools
    # @param filename [String] the Mach-O or Fat binary being read
    # @return [Array<String>] an array of all dylibs linked to the binary
    def self.dylibs(filename)
      file = MachO.open(filename)

      file.linked_dylibs
    end

    # Changes the dylib ID of a Mach-O or Fat binary, overwriting the source
    #  file.
    # @param filename [String] the Mach-O or Fat binary being modified
    # @param new_id [String] the new dylib ID for the binary
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if the change cannot be performed
    # @return [void]
    def self.change_dylib_id(filename, new_id, options = {})
      file = MachO.open(filename)

      file.change_dylib_id(new_id, options)
      file.write!
    end

    # Changes a shared library install name in a Mach-O or Fat binary,
    #  overwriting the source file.
    # @param filename [String] the Mach-O or Fat binary being modified
    # @param old_name [String] the old shared library name
    # @param new_name [String] the new shared library name
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if the change cannot be performed
    # @return [void]
    def self.change_install_name(filename, old_name, new_name, options = {})
      file = MachO.open(filename)

      file.change_install_name(old_name, new_name, options)
      file.write!
    end

    # Changes a runtime path in a Mach-O or Fat binary, overwriting the source
    #  file.
    # @param filename [String] the Mach-O or Fat binary being modified
    # @param old_path [String] the old runtime path
    # @param new_path [String] the new runtime path
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if the change cannot be performed
    # @return [void]
    def self.change_rpath(filename, old_path, new_path, options = {})
      file = MachO.open(filename)

      file.change_rpath(old_path, new_path, options)
      file.write!
    end

    # Add a runtime path to a Mach-O or Fat binary, overwriting the source file.
    # @param filename [String] the Mach-O or Fat binary being modified
    # @param new_path [String] the new runtime path
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if the change cannot be performed
    # @return [void]
    def self.add_rpath(filename, new_path, options = {})
      file = MachO.open(filename)

      file.add_rpath(new_path, options)
      file.write!
    end

    # Delete a runtime path from a Mach-O or Fat binary, overwriting the source
    #  file.
    # @param filename [String] the Mach-O or Fat binary being modified
    # @param old_path [String] the old runtime path
    # @param options [Hash]
    # @option options [Boolean] :strict (true) whether or not to fail loudly
    #  with an exception if the change cannot be performed
    # @return [void]
    def self.delete_rpath(filename, old_path, options = {})
      file = MachO.open(filename)

      file.delete_rpath(old_path, options)
      file.write!
    end

    # Merge multiple Mach-Os into one universal (Fat) binary.
    # @param filename [String] the fat binary to create
    # @param files [Array<String>] the files to merge
    # @param fat64 [Boolean] whether to use {Headers::FatArch64}s to represent each slice
    # @return [void]
    def self.merge_machos(filename, *files, fat64: false)
      machos = files.map do |file|
        macho = MachO.open(file)
        case macho
        when MachO::MachOFile
          macho
        else
          macho.machos
        end
      end.flatten

      fat_macho = MachO::FatFile.new_from_machos(*machos, :fat64 => fat64)
      fat_macho.write(filename)
    end
  end
end
