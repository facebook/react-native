
## Configuration

`app.plist` define user-specific configuration.

There are 2 options:

### Option 1: development server

Start the server from the repository root:

```
$ npm start
```

To run on device, edit `app.plist`'s `devServer` field and change `localhost` to the IP address of your computer
(you can get this by typing `ifconfig` into the terminal and selecting the
`inet` value under `en0:`) and make sure your computer and iOS device are
on the same Wi-Fi network.

### Option 2: bundled

To re-generate the static bundle
from the root of your project directory, run

```
$ react-native bundle --minify
```

see http://facebook.github.io/react-native/docs/runningondevice.html

Then, remove `devServer` field from the `app.plist`.
