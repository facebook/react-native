#!/bin/bash

set -e

echo "Downloading package lists..."
sudo apt-get update -y

if ! [[ -d ~/vendor/apt ]]; then
  mkdir -p ~/vendor/apt
fi

# First check for archives cache
if ! [[ -d ~/vendor/apt/archives ]]; then
  # It doesn't so download the packages
  echo "Downloading build dependencies..."
  sudo apt-get install --download-only ant autoconf automake g++ gcc libqt5widgets5 lib32z1 lib32stdc++6 make maven python-dev python3-dev qml-module-qtquick-controls qtdeclarative5-dev file -y
  # Then move them to our cache directory
  sudo cp -R /var/cache/apt ~/vendor/
  # Making sure our user has ownership, in order to cache
  sudo chown -R ${USER:=$(/usr/bin/id -run)}:$USER ~/vendor/apt
fi

# Install all packages in the cache
echo "Installing build dependencies..."
sudo dpkg -i ~/vendor/apt/archives/*.deb
