module Pod
  class Sandbox
    class PodDirCleaner
      attr_reader :root
      attr_reader :specs_by_platform

      def initialize(root, specs_by_platform)
        @root = root
        @specs_by_platform = specs_by_platform
      end

      # Removes all the files not needed for the installation according to the
      # specs by platform.
      #
      # @return [void]
      #
      def clean!
        clean_paths.each { |path| FileUtils.rm_rf(path) } if root.exist?
      end

      private

      # @return [Array<Sandbox::FileAccessor>] the file accessors for all the
      #         specifications on their respective platform.
      #
      def file_accessors
        @file_accessors ||= specs_by_platform.flat_map do |platform, specs|
          specs.flat_map { |spec| Sandbox::FileAccessor.new(path_list, spec.consumer(platform)) }
        end
      end

      # @return [Sandbox::PathList] The path list for this Pod.
      #
      def path_list
        @path_list ||= Sandbox::PathList.new(root)
      end

      # Finds the absolute paths, including hidden ones, of the files
      # that are not used by the pod and thus can be safely deleted.
      #
      # @note   Implementation detail: Don't use `Dir#glob` as there is an
      #         unexplained issue (#568, #572 and #602).
      #
      # @todo   The paths are down-cased for the comparison as issues similar
      #         to #602 lead the files not being matched and so cleaning all
      #         the files. This solution might create side effects.
      #
      # @return [Array<Strings>] The paths that can be deleted.
      #
      def clean_paths
        cached_used = used_files.map(&:downcase)
        glob_options = File::FNM_DOTMATCH | File::FNM_CASEFOLD
        files = Pathname.glob(root + '**/*', glob_options).map(&:to_s)
        cached_used_set = cached_used.to_set
        files.reject do |candidate|
          candidate = candidate.downcase
          candidate.end_with?('.', '..') || cached_used_set.include?(candidate) || cached_used.any? do |path|
            path.include?(candidate) || candidate.include?(path)
          end
        end
      end

      # @return [Array<String>] The absolute path of all the files used by the
      #         specifications (according to their platform) of this Pod.
      #
      def used_files
        FileAccessor.all_files(file_accessors).map(&:to_s)
      end
    end
  end
end
