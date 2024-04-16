require File.expand_path('../../../spec_helper', __FILE__)
require 'tmpdir'

module Pod
  describe Command::Trunk::Push do
    def success_json
      {
        'messages' => [
          {
            '2015-12-05 02:00:25 UTC' => "Push for `BananaLib 0.96.3' initiated.",
          },
          {
            '2015-12-05 02:00:26 UTC' => "Push for `BananaLib 0.96.3' has been pushed (1.02409270 s).",
          },
        ],
        'data_url' => 'https://raw.githubusercontent.com/CocoaPods/Specs/ce4efe9f986d297008e8c61010a4b0d5881c50d0/Specs/BananaLib/0.96.3/BananaLib.podspec.json',
      }
    end

    before do
      Command::Trunk::Push.any_instance.stubs(:update_master_repo)
    end

    describe 'CLAide' do
      it 'registers it self' do
        Command.parse(%w( trunk push        )).should.be.instance_of Command::Trunk::Push
      end
    end

    it "should error if we don't have a token" do
      Netrc.any_instance.stubs(:[]).returns(nil)
      command = Command.parse(%w( trunk push ))
      exception = lambda { command.validate! }.should.raise CLAide::Help
      exception.message.should.include 'register a session'
    end

    it 'should error when the trunk service returns an error' do
      url = 'https://trunk.cocoapods.org/api/v1/pods?allow_warnings=false'
      stub_request(:post, url).to_return(:status => 422, :body => {
        'error' => 'The Pod Specification did not pass validation.',
        'data' => {
          'warnings' => [
            'A value for `requires_arc` should be specified until the migration to a `true` default.',
          ],
        },
      }.to_json)
      command = Command.parse(%w(trunk push))
      command.stubs(:validate_podspec)
      command.stubs(:spec).returns(Pod::Specification.new)
      exception = lambda { command.run }.should.raise Informative
      exception.message.should.include 'following validation failed'
      exception.message.should.include 'should be specified'
      exception.message.should.include 'The Pod Specification did not pass validation'
    end

    describe 'PATH' do
      before do
        UI.output = ''
      end
      it 'defaults to the current directory' do
        # Disable the podspec finding algorithm so we can check the raw path
        Command::Trunk::Push.any_instance.stubs(:find_podspec_file) { |path| path }
        command = Command.parse(%w(        trunk push        ))
        command.instance_eval { @path }.should == '.'
      end

      def found_podspec_among_files(files)
        # Create a temp directory with the dummy `files` in it
        Dir.mktmpdir do |dir|
          files.each do |filename|
            path = Pathname(dir) + filename
            File.open(path, 'w') {}
          end
          # Execute `pod trunk push` with this dir as parameter
          command = Command.parse(%w(          trunk push          ) + [dir])
          path = command.instance_eval { @path }
          return File.basename(path) if path
        end
      end

      it 'should find the only JSON podspec in a given directory' do
        files = %w(foo bar.podspec.json baz)
        found_podspec_among_files(files).should == files[1]
      end

      it 'should find the only Ruby podspec in a given directory' do
        files = %w(foo bar.podspec baz)
        found_podspec_among_files(files).should == files[1]
      end

      it 'should warn when no podspec found in a given directory' do
        files = %w(foo bar baz)
        found_podspec_among_files(files).should.nil?
        UI.output.should.match /No podspec found in directory/
      end

      it 'should warn when multiple podspecs found in a given directory' do
        files = %w(foo bar.podspec bar.podspec.json baz)
        found_podspec_among_files(files).should.nil?
        UI.output.should.match /Multiple podspec files in directory/
      end
    end

    describe 'validation' do
      before do
        Installer.any_instance.stubs(:aggregate_targets).returns([])
        Installer.any_instance.stubs(:pod_targets).returns([])

        Validator.any_instance.stubs(:check_file_patterns)
        Validator.any_instance.stubs(:validate_url)
        Validator.any_instance.stubs(:validate_screenshots)
        Validator.any_instance.stubs(:xcodebuild).returns('')
        Validator.any_instance.stubs(:install_pod)
        Validator.any_instance.stubs(:build_pod)
        Validator.any_instance.stubs(:add_app_project_import)
        Validator.any_instance.stubs(:used_swift_version).returns(nil)
        %i(prepare resolve_dependencies download_dependencies write_lockfiles).each do |m|
          Installer.any_instance.stubs(m)
        end
        Command::Trunk::Push.any_instance.stubs(:master_repo_url).
          returns(Pod::TrunkSource::TRUNK_REPO_URL)
      end

      it 'passes the SWIFT_VERSION to the Validator' do
        Validator.any_instance.expects(:swift_version=).with('3.0')

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --swift-version=3.0))
        cmd.send(:validate_podspec)
      end

      it 'passes a swift version back to command, to handle .swift-version files' do
        Validator.any_instance.stubs(:dot_swift_version).returns('1.2.3')
        Validator.any_instance.stubs(:used_swift_version).returns('1.2.3')

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --allow-warnings))
        cmd.send(:validate_podspec)
        cmd.instance_variable_get(:@swift_version).should == '1.2.3'
      end

      it 'validates specs as frameworks by default' do
        Validator.any_instance.expects(:podfile_from_spec).
          with(:ios, '8.0', true, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:osx, nil, true, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:tvos, nil, true, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:watchos, nil, true, [], nil, nil).once.returns(Podfile.new)

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec))
        cmd.send(:validate_podspec)
      end

      it 'validates specs as libraries if requested' do
        Validator.any_instance.expects(:podfile_from_spec).
          with(:ios, nil, false, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:osx, nil, false, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:tvos, nil, false, [], nil, nil).once.returns(Podfile.new)
        Validator.any_instance.expects(:podfile_from_spec).
          with(:watchos, nil, false, [], nil, nil).once.returns(Podfile.new)

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --use-libraries))
        cmd.send(:validate_podspec)
      end

      it 'prints the failure reason' do
        Validator.any_instance.expects(:validated?).returns(false)
        Validator.any_instance.expects(:validate)
        Validator.any_instance.expects(:failure_reason).returns('failure_reason')

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --use-libraries))
        e = should.raise(Informative) { cmd.send(:validate_podspec) }
        e.message.should.include 'The spec did not pass validation, due to failure_reason.'
      end

      it 'passes skip import validation' do
        Validator.any_instance.expects(:skip_import_validation=).with(true)
        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --skip-import-validation))
        cmd.send(:validate_podspec)
      end

      it 'passes skip test' do
        Validator.any_instance.expects(:skip_tests=).with(true)
        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --skip-tests))
        cmd.send(:validate_podspec)
      end

      it 'passes use modular headers' do
        Validator.any_instance.expects(:use_modular_headers=)

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --use-modular-headers))
        cmd.send(:validate_podspec)
      end
    end

    describe 'sending the swift version up to trunk' do
      before do
        # This won't get called
        Command::Trunk::Push.any_instance.unstub(:update_master_repo)
        # For faking the networking when sending
        Pod::Command::Trunk.any_instance.expects(:json).returns({})
        Pod::Command::Trunk.any_instance.expects(:auth_headers).returns({})
      end

      it 'passes the value to trunk' do
        # Fakes for the network response
        response = mock
        response.expects(:headers).returns('location' => ['http://theinternet.com'])
        response.expects(:status_code).returns(200)

        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --swift-version=1.1.2))

        # Using a blank podspec - JSON should include `"pushed_with_swift_version":"1.1.2"`
        cmd.stubs(:spec).returns(Pod::Specification.new)

        json = <<-JSON
{"name":null,"pushed_with_swift_version":"1.1.2","platforms":{"osx":null,"ios":null,"tvos":null,"watchos":null}}
        JSON

        cmd.stubs(:validate_podspec)
        cmd.stubs(:request_url)

        api_route = 'pods?allow_warnings=false'
        cmd.expects(:request_path).with(:post, api_route, json, {}).returns(response)
        cmd.send(:push_to_trunk)
      end
    end

    describe 'updating the master repo' do
      before do
        @cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec))
        @cmd.stubs(:validate_podspec)
        @cmd.stubs(:push_to_trunk).returns([200, success_json])
        Command::Trunk::Push.any_instance.unstub(:update_master_repo)
        Command::Trunk::Push.any_instance.stubs(:master_repo_name).
          returns(Pod::TrunkSource::TRUNK_REPO_NAME)
      end

      it 'updates the master repo when it exists' do
        Config.instance.sources_manager.stubs(:source_with_url).
          at_most(2).
          returns(Pod::TrunkSource.new(Pod::TrunkSource::TRUNK_REPO_NAME))

        Config.instance.sources_manager.expects(:update).with(Pod::TrunkSource::TRUNK_REPO_NAME).twice
        Command::Repo::AddCDN.any_instance.expects(:run).never

        @cmd.run
      end

      it 'sets up the master repo when it does not exist' do
        Config.instance.sources_manager.stubs(:source_with_url).
          at_most(3).
          returns(nil).
          returns(Pod::TrunkSource.new(Pod::TrunkSource::TRUNK_REPO_NAME))
        Config.instance.sources_manager.expects(:update).with(Pod::TrunkSource::TRUNK_REPO_NAME).twice
        Command::Repo::AddCDN.any_instance.expects(:run)

        @cmd.run
      end
    end

    describe 'synchronous updating the git repo' do
      before do
        @cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --synchronous))
        @cmd.stubs(:validate_podspec)
        @cmd.stubs(:push_to_trunk).returns([200, success_json])
        Command::Trunk::Push.any_instance.unstub(:update_master_repo)
        Command::Trunk::Push.any_instance.stubs(:master_repo_name).returns('master')
      end

      it 'updates the git repo when it exists' do
        Config.instance.sources_manager.stubs(:source_with_url).
          at_most(2).
          returns(Pod::TrunkSource.new('master'))

        Config.instance.sources_manager.expects(:update).with('master').twice
        Command::Repo::AddCDN.any_instance.expects(:run).never

        @cmd.run
      end

      it 'sets up the git repo when it does not exist' do
        Config.instance.sources_manager.stubs(:source_with_url).
          at_most(3).
          returns(nil).
          returns(Pod::TrunkSource.new('master'))
        Config.instance.sources_manager.stubs(:cdn_url?).returns(false)
        Config.instance.sources_manager.stubs(:create_source_with_url).once.
          returns(Pod::TrunkSource.new('master'))
        Config.instance.sources_manager.expects(:update).with('master').twice

        @cmd.run
      end
    end

    describe 'Presenting Responses to the user' do
      before do
        Command::Trunk::Push.any_instance.stubs(:update_master_repo)
        Config.instance.sources_manager.stubs(:master_repo_functional?).returns(true)
      end

      it 'shows full logs when verbose' do
        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --verbose))
        cmd.stubs(:validate_podspec)
        cmd.stubs(:push_to_trunk).returns([200, success_json])

        cmd.run
        UI.output.should.match %r{- Data URL: https://raw.githubusercontent.com/CocoaPods/Specs}
      end

      it 'shows full logs when errored' do
        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec --verbose))
        cmd.stubs(:validate_podspec)
        cmd.stubs(:push_to_trunk).returns([400, success_json])

        cmd.run
        UI.output.should.match %r{- Data URL: https://raw.githubusercontent.com/CocoaPods/Specs}
      end

      it 'shows thanks emojis when success' do
        cmd = Command.parse(%w(trunk push spec/fixtures/BananaLib.podspec))
        cmd.stubs(:validate_podspec)
        cmd.stubs(:push_to_trunk).returns([200, success_json])
        cmd.run

        UI.output.should.match %r{https://cocoapods.org/pods/BananaLib}
      end
    end
  end
end
