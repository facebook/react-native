require File.expand_path('../../spec_helper', __FILE__)

module Pod
  describe Command::Search do
    extend SpecHelper::TemporaryRepos

    describe 'Search' do
      it 'registers it self' do
        Command.parse(%w{ search }).should.be.instance_of Command::Search
      end

      it 'runs with correct parameters' do
        lambda { run_command('search', 'JSON') }.should.not.raise
        lambda { run_command('search', 'JSON', '--simple') }.should.not.raise
      end

      it 'complains for wrong parameters' do
        lambda { run_command('search') }.should.raise CLAide::Help
        lambda { run_command('search', 'too', '--wrong') }.should.raise CLAide::Help
        lambda { run_command('search', '--wrong') }.should.raise CLAide::Help
      end

      it 'searches for a pod with name matching the given query ignoring case' do
        output = run_command('search', 'json', '--simple')
        output.should.include? 'JSONKit'
      end

      it 'searches for a pod with name, summary, or description matching the given query ignoring case' do
        output = run_command('search', 'engelhart')
        output.should.include? 'JSONKit'
      end

      it 'searches for a pod with name, summary, or description matching the given multi-word query ignoring case' do
        output = run_command('search', 'very', 'high', 'performance')
        output.should.include? 'JSONKit'
      end

      it 'prints search results in order' do
        output = run_command('search', 'lib')
        output.should.match /BananaLib.*JSONKit/m
      end

      it 'restricts the search to Pods supported on iOS' do
        output = run_command('search', 'BananaLib', '--ios')
        output.should.include? 'BananaLib'
        Specification.any_instance.stubs(:available_platforms).returns([Platform.osx])
        output = run_command('search', 'BananaLib', '--ios')
        output.should.not.include? 'BananaLib'
      end

      it 'restricts the search to Pods supported on OS X' do
        output = run_command('search', 'BananaLib', '--osx')
        output.should.not.include? 'BananaLib'
      end

      it 'restricts the search to Pods supported on Watch OS' do
        output = run_command('search', 'a', '--watchos')
        output.should.include? 'Realm'
        output.should.not.include? 'BananaLib'
      end

      it 'restricts the search to Pods supported on tvOS' do
        output = run_command('search', 'n', '--tvos')
        output.should.include? 'monkey'
        output.should.not.include? 'BananaLib'
      end

      it 'outputs with the silent parameter' do
        output = run_command('search', 'BananaLib', '--silent')
        output.should.include? 'BananaLib'
      end

      it 'shows a friendly message when locally searching with invalid regex' do
        lambda { run_command('search', '--regex', '+') }.should.raise CLAide::Help
      end

      it 'does not try to validate the query as a regex with plain-text search' do
        lambda { run_command('search', '+') }.should.not.raise CLAide::Help
      end

      it 'uses regex search when asked for regex mode' do
        output = run_command('search', '--regex', 'Ba(na)+Lib')
        output.should.include? 'BananaLib'
        output.should.not.include? 'Pod+With+Plus+Signs'
        output.should.not.include? 'JSONKit'
      end

      it 'uses plain-text search when not asked for regex mode' do
        output = run_command('search', 'Pod+With+Plus+Signs')
        output.should.include? 'Pod+With+Plus+Signs'
        output.should.not.include? 'BananaLib'
      end
    end

    describe 'option --web' do
      extend SpecHelper::TemporaryRepos

      it 'searches with invalid regex' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=NSAttributedString%2BCCLFormat'])
        run_command('search', '--web', 'NSAttributedString+CCLFormat')
      end

      it 'should url encode search queries' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=NSAttributedString%2BCCLFormat'])
        run_command('search', '--web', 'NSAttributedString+CCLFormat')
      end

      it 'searches the web via the open! command' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=bananalib'])
        run_command('search', '--web', 'bananalib')
      end

      it 'includes option --osx correctly' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Aosx%20bananalib'])
        run_command('search', '--web', '--osx', 'bananalib')
      end

      it 'includes option --ios correctly' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Aios%20bananalib'])
        run_command('search', '--web', '--ios', 'bananalib')
      end

      it 'includes option --watchos correctly' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Awatchos%20bananalib'])
        run_command('search', '--web', '--watchos', 'bananalib')
      end

      it 'includes option --tvos correctly' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Atvos%20bananalib'])
        run_command('search', '--web', '--tvos', 'bananalib')
      end

      it 'includes any new platform option correctly' do
        Platform.stubs(:all).returns([Platform.ios, Platform.tvos, Platform.new('whateveros')])
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Awhateveros%20bananalib'])
        run_command('search', '--web', '--whateveros', 'bananalib')
      end

      it 'does not matter in which order the ios/osx options are set' do
        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Aios%20on%3Aosx%20bananalib'])
        run_command('search', '--web', '--ios', '--osx', 'bananalib')

        Executable.expects(:execute_command).with(:open, ['https://cocoapods.org/?q=on%3Aios%20on%3Aosx%20bananalib'])
        run_command('search', '--web', '--osx', '--ios', 'bananalib')
      end
    end
  end
end
