require File.expand_path('../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Try do
    describe 'Try' do
      XCODE_PROJECT = Pod::Command::Try::TRY_TMP_DIR + 'Project.xcodeproj'
      XCODE_WORKSPACE = Pod::Command::Try::TRY_TMP_DIR + 'Project.xcworkspace'

      it 'registers it self' do
        Command.parse(%w(try)).should.be.instance_of Command::Try
      end

      it 'presents the help if no name is provided' do
        command = Pod::Command.parse(['try'])
        should.raise CLAide::Help do
          command.validate!
        end.message.should.match(/A Pod name or URL is required/)
      end

      it 'presents the help if name and podspec name is provided' do
        command = Pod::Command.parse(%w(try ARAnalytics --podspec_name=Analytics.podspec))
        should.raise CLAide::Help do
          command.validate!
        end.message.should.match(/Podspec name can only be used with a Git URL/)
      end

      before do
        @original_install_method = method = Pod::Command::Try.instance_method(:install_pod)
        Pod::Command::Try.send(:define_method, :install_pod) do |*args|
          dir = method.bind(self).call(*args)
          FileUtils.mkdir_p(dir)
          dir
        end
      end

      after do
        Pod::Command::Try.send(:define_method, :install_pod, @original_install_method)
      end

      it 'allows the user to try the Pod with the given name' do
        command = Pod::Command.parse(%w(try ARAnalytics))
        Installer::PodSourceInstaller.any_instance.expects(:install!)
        command.expects(:update_specs_repos)
        command.expects(:pick_demo_project).returns(XCODE_PROJECT)
        command.expects(:open_project).with(XCODE_PROJECT)
        command.run
      end

      it 'allows the user to try the Pod with the given Git URL' do
        require 'cocoapods-downloader/git'
        Pod::Downloader::Git.any_instance.expects(:download)
        spec_file = Pod::Command::Try::TRY_TMP_DIR + 'ARAnalytics/ARAnalytics.podspec'
        Pathname.stubs(:glob).once.returns([spec_file])
        stub_spec = stub(:name => 'ARAnalytics')
        Pod::Specification.stubs(:from_file).with(spec_file).returns(stub_spec)

        command = Pod::Command.parse(['try', 'https://github.com/orta/ARAnalytics.git'])
        Installer::PodSourceInstaller.any_instance.expects(:install!)
        command.expects(:update_specs_repos).never
        command.expects(:pick_demo_project).returns(XCODE_PROJECT)
        command.expects(:open_project).with(XCODE_PROJECT)
        command.run
      end

      describe 'updates of the spec repos' do
        it 'updates the spec repos by default' do
          command = Pod::Command.parse(%w(try ARAnalytics))
          Installer::PodSourceInstaller.any_instance.expects(:install!)
          command.config.sources_manager.expects(:update)
          command.expects(:pick_demo_project).returns(XCODE_PROJECT)
          command.expects(:open_project).with(XCODE_PROJECT)
          command.run
        end

        it "doesn't update the spec repos if that option was given" do
          command = Pod::Command.parse(%w(try ARAnalytics --no-repo-update))
          Installer::PodSourceInstaller.any_instance.expects(:install!)
          command.config.sources_manager.expects(:update).never
          command.expects(:pick_demo_project).returns(XCODE_PROJECT)
          command.expects(:open_project).with(XCODE_PROJECT)
          command.run
        end
      end
    end

    describe 'Helpers' do
      before do
        @sut = Pod::Command.parse(['try'])
      end

      it 'returns the spec with the given name' do
        spec = @sut.spec_with_name('ARAnalytics')
        spec.name.should == 'ARAnalytics'
      end

      describe '#spec_at_url' do
        it 'returns a spec for an https git repo' do
          require 'cocoapods-downloader/git'
          Pod::Downloader::Git.any_instance.expects(:download)
          spec_file = Pod::Command::Try::TRY_TMP_DIR + 'ARAnalytics/ARAnalytics.podspec'
          Pathname.stubs(:glob).once.returns([spec_file])
          stub_spec = stub
          Pod::Specification.stubs(:from_file).with(spec_file).returns(stub_spec)
          spec = @sut.spec_with_url('https://github.com/orta/ARAnalytics.git')
          spec.should == stub_spec
        end

        it 'returns a spec for an https git repo with podspec_name option' do
          require 'cocoapods-downloader/git'
          Pod::Downloader::Git.any_instance.expects(:download)
          spec_file = Pod::Command::Try::TRY_TMP_DIR + 'ARAnalytics/Analytics.podspec'
          Pathname.stubs(:glob).once.returns([spec_file])
          stub_spec = stub
          Pod::Specification.stubs(:from_file).with(spec_file).returns(stub_spec)
          spec = @sut.spec_with_url('https://github.com/orta/ARAnalytics.git', 'Analytics')
          spec.should == stub_spec
        end
      end

      it 'installs the pod' do
        Installer::PodSourceInstaller.any_instance.expects(:install!)
        spec = stub(:name => 'ARAnalytics')
        sandbox_root = Pathname.new(Pod::Command::Try::TRY_TMP_DIR)
        sandbox = Sandbox.new(sandbox_root)
        path = @sut.install_pod(spec, sandbox)
        path.should == sandbox.root + 'ARAnalytics'
      end

      it 'installs the pod on older versions of CocoaPods' do
        @sut.stubs(:cocoapods_version).returns(Pod::Version.new('1.7.0'))
        spec = stub(:name => 'ARAnalytics')
        sandbox_root = Pathname.new(Pod::Command::Try::TRY_TMP_DIR)
        sandbox = Sandbox.new(sandbox_root)
        installer = stub('Installer')
        installer.stubs(:install!)
        Pod::Installer::PodSourceInstaller.expects(:new).with(any_parameters) do |*args|
          args.size == 3
        end.returns(installer).once
        @sut.install_pod(spec, sandbox)

        @sut.stubs(:cocoapods_version).returns(Pod::Version.new('1.8.0'))
        Pod::Installer::PodSourceInstaller.expects(:new).with(any_parameters) do |*args|
          args.size == 4
        end.returns(installer)
        @sut.install_pod(spec, sandbox)
      end

      describe '#pick_demo_project' do
        it 'raises if no demo project could be found' do
          @sut.stubs(:projects_in_dir).returns([])
          should.raise Informative do
            @sut.pick_demo_project('.')
          end.message.should.match(/Unable to find any project/)
        end

        it 'picks a demo project' do
          projects = ['Demo.xcodeproj']
          Dir.stubs(:glob).returns(projects)
          path = @sut.pick_demo_project('.')
          path.should == 'Demo.xcodeproj'
        end

        it 'is not case sensitive' do
          projects = ['demo.xcodeproj']
          Dir.stubs(:glob).returns(projects)
          path = @sut.pick_demo_project('.')
          path.should == 'demo.xcodeproj'
        end

        it 'considers also projects named example' do
          projects = ['Example.xcodeproj']
          Dir.stubs(:glob).returns(projects)
          path = @sut.pick_demo_project('.')
          path.should == 'Example.xcodeproj'
        end

        it 'returns the project if only one is found' do
          projects = [Pathname.new('Lib.xcodeproj')]
          @sut.stubs(:projects_in_dir).returns(projects)
          path = @sut.pick_demo_project('.')
          path.to_s.should == 'Lib.xcodeproj'
        end

        it 'asks the user which project would like to open if not a single suitable one is found' do
          projects = ['Lib_1.xcodeproj', 'Lib_2.xcodeproj']
          @sut.stubs(:projects_in_dir).returns(projects)
          UI.stubs(:choose_from_array).returns(0)
          path = @sut.pick_demo_project('.')
          path.to_s.should == 'Lib_1.xcodeproj'

          UI.stubs(:choose_from_array).returns(1)
          path = @sut.pick_demo_project('.')
          path.to_s.should == 'Lib_2.xcodeproj'
        end

        it 'should prefer demo or example workspaces' do
          @sut.stubs(:projects_in_dir).returns(['Project Demo.xcodeproj', 'Project Demo.xcworkspace'])
          path = @sut.pick_demo_project('.')
          path.should == 'Project Demo.xcworkspace'
        end

        it 'should not show workspaces inside a project' do
          Dir.stubs(:glob).returns(['Project Demo.xcodeproj', 'Project Demo.xcodeproj/project.xcworkspace'])
          path = @sut.pick_demo_project('.')
          path.should == 'Project Demo.xcodeproj'
        end

        it 'should prefer workspaces over projects with the same name' do
          @sut.stubs(:projects_in_dir).returns(['Project Demo.xcodeproj', 'Project Demo.xcworkspace'])
          path = @sut.pick_demo_project('.')
          path.should == 'Project Demo.xcworkspace'
        end
      end

      describe '#install_podfile' do
        it 'returns the original project if no Podfile could be found' do
          Pathname.any_instance.stubs(:exist?).returns(false)
          proj = XCODE_PROJECT
          path = @sut.install_podfile(proj)
          path.should == proj
        end

        it 'performs an installation and returns the path of the workspace' do
          Pathname.any_instance.stubs(:exist?).returns(true)
          proj = XCODE_PROJECT
          @sut.expects(:perform_cocoapods_installation)
          Podfile.stubs(:from_file).returns(stub('Workspace', :workspace_path => XCODE_WORKSPACE))
          path = @sut.install_podfile(proj)
          path.to_s.should == XCODE_WORKSPACE.to_s
        end

        it 'returns the default workspace if one is not set' do
          Pathname.any_instance.stubs(:exist?).returns(true)
          proj = XCODE_PROJECT
          Podfile.stubs(:from_file).returns(stub('Workspace', :workspace_path => nil))
          @sut.expects(:perform_cocoapods_installation).once
          path = @sut.install_podfile(proj)
          path.to_s.should == XCODE_WORKSPACE.to_s
        end
      end
    end
  end
end
