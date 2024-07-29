# Avoid exit from the job if one of the command returns an error.
# Maestro can fail in case of flakyness, we have some retry logic.
set +e

echo "Launching iOS Simulator: iPhone 15 Pro"
xcrun simctl boot "iPhone 15 Pro"

echo "Installing app on Simulator"
xcrun simctl install booted "${{ inputs.app-path }}"

echo "Retrieving device UDID"
UDID=$(xcrun simctl list devices booted -j | jq -r '[.devices[]] | add | first | .udid')
echo "UDID is $UDID"

echo "Bring simulator in foreground"
open -a simulator

echo "Launch the app"
xcrun simctl launch $UDID ${{ inputs.app-id }}

echo "Running tests with Maestro"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=1500000 # 25 min. CI is extremely slow

# Add retries for flakyness
MAX_ATTEMPTS=3
CURR_ATTEMPT=0
RESULT=1

while [[ $CURR_ATTEMPT -lt $MAX_ATTEMPTS ]] && [[ $RESULT -ne 0 ]]; do
  CURR_ATTEMPT=$((CURR_ATTEMPT+1))
  echo "Attempt number $CURR_ATTEMPT"

  echo "Start video record using pid: video_record_${{ inputs.jsengine }}_$CURR_ATTEMPT.pid"
  xcrun simctl io booted recordVideo video_record_$CURR_ATTEMPT.mov & echo $! > video_record_${{ inputs.jsengine }}_$CURR_ATTEMPT.pid

  echo '$HOME/.maestro/bin/maestro --udid=$UDID test ${{ inputs.maestro-flow }} --format junit -e APP_ID=${{ inputs.app-id }}'
  $HOME/.maestro/bin/maestro --udid=$UDID test ${{ inputs.maestro-flow }} --format junit -e APP_ID=${{ inputs.app-id }} --debug-output /tmp/MaestroLogs

  RESULT=$?

  # Stop video
  kill -SIGINT $(cat video_record_${{ inputs.jsengine }}_$CURR_ATTEMPT.pid)
done

exit $RESULT
