# Ticks and Crosses
## Purpose
We used to have the ability in WebEx Training for learners to send us ticks, crosses and other emojis.
In WebEx Meetings no such feature exists.
This web app aims to fill that gap.

![][screenshot]
## Building and running the app
- Fork the project if you want to
- Clone the source code to a local folder
- Open a terminal and `cd` to the cloned local folder
- Run the command `npm install` to download all dependencies
- To run the application, execute the command `npm run dev`
- To view the application, browse to `http://localhost:8000`
## Simulating multiple users
While developing the application, you may wish to open multiple browsers or browser tabs, each one representing a different learner or tutor.
To make this work, you need to navigate to the page `/settings` within the application, and tick the box. When the box is unticked, the application
behaves as it would for a regular user, where the aim is to avoid them appearing in the tutor list several times just because they opened and closed
a browser tab connecting to the application multiple times.

[screenshot]: https://github.com/ajburgess/ticks-and-crosses/raw/main/screenshot.png
