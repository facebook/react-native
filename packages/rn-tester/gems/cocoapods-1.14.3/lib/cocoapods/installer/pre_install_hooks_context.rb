module Pod
  class Installer
    # Context object designed to be used with the HooksManager which describes
    # the context of the installer before analysis has been completed.
    #
    class PreInstallHooksContext
      # @return [Podfile] The Podfile for the project.
      #
      attr_reader :podfile

      # @return [Sandbox] The Sandbox for the project.
      #
      attr_reader :sandbox

      # @return [String] The path to the sandbox root (`Pods` directory).
      #
      attr_reader :sandbox_root

      # @return [Lockfile] The Lockfile for the project.
      #
      attr_reader :lockfile

      # Initialize a new instance
      #
      # @param [Sandbox] sandbox see #sandbox
      # @param [String] sandbox_root see #sandbox_root
      # @param [Podfile] podfile see #podfile
      # @param [Lockfile] lockfile see #lockfile
      #
      def initialize(podfile, sandbox, sandbox_root, lockfile)
        @podfile = podfile
        @sandbox = sandbox
        @sandbox_root = sandbox_root
        @lockfile = lockfile
      end

      # @param  [Sandbox] sandbox see {#sandbox}
      #
      # @param  [Podfile] podfile see {#podfile}
      #
      # @param  [Lockfile] lockfile see {#lockfile}
      #
      # @return [PreInstallHooksContext] Convenience class method to generate the
      #         static context.
      #
      def self.generate(sandbox, podfile, lockfile)
        new(podfile, sandbox, sandbox.root.to_s, lockfile)
      end
    end
  end
end
