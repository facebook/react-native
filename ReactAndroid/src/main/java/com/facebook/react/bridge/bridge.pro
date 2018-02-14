## Putting this here is kind of a hack.  I don't want to modify the OSS bridge.
## TODO mhorowitz: add @DoNotStrip to the interface directly.

-keepclassmembers class com.facebook.react.bridge.queue.MessageQueueThread {
  public boolean isOnThread();
  public void assertIsOnThread();
}
