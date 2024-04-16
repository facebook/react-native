module Pod
  module Generator
    class CopydSYMsScript
      # @return [Array<Pathname, String>] dsym_paths the dSYM paths to include in the script contents.
      #
      attr_reader :dsym_paths

      # @return [Array<Pathname, String>] bcsymbolmap_paths the bcsymbolmap paths to include in the script contents.
      #
      attr_reader :bcsymbolmap_paths

      # Initialize a new instance
      #
      # @param  [Array<Pathname, String>] dsym_paths @see dsym_paths
      # @param  [Array<Pathname, String>] bcsymbolmap_paths @see bcsymbolmap_paths
      #
      def initialize(dsym_paths, bcsymbolmap_paths)
        @dsym_paths = Array(dsym_paths)
        @bcsymbolmap_paths = Array(bcsymbolmap_paths)
      end

      # Saves the copy dSYMs script to the given pathname.
      #
      # @param  [Pathname] pathname
      #         The path where the copy dSYMs script should be saved.
      #
      # @return [void]
      #
      def save_as(pathname)
        pathname.open('w') do |file|
          file.puts(generate)
        end
        File.chmod(0755, pathname.to_s)
      end

      # @return [String] The generated of the copy dSYMs script.
      #
      def generate
        script = <<-SH.strip_heredoc
#{Pod::Generator::ScriptPhaseConstants::DEFAULT_SCRIPT_PHASE_HEADER}
#{Pod::Generator::ScriptPhaseConstants::STRIP_INVALID_ARCHITECTURES_METHOD}
#{Pod::Generator::ScriptPhaseConstants::RSYNC_PROTECT_TMP_FILES}
#{Pod::Generator::ScriptPhaseConstants::INSTALL_DSYM_METHOD}
#{Pod::Generator::ScriptPhaseConstants::INSTALL_BCSYMBOLMAP_METHOD}
        SH
        dsym_paths.each do |dsym_path|
          script << %(install_dsym "#{dsym_path}"\n)
        end
        bcsymbolmap_paths.each do |bcsymbolmap_path|
          script << %(install_bcsymbolmap "#{bcsymbolmap_path}"\n)
        end
        script
      end
    end
  end
end
