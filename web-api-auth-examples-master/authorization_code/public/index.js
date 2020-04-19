/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function property(key){
    return function(x){
        return x != null ? x[key] : null;
    }
}

function flatten(a,b){
    return a.concat(b);
}

var userProfileSource = document.getElementById('user-profile-template').innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById('user-profile');

var oauthSource = document.getElementById('oauth-template').innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById('oauth');

var params = getHashParams();

var playlists = [];         // Array of users playlists
var playlistTrackLinks = [];// Array of playlist track hrefs and totals
var playlistTracks = [];    // Array of playlist tracks (.track to get the full track)
var tracks = [];            // Array of all user tracks
var albums = [];            // Array of all users albums (used for dates)
var artists = [];           // Array of all users artists (used for genres)
var genres = [];            // Array of genres

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

var resultingTracksSource = document.getElementById('resulting-tracks-template').innerHTML,
    resultingTracksTemplate = Handlebars.compile(resultingTracksSource),
    resultingTracksPlaceholder = document.getElementById('resulting-tracks');

var songCountSource = document.getElementById('song-count-template').innerHTML,
    songCountTemplate = Handlebars.compile(songCountSource),
    songCountPlaceholder = document.getElementById('song-count');

if (error) {
    alert('There was an error during the authentication');
} else {
    if (access_token) {
        // render oauth info
        oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token
        });

        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {
                userProfilePlaceholder.innerHTML = userProfileTemplate(response);

                $('#login').hide();
                $('#loggedin').show();
            }
        });

        $.ajax({
            url: 'https://api.spotify.com/v1/me/playlists?limit=5',
            // url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=50',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {
                playlists = response.items;
                //can check the "total" property returned to check if there is more to get
                playlistTrackLinks = playlists.map(property("tracks"));
                // playlistTrackLinks = playlistTrackLinks.reduce(flatten,[]);
                getTracksFromPlaylists();
            }
        });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }

    document.getElementById('obtain-new-token').addEventListener('click', function() {
        $.ajax({
            url: '/refresh_token',
            data: {
            'refresh_token': refresh_token
            }
        }).done(function(data) {
            access_token = data.access_token;
            oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token
            });
        });
    }, false);

    document.getElementById('filter-by-date').addEventListener('click', function() {
        var year = document.getElementById("year").value;
        var month = document.getElementById("month").value;
        var day = document.getElementById("day").value;

        var tracksFromBirthYear = tracks;
        if(year != "" && year.length == 4)
        {
            tracksFromBirthYear = tracksFromBirthYear.filter((t) => 
            {
                var releaseDate = t.album.release_date;
                return releaseDate != null ? releaseDate.substring(0, 4) == year : false;
            });
        }
        if(month != "" && month.length == 2)
        {
            tracksFromBirthYear = tracksFromBirthYear.filter((t) => 
            {
                var releaseDate = t.album.release_date; 1995-01-01
                return releaseDate != null ? releaseDate.substring(5, 7) == month : false;
            });
        }
        if(day != "" && day.length == 2)
        {
            tracksFromBirthYear = tracksFromBirthYear.filter((t) => 
            {
                var releaseDate = t.album.release_date;
                return releaseDate != null ? releaseDate.substring(8, 10) == day : false;
            });
        }

        var tracksHtml = tracksFromBirthYear.map(function (track) {
            return resultingTracksTemplate(track);
        }).join('');
        setSongCount(tracksFromBirthYear.length);
        resultingTracksPlaceholder.innerHTML = tracksHtml;
    }, false);

    document.getElementById('filter-by-num-of-artists').addEventListener('click', function() {
        var NumOfArtists = parseInt(document.getElementById("NumOfArtists").value);

        if(NumOfArtists != undefined)
        {
            var tracksWithGivenNumOfArtists = tracks.filter((t) => 
            {
                var trackArtists = t.artists;
                return trackArtists != null ? trackArtists.length == NumOfArtists : false;
            });

            var tracksHtml = tracksWithGivenNumOfArtists.map(function (track) {
                return resultingTracksTemplate(track);
            }).join('');
            setSongCount(tracksWithGivenNumOfArtists.length);
            resultingTracksPlaceholder.innerHTML = tracksHtml;
        }
    }, false);
}

function getTracksFromPlaylists() 
{
    addPlaylistsTracksToList(0);
}

function addPlaylistsTracksToList(playlistIdx)
{
    getPlaylistTracksFromOffset(playlistIdx, playlistTrackLinks[playlistIdx], 0);
}

function getPlaylistTracksFromOffset(playlistIdx, playlistTrackLink, offset)
{
    $.ajax({
        url: playlistTrackLink.href + '?offset=' + offset,
        // need to embrace async? - it is async now... but not really
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
            playlistTracks = playlistTracks.concat(response.items);
            if(offset + 100 < playlistTrackLink.total){
                var newOffset = offset + 100;
                getPlaylistTracksFromOffset(playlistIdx, playlistTrackLink, newOffset);
            }
            else {
                if(playlistIdx < playlistTrackLinks.length - 1)
                    addPlaylistsTracksToList(playlistIdx + 1);
                else
                    processTrackData();
            }
        }
    });
}

function processTrackData(){
    tracks = playlistTracks.map(property("track")).reduce(flatten,[]).filter((el) => { return el != null });

    tracks = Array.from(new Set(tracks.map(a => a.id)))
        .map(id => {
            return tracks.find(a => a.id === id)
        });

    albums = tracks.map(property("album")).reduce(flatten,[]);
    artists = albums.map(property("artists")).reduce(flatten,[]);
    // Need to call the hrefs of these to get the genres

    setSongCount(tracks.length);
}

function setSongCount(trackCcount){
    songCountPlaceholder.innerHTML = songCountTemplate({
        count: trackCcount
    });
}