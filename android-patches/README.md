This is out of data .. TBD.

#### For command line options, try

> node_modules\.bin\ts-node.cmd src\index.ts --help

###### For detailed options on each commands,

> node_modules\.bin\ts-node.cmd src\index.ts diff --help
> node_modules\.bin\ts-node.cmd src\index.ts patch --help

##### Examples

###### To create diff-patches

> ts-node.cmd src\index.ts diff e:\github\ms-react-native-forpatch e:\github\fb-react-native-forpatch-base

###### To apply diff-patches

> node_modules\.bin\ts-node.cmd src\index.ts patch E:\github\fb-rn-p BuildAndThirdPartyFixes V8Integration --patch-store E:\github\office-android-patches\patches-droid-office-grouped

###### To reverse-patch the dirty fork

> node_modules\.bin\ts-node src\index.ts patch E:\github\ms-react-native-forpatch BuildAndThirdPartyFixes --patch-store E:\github\office-android-patches\patches-droid-office-grouped --reverse
