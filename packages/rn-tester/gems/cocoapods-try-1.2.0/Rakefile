# Bootstrap
#-----------------------------------------------------------------------------#

task :bootstrap, :use_bundle_dir? do |_t, args|
  if system('which bundle')
    if args[:use_bundle_dir?]
      sh 'bundle install --path ./travis_bundle_dir'
    else
      sh 'bundle install'
    end
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
    puts "\033[0;32mUsing #{`ruby --version`}\033[0m"
    start_time = Time.now
    sh "bundle exec bacon #{specs('**')}"
    duration = Time.now - start_time
    puts "Tests completed in #{duration}s"

    Rake::Task['rubocop'].invoke if RUBY_VERSION >= '1.9.3'
  end

  def specs(dir)
    FileList["spec/#{dir}/*_spec.rb"].shuffle.join(' ')
  end

  #-- Rubocop ----------------------------------------------------------------#

  if RUBY_VERSION >= '1.9.3'
    require 'rubocop/rake_task'
    RuboCop::RakeTask.new
  end
rescue LoadError
  $stderr.puts "\033[0;31m" \
    '[!] Some Rake tasks haven been disabled because the environment' \
    ' couldn’t be loaded. Be sure to run `rake bootstrap` first.' \
    "\e[0m"
end
