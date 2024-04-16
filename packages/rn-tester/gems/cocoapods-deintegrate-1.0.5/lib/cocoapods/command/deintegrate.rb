module Pod
  class Command
    # @CocoaPods 1.0.0.beta.1
    #
    class Deintegrate < Command
      include ProjectDirectory

      self.summary = 'Deintegrate CocoaPods from your project'
      self.description = <<-DESC
        Deintegrate your project from CocoaPods. Removing all traces
        of CocoaPods from your Xcode project.

        If no xcodeproj is specified, then a search for an Xcode project
        will be made in the current directory.
      DESC
      self.arguments = [
        CLAide::Argument.new('XCODE_PROJECT', false),
      ]

      def initialize(argv)
        path = argv.shift_argument
        @project_path = Pathname.new(path) if path
        super
      end

      def validate!
        super

        unless @project_path
          xcodeprojs = Pathname.glob('*.xcodeproj')
          @project_path = xcodeprojs.first if xcodeprojs.size == 1
        end

        help! 'A valid Xcode project file is required.' unless @project_path
        help! "#{@project_path} does not exist." unless @project_path.exist?
        unless @project_path.directory? && (@project_path + 'project.pbxproj').exist?
          help! "#{@project_path} is not a valid Xcode project."
        end

        @project = Xcodeproj::Project.open(@project_path)
      end

      def run
        # We don't traverse a Podfile and try to de-intergrate each target.
        # Instead, we're just deintegrating anything CP could have done to a
        # project. This is so that it will clean stale, and modified projects.
        deintegrator = Deintegrator.new
        deintegrator.deintegrate_project(@project)
        @project.save
      end
    end
  end
end
