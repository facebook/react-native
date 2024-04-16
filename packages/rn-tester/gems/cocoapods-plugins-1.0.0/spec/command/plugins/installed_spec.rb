require File.expand_path('../../../spec_helper', __FILE__)

# The CocoaPods namespace
#
module Pod
  describe Command::Plugins::Installed do
    extend SpecHelper::PluginsStubs

    def stub_plugins(plugins_and_hooks)
      specs = []
      registrations = {}
      plugins_and_hooks.each do |(plugin_name, hooks)|
        # Load Plugin GemSpec
        fixture_path = fixture("#{plugin_name}.gemspec")
        specs.push Gem::Specification.load(fixture_path.to_s)
        # Fill hook registrations hash
        Array(hooks).each do |hook_name|
          registrations[hook_name] ||= []
          hook = Pod::HooksManager::Hook.new(hook_name, plugin_name, {})
          registrations[hook_name] << hook
        end
      end

      Pod::HooksManager.stubs(:registrations).returns(registrations)
      CLAide::Command::PluginManager.stubs(:specifications).returns(specs)
    end

    before do
      UI.output = ''
    end

    it 'registers itself' do
      Command.parse(%w(plugins installed)).
        should.be.instance_of Command::Plugins::Installed
    end

    #--- Output printing

    describe 'Compact List' do
      before do
        @command = Pod::Command::Plugins::Installed.new CLAide::ARGV.new([])
      end

      it 'no hooks' do
        stub_plugins('cocoapods-foo1' => nil, 'cocoapods-foo2' => nil)

        @command.run
        UI.output.should.include('   - cocoapods-foo1 : 2.0.1')
        UI.output.should.include('   - cocoapods-foo2 : 2.0.2')
        UI.output.should.not.include('pre_install')
        UI.output.should.not.include('post_install')
      end

      it 'one hook' do
        stub_plugins(
          'cocoapods-foo1' => :pre_install,
          'cocoapods-foo2' => :post_install,
        )

        @command.run
        UI.output.should.include('   - cocoapods-foo1 : 2.0.1 ' \
          '(pre_install hook)')
        UI.output.should.include('   - cocoapods-foo2 : 2.0.2 ' \
          '(post_install hook)')
      end

      it 'two hooks' do
        stub_plugins('cocoapods-foo1' => [:pre_install, :post_install])

        @command.run
        UI.output.should.include(' - cocoapods-foo1 : 2.0.1 ' \
          '(pre_install and post_install hooks)')
      end
    end

    describe 'Verbose List' do
      before do
        verbose_args = CLAide::ARGV.new(['--verbose'])
        @command = Pod::Command::Plugins::Installed.new verbose_args
      end

      it 'no hooks' do
        stub_plugins('cocoapods-foo1' => nil, 'cocoapods-foo2' => nil)

        @command.run

        UI.output.should.include <<FOO1
cocoapods-foo1\e[0m
    - Version:  2.0.1
    - Homepage: https://github.com/proper-man/cocoapods-foo1
    - Summary:  Gem Summary 1
FOO1
        UI.output.should.include <<FOO2
cocoapods-foo2\e[0m
    - Version:  2.0.2
    - Homepage: https://github.com/proper-man/cocoapods-foo2
FOO2
      end

      it 'one hook' do
        stub_plugins(
          'cocoapods-foo1' => :pre_install,
          'cocoapods-foo2' => :post_install,
        )

        @command.run
        UI.output.should.include <<FOO1
cocoapods-foo1\e[0m
    - Version:  2.0.1
    - Hooks:
      - pre_install
    - Homepage: https://github.com/proper-man/cocoapods-foo1
    - Summary:  Gem Summary 1
FOO1
        UI.output.should.include <<FOO2
cocoapods-foo2\e[0m
    - Version:  2.0.2
    - Hooks:
      - post_install
    - Homepage: https://github.com/proper-man/cocoapods-foo2
FOO2
      end

      it 'two hooks' do
        stub_plugins('cocoapods-foo1' => [:pre_install, :post_install])

        @command.run
        UI.output.should.include <<FOO1
cocoapods-foo1\e[0m
    - Version:  2.0.1
    - Hooks:
      - pre_install
      - post_install
    - Homepage: https://github.com/proper-man/cocoapods-foo1
    - Summary:  Gem Summary 1
FOO1
      end
    end
  end
end
