require 'cocoapods-core/podfile'

module Pod
  class Podfile
    autoload :InstallationOptions, 'cocoapods/installer/installation_options'

    # @return [Pod::Installer::InstallationOptions] the installation options specified in the Podfile
    #
    def installation_options
      @installation_options ||= Pod::Installer::InstallationOptions.from_podfile(self)
    end
  end
end
