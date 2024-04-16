# Bootstrap
#-----------------------------------------------------------------------------#

task :bootstrap do
  if system('which bundle')
    sh 'bundle install'
  else
    $stderr.puts "\033[0;31m" \
      "[!] Please install the bundler gem manually:\n" \
      '    $ [sudo] gem install bundler' \
      "\e[0m"
    exit 1
  end
end

begin

  require 'bundler/gem_tasks'

  task :default => 'spec'

  # Spec
  #-----------------------------------------------------------------------------#

  desc 'Runs all the specs'
  task :spec do
    start_time = Time.now
    sh "bundle exec bacon #{specs('**')}"
    duration = Time.now - start_time
    puts "Tests completed in #{duration}s"
    Rake::Task['rubocop'].invoke
    Rake::Task['validate_json'].invoke
  end

  def specs(dir)
    FileList["spec/#{dir}/*_spec.rb"].shuffle.join(' ')
  end

  # Rubocop
  #-----------------------------------------------------------------------------#

  desc 'Checks code style'
  task :rubocop do
    require 'rubocop'
    cli = RuboCop::CLI.new
    result = cli.run(FileList['{spec,lib}/**/*.rb'])
    abort('RuboCop failed!') unless result == 0
  end

  # plugins.json
  #----------------------------------------------------------------------------#

  desc 'Validates plugins.json'
  task :validate_json do
    require 'json'
    require 'pathname'

    puts 'Validating plugins.json'

    json_file = Pathname(__FILE__).parent + 'plugins.json'
    json = json_file.read
    plugins = JSON.load(json)
    abort('Invalid JSON in plugins.json') unless plugins
    keys = %w(gem name author social_media_url url description)
    optional_keys = %w(social_media_url)
    errors = plugins['plugins'].reduce([]) do |errors, plugin|
      extra_keys = plugin.keys - keys
      unless extra_keys.empty?
        errors << "plugin `#{plugin['name']}` has extra keys #{extra_keys}"
      end
      (keys - optional_keys).each do |key|
        unless plugin[key]
          errors << "plugin `#{plugin['name']}` is missing key `#{key}`"
        end
      end
      errors
    end
    unless errors.empty?
      abort("Invalid plugins.json:\n\n#{errors.join("\n")}")
    end
  end

rescue LoadError
  $stderr.puts "\033[0;31m" \
    '[!] Some Rake tasks haven been disabled because the environment' \
    ' couldn’t be loaded. Be sure to run `rake bootstrap` first.' \
    "\e[0m"
end
