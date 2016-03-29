# FBPortForwarding

FBPortForwarding lets you expose your Mac's port to iOS device via lightning
cable. The typical usecase is connecting to a TCP server that runs on OS X
from an iPhone app without common WiFi network.

## Benefits:

  1. No need to be on the same WiFi, worry about firewalls (fbguest) or VPN
  2. iOS app doesn't have to know your Mac's IP address
  3. Secure - communication is possible only when connected via USB

## How it works

iOS provides a way to connect to device's TCP server from Mac via USBHub, but
there is no API to connect from iOS to TCP server running on Mac. FBPortForwarding
uses [Peertalk](https://github.com/rsms/peertalk) to establish communication
channel from Mac to iOS, creates a TCP server on iOS and multiplexes all
connections to that server via the peertalk channel. Helper app running on Mac
listens for commands on the peertalk channel and initializes TCP connections
to local port and forwards all communication back via the same peertalk channel.


                                                       |
                                          iOS Device   |   Mac
                                                       |
                                 +----------------+            +----------------+
                                 |Peertalk Server |  connect   |Peertalk Client |
                                 |                <------------+                |
                                 |                |            |                |
                                 |       Port 8025|            |                |
                                 +----+-----------+            +---------^------+
                                      |                                  |
                                      |                                  |
    incoming     +----------------+   |                                  |                 +--------------+
    connections  |Proxy Server    |   |                                  |                 |Real Server   |
   ------------->>                |   |         +-------------+ commands |                 |              |
                 |       Port 8081|   | create  |             |  stream  |                 |     Port 8081|
                 +-+--------------+   +---------> Peertalk    <----------+                 +-^------------+
                   |                            | Channel     |                              ^
                   |   +--------+               |             |               +--------+     | outgoing
                   |   |        | onConnect     |             | connect       |        |     | connections
                   +---> Client +---------------> OpenPipe    +---------------> Client +-----+
                       | #[tag] | onRead        |             | write         | #[tag] |
                       |        +---------------> WriteToPipe +--------------->        |
                       |        | onDisconnect  |             | disconnect    |        |
                       |        +---------------> ClosePipe   +--------------->        |
                       |        |               |             |               |        |
                       |        | write         |             | onRead        |        |
                       |        <---------------+ WriteToPipe <---------------+        |
                       |        | close         |             | onDisconnect  |        |
                       |        <---------------+ ClosePipe   <---------------+        |
                       |        |               |             |               |        |
                       +--------+               |             |               +--------+
                                                +-------------+

First, the library on iOS device creates a TCP server on the port we want to
forward (let's say 8081) and a special Peertalk server on port 8025. Mac helper
app looks for connected iOS devices, and once it finds one it connects to its
peertalk server. Only *one* channel is created that's going to be used for
multiplexing data.

When a socket connects to local proxy server, FBPortForwarding is going to assign
a tag to the connection and use peertalk channel to tell Mac helper app to connect
to TCP port 8081 on Mac. Now events and data on both sides of the wire are going
to be multiplexed and transferred via the peertalk channel.
