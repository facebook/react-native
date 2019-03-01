echo Executing ReactNative Integrations tests given in the filter
docker run --cap-add=SYS_ADMIN -i react/android bash ContainerShip/scripts/run-android-docker-instrumentation-tests.sh --filter="(CatalystMeasureLayout|CatalystMultitouchHandling|CatalystNativeJSToJavaParameters|CatalystNativeJavaToJSArguments|CatalystNativeJavaToJSReturnValues|CatalystSubviewsClipping|CatalystTouchBubbling|DatePickerDialog|InitialProps|JSResponder|LayoutEvents|NativeId|ReactPicker|ReactRootView|ReactSwipeRefreshLayout|Share|TestId|TextInput|TimePickerDialog)"


