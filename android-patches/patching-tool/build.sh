node ./android-patches/bundle/bundle.js patch . BasicBuild RNHostBase V8Integration Focus --patch-store ./android-patches/patches --log-folder ./android-patches/logs --confirm true

mkdir ./nuget-bin/ && curl -o ./nuget-bin/nuget.exe https://dist.nuget.org/win-x86-commandline/latest/nuget.exe

chmod -R +r .

mono ./nuget-bin/nuget.exe restore ./ReactAndroid/packages.config -PackagesDirectory ./ReactAndroid/packages/ -Verbosity Detailed -NonInteractive

yarn install --frozen-lockfile

chmod +x .ado/setup_droid_deps.sh && .ado/setup_droid_deps.sh

export REACT_NATIVE_BOOST_PATH=~/code/rn-macos-fb62merge/build_deps/boost_1_68_0/boost