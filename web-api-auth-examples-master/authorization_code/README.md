## How to use it atm

Before you start

- Download git form here if you have Windows. https://gitforwindows.org/
- Download node with npm from here. https://www.npmjs.com/get-npm

Getting the Application

- Navigate to https://github.com/kunger47/spotify-buddy
- Click on the `Clone or Download` Button
- Option 1
  - Choose Download Zip
  - Go to your downloaded zip file and right click to select `Extract All`, save it somewhere.
  - Navigate to the folder, `spotify-buddy-master -> web-api-auth-examples-master -> authorization_code`
  - Click on the file location bar and replace the file location with (aka, type in)  `cmd` and hit enter. (The command prompt black box should appear)
  - type `npm install` and hit enter (this should download any need libraries you need)
  - type `node app.js` and hit enter
  - Open up your browser. Preferably Chrome.
  - Navigate to url localhost:8888
- Option 2 - This will allow you to get updates to the app whenever you want
  - Copy the link
  - Create a folder anywhere in your file explorer. (traditionally `C:\Users\{your username}\source\repos\{folder name here}`)
  - Enter the folder. It should be empty
  - Click on the file location bar and replace the file location with (aka, type in)  `cmd` and press enter. (The command prompt black box should appear)
  - type `git clone {paste the copied link here}` and hit enter. This will create a "link/reference" to the code, saved on the github.com. Whenever I add a new feature you can "pull in" the changes to your computer by.
    1. Navigate to the folder you created and go into the folder `spotify-buddy`
    2. Click on the file location bar and replace the file location with `cmd` and press enter.
    3. Enter `git pull`. This should pull in any new changes I have made to the app.
  - Navigate to the folder, `spotify-buddy-master -> web-api-auth-examples-master -> authorization_code`
  - Click on the file location bar and replace the file location with (aka, type in)  `cmd` and hit enter. (The command prompt black box should appear)
  - type `npm install` and hit enter (this should download any need libraries you need)
  - type `node app.js` and hit enter.
  - Open up your browser. Preferably Chrome.
  - Navigate to url localhost:8888

## Take Note!

- If you have Spotify set to Remember Me then when you click "Let's Do This", it will log you in immediately. If you want to log in another user. You must go to your Spotify account in your browser and log out before clicking "Lets Do This".
- ALSO, this is annoying I know, but the matching songs across profiles functionality is very janky at the moment. If you want to use it you will have to do some work.
  1. Before you start, when you are on the "Let's Do This" page. Press the key F12. This will open up your DevTools. 
  2. Under the application tab click, Session Storage on the left. 
  3. Select the "Filtered Songs" field if it is there and click "Delete Selected". 
  4. Then log in with your user account. (Who ever you log in as the second user will get the playlist).
  5. Pull in your playlists. Filter down which playlists you want to include in the search.
  6. Get the songs.
  7. Filter the gathered songs on any of the filters provided.
  8. The resulting list of filtered songs is ultimately what will be compared later on.
  9. Now click "Log in as another user".
  10. In another tab, open spotify.com and log out of your account.
  11. Now you can Click "let's do this". It should prompt you to now log in as the second user.
  12. Filter down their songs as you did with the first user.
  13. Click on "Compare All Users Filtered Songs".
  14. The filtered songs cannot be seen at this time for underlying issues that need to be resolved atm. But you can click "Save as Playlist" at the bottom of the page and you can see the songs that way.

## Backlog

**Getting Song Data**

- [x] Allow users what albums to gather data from (click to remove an album from list)
- [x] Allow users to indicate if they should gather data from liked(saved) songs

**Filtering Songs**

- [x] Date - Millennium(Y), Century(YY), Decade(YYY), Year(YYYY), Month(MM), Day(DD)
- [x] Number of artists on the track
- [x] Artist
- [x] Album
- [x] Song Title
- [x] Genre (pulled in list of all your genres)
- [ ] by multiple genres (select many, or enter many)
- [x] Genre keyword
- [x] Filter out explicit songs
- [x] Song length

- [ ] Date you discovered it (first date you added it to a playlist or saved it)
- [ ] Album Label
- [ ] Song Attribute values provided by Spotify (pretty neat actually, values from 0.0 to 1.0) https://developer.spotify.com/documentation/web-api/reference-beta/#object-tuneabletrackobject
  - [x] Popularity 
  - [ ] Danceability
  - [ ] Acousticness
  - [ ] Energy
  - [ ] Instrumentalness
  - [ ] Liveness
  - [ ] Loudness
  - [ ] Speechiness
  - [ ] Tempo
  - [ ] Valence (happy or sad)
  - [ ] Tempo, Mode, or Time_Signature
  - [ ] Artist popularity (artist's number of followers)

**Saving Filtered Songs**

  - [x] Sample a song (hoover over it)
  - [x] Remove a song from list (click it)

  - [x] Save List of Filtered songs to playlist given a name
  - [x] Ability to add songs to already created playlist (when they enter a playlist name, if it matches a current one then add songs to that one if they are not on it already)
  - [ ] Ability to order filtered songs by various fields (title, artist, etc.)

**Compare Users Songs**

  - [x] Compare two users filtered song lists for matches
  - [x] Save this matching list of songs to a playlist (will save to the last user that signed in)

  - [ ] Allow users to specify how many songs they want in the resulting playlist (hence add more songs if they do not have enough in common)
  - [ ] Be able to compare any number of users
  - [ ] Create a playlist based on one users songs that another user might like

**Other Ideas**

  - [ ] Get a users top songs from various time spans, allow them to save this as a playlist
  - [ ] Create various graphs (mainly based on play history or when songs were added to playlists/saved songs)
  - [ ] Show your change of music taste over time (genres over time)
  - [ ] Select a song and create a line graph of your listens (to see when you listened to it the most and the least)
  - [ ] Allow user to ask for recommendations based on filtered songs