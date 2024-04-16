module Pod
  class Sandbox
    class PodspecFinder
      attr_reader :root

      def initialize(root)
        @root = root
      end

      def podspecs
        return @specs_by_name if @specs_by_name
        @specs_by_name = {}
        spec_files = Pathname.glob(root + '{,*}.podspec{,.json}')
        spec_files.sort_by { |p| -p.to_path.split(File::SEPARATOR).size }.each do |file|
          spec = Specification.from_file(file)
          spec.validate_cocoapods_version
          @specs_by_name[spec.name] = spec
        end
        @specs_by_name
      end
    end
  end
end
