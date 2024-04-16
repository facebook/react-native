require 'active_support/multibyte/unicode'
require 'find'

module Pod
  class Sandbox
    # The PathList class is designed to perform multiple glob matches against
    # a given directory. Basically, it generates a list of all the children
    # paths and matches the globs patterns against them, resulting in just one
    # access to the file system.
    #
    # @note   A PathList once it has generated the list of the paths this is
    #         updated only if explicitly requested by calling
    #         {#read_file_system}
    #
    class PathList
      # @return [Pathname] The root of the list whose files and directories
      #         are used to perform the matching operations.
      #
      attr_reader :root

      # Initialize a new instance
      #
      # @param  [Pathname] root @see #root
      #
      def initialize(root)
        root_dir = root.to_s.unicode_normalize(:nfkc)
        @root = Pathname.new(root_dir)
        @glob_cache = {}
      end

      # @return [Array<String>] The list of absolute the path of all the files
      #         contained in {root}.
      #
      def files
        read_file_system unless @files
        @files
      end

      # @return [Array<String>] The list of absolute the path of all the
      #         directories contained in {root}.
      #
      def dirs
        read_file_system unless @dirs
        @dirs
      end

      # @return [void] Reads the file system and populates the files and paths
      #         lists.
      #
      def read_file_system
        unless root.exist?
          raise Informative, "Attempt to read non existent folder `#{root}`."
        end
        dirs = []
        files = []
        root_length = root.cleanpath.to_s.length + File::SEPARATOR.length
        escaped_root = escape_path_for_glob(root)
        Dir.glob(escaped_root + '**/*', File::FNM_DOTMATCH).each do |f|
          directory = File.directory?(f)
          # Ignore `.` and `..` directories
          next if directory && f =~ /\.\.?$/

          f = f.slice(root_length, f.length - root_length)
          next if f.nil?

          (directory ? dirs : files) << f
        end

        dirs.sort_by!(&:upcase)
        files.sort_by!(&:upcase)

        @dirs = dirs
        @files = files
        @glob_cache = {}
      end

      #-----------------------------------------------------------------------#

      public

      # @!group Globbing

      # Similar to {glob} but returns the absolute paths.
      #
      # @param  [String,Array<String>] patterns
      #         @see #relative_glob
      #
      # @param  [Hash] options
      #         @see #relative_glob
      #
      # @return [Array<Pathname>]
      #
      def glob(patterns, options = {})
        cache_key = options.merge(:patterns => patterns)
        @glob_cache[cache_key] ||= relative_glob(patterns, options).map { |p| root.join(p) }
      end

      # The list of relative paths that are case insensitively matched by a
      # given pattern. This method emulates {Dir#glob} with the
      # {File::FNM_CASEFOLD} option.
      #
      # @param  [String,Array<String>] patterns
      #         A single {Dir#glob} like pattern, or a list of patterns.
      #
      # @param  [Hash] options
      #
      # @option options [String] :dir_pattern
      #         An optional pattern to append to a pattern, if it is the path
      #         to a directory.
      #
      # @option options [Array<String>] :exclude_patterns
      #         Exclude specific paths given by those patterns.
      #
      # @option options [Array<String>] :include_dirs
      #         Additional paths to take into account for matching.
      #
      # @return [Array<Pathname>]
      #
      def relative_glob(patterns, options = {})
        return [] if patterns.empty?

        dir_pattern = options[:dir_pattern]
        exclude_patterns = options[:exclude_patterns]
        include_dirs = options[:include_dirs]

        if include_dirs
          full_list = files + dirs
        else
          full_list = files
        end
        patterns_array = Array(patterns)
        exact_matches = (full_list & patterns_array).to_set

        unless patterns_array.empty?
          list = patterns_array.flat_map do |pattern|
            if exact_matches.include?(pattern)
              pattern
            else
              if directory?(pattern) && dir_pattern
                pattern += '/' unless pattern.end_with?('/')
                pattern += dir_pattern
              end
              expanded_patterns = dir_glob_equivalent_patterns(pattern)
              full_list.select do |path|
                expanded_patterns.any? do |p|
                  File.fnmatch(p, path, File::FNM_CASEFOLD | File::FNM_PATHNAME)
                end
              end
            end
          end
        end

        list = list.map { |path| Pathname.new(path) }
        if exclude_patterns
          exclude_options = { :dir_pattern => '**/*', :include_dirs => include_dirs }
          list -= relative_glob(exclude_patterns, exclude_options)
        end
        list
      end

      #-----------------------------------------------------------------------#

      private

      # @!group Private helpers

      # @return [Boolean] Wether a path is a directory. The result of this method
      #         computed without accessing the file system and is case
      #         insensitive.
      #
      # @param  [String, Pathname] sub_path The path that could be a directory.
      #
      def directory?(sub_path)
        sub_path = sub_path.to_s.downcase.sub(/\/$/, '')
        dirs.any? { |dir| dir.downcase == sub_path }
      end

      # @return [Array<String>] An array of patterns converted from a
      #         {Dir.glob} pattern to patterns that {File.fnmatch} can handle.
      #         This is used by the {#relative_glob} method to emulate
      #         {Dir.glob}.
      #
      #   The expansion provides support for:
      #
      #   - Literals
      #
      #       dir_glob_equivalent_patterns('{file1,file2}.{h,m}')
      #       => ["file1.h", "file1.m", "file2.h", "file2.m"]
      #
      #   - Matching the direct children of a directory with `**`
      #
      #       dir_glob_equivalent_patterns('Classes/**/file.m')
      #       => ["Classes/**/file.m", "Classes/file.m"]
      #
      # @param [String] pattern   A {Dir#glob} like pattern.
      #
      def dir_glob_equivalent_patterns(pattern)
        pattern = pattern.gsub('/**/', '{/**/,/}')
        values_by_set = {}
        pattern.scan(/\{[^}]*\}/) do |set|
          values = set.gsub(/[{}]/, '').split(',')
          values_by_set[set] = values
        end

        if values_by_set.empty?
          [pattern]
        else
          patterns = [pattern]
          values_by_set.each do |set, values|
            patterns = patterns.flat_map do |old_pattern|
              values.map do |value|
                old_pattern.gsub(set, value)
              end
            end
          end
          patterns
        end
      end

      # Escapes the glob metacharacters from a given path so it can used in
      # Dir#glob and similar methods.
      #
      # @note   See CocoaPods/CocoaPods#862.
      #
      # @param  [String, Pathname] path
      #         The path to escape.
      #
      # @return [Pathname] The escaped path.
      #
      def escape_path_for_glob(path)
        result = path.to_s
        characters_to_escape = ['[', ']', '{', '}', '?', '*']
        characters_to_escape.each do |character|
          result.gsub!(character, "\\#{character}")
        end
        Pathname.new(result)
      end

      #-----------------------------------------------------------------------#
    end
  end
end
