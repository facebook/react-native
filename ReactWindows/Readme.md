# Building React Native for Windows

This guide contains instructions for building the UWP code for React Native

## Supported Operating Systems

This setup has only been tested on Windows 10 so far. The target environment is for a Windows Phone UWP app.  

## Prerequisites

Assuming you have [Visual Studio Community 2015](https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx) installed, you will also need to have Windows 10 SDK installed. 

Clone this repo onto your local machine.
```
git clone https://github.com/CatalystCode/react-native.git
cd react-native
git checkout ReactWindows
git checkout -b "YOUR PERSONAL BRANCH"
```

Build your environment :

- Open up the ReactNative solution file in Visual Studio Enterprise. The solution file can be found in {CWD}/ReactWindows/ReactNative.sln.
- If this is your first time using UWP, you will have to install the SDK. Right click on the solution file in the solution explorer and select the option labeled "Install Missing Components". You'll likely have to shutdown visual studio to continue the installation.
- You can start building the solution once all the packges are installed Build->Rebuild Solution. 

Unit Tests:

- Open up the Test Explorer Tests->Windows->Test Explorer, then select Run All. You can reach out to Erik Schlegel or Eric Rozellif you experience any test failures. 

