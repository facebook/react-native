# encoding: utf-8

#-- Bootstrap --------------------------------------------------------------#

desc 'Initializes your working copy to run the specs'
task :bootstrap do
  if system('which bundle')
    title 'Installing gems'
    sh 'bundle install'
  else
    $stderr.puts "\033[0;31m" \
      "[!] Please install the bundler gem manually:\n" \
      '    $ [sudo] gem install bundler'
      "\e[0m"
    exit 1
  end
end

begin
  require "bundler/gem_tasks"
  task :default => :spec

  #-- Specs ------------------------------------------------------------------#

  desc 'Runs all the specs'
  task :spec do
    title 'Running Unit Tests'
    files = FileList['spec/**/*_spec.rb'].shuffle.join(' ')
    sh "bundle exec bacon #{files}"

    title 'Checking code style...'
    Rake::Task['rubocop'].invoke if RUBY_VERSION >= '1.9.3'
  end

  #-- Kick -------------------------------------------------------------------#

  desc 'Automatically run specs for updated files'
  task :kick do
    exec 'bundle exec kicker -c'
  end

  #-- RuboCop ----------------------------------------------------------------#

  if RUBY_VERSION >= '1.9.3'
    require 'rubocop/rake_task'
    RuboCop::RakeTask.new
  end

rescue LoadError => e
  $stderr.puts "\033[0;31m" \
    '[!] Some Rake tasks haven been disabled because the environment' \
    ' couldn’t be loaded. Be sure to run `rake bootstrap` first.' \
    "\e[0m"
  $stderr.puts e.message
  $stderr.puts e.backtrace
  $stderr.puts
end

#-- Helpers ------------------------------------------------------------------#

def title(title)
  cyan_title = "\033[0;36m#{title}\033[0m"
  puts
  puts '-' * 80
  puts cyan_title
  puts '-' * 80
  puts
end
