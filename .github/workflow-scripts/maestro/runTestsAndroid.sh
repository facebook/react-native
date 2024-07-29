echo "Install APK from ${{ inputs.app-path }}"
adb install "${{ inputs.app-path }}"

echo "Start recording to /sdcard/screen.mp4"
adb shell screenrecord /sdcard/screen.mp4

echo "Start testing ${{ inputs.maestro-flow }}"
$HOME/.maestro/bin/maestro test ${{ inputs.maestro-flow }} --format junit -e APP_ID=${{ inputs.app-id }} --debug-output /tmp/MaestroLogs

echo "Stop recording. Saving to screen.mp4"
adb pull /sdcard/screen.mp4
