function property(key){
    return function(x){
        return x != null ? x[key] : null;
    }
}

function flatten(a,b){
    return a.concat(b);
}

var playlists = [];         // Array of users playlists
var playlistTrackLinks = [];// Array of playlist track hrefs and totals
var playlistTracks = [];    // Array of playlist tracks (.track to get the full track)
var tracks = [];            // Array of all user tracks
var albums = [];            // Array of all users albums (used for dates)
var artistsFull = [];            // Array of all users albums (used for dates)
var artists = [];           // Array of all users artists (used for genres)
var genres = [];            // Array of genres

var resultingTracksSource = document.getElementById('resulting-tracks-template').innerHTML,
    resultingTracksTemplate = Handlebars.compile(resultingTracksSource),
    resultingTracksPlaceholder = document.getElementById('resulting-tracks');

var songCountSource = document.getElementById('song-count-template').innerHTML,
    songCountTemplate = Handlebars.compile(songCountSource),
    songCountPlaceholder = document.getElementById('song-count');

var playlistsSource = document.getElementById('resulting-playlists-template').innerHTML,
    playlistsTemplate = Handlebars.compile(playlistsSource),
    playlistsPlaceholder = document.getElementById('resulting-playlists');

//This needs to be called in the index file with access token
//actually or can i get element and use that? or find a different way to share it tbh, all options sound messy
document.getElementById('get_user_playlists').addEventListener('click', function() {
    getPlaylistsForCurrentUser(0);
}, false);

document.getElementById('get_user_songs').addEventListener('click', function() {
    //should disable until playlists are in
    playlistTrackLinks = playlists.map(property("tracks"));
    // playlistTrackLinks = playlistTrackLinks.reduce(flatten,[]);
    addPlaylistsTracksToList(0);
}, false);

document.getElementById('filter-by-date').addEventListener('click', function() {
    var year = document.getElementById("year").value;
    var month = document.getElementById("month").value;
    var day = document.getElementById("day").value;

    var tracksFromDate = tracks;
    if(year != "")
    {
        tracksFromDate = tracksFromDate.filter((t) => 
        {
            var releaseDate = t.album.release_date;
            return releaseDate != null ? releaseDate.substring(0, year.length) == year : false;
        });
    }
    if(month != "" && month.length == 2)
    {
        tracksFromDate = tracksFromDate.filter((t) => 
        {
            var releaseDate = t.album.release_date; 1995-01-01
            return releaseDate != null ? releaseDate.substring(5, 7) == month : false;
        });
    }
    if(day != "" && day.length == 2)
    {
        tracksFromDate = tracksFromDate.filter((t) => 
        {
            var releaseDate = t.album.release_date;
            return releaseDate != null ? releaseDate.substring(8, 10) == day : false;
        });
    }

    var tracksHtml = tracksFromDate.map(function (track) {
        return resultingTracksTemplate(track);
    }).join('');
    setSongCount(tracksFromDate.length);
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

        setSongCount(tracksWithGivenNumOfArtists.length);
        var tracksHtml = tracksWithGivenNumOfArtists.map(function (track) {
            return resultingTracksTemplate(track);
        }).join('');
        resultingTracksPlaceholder.innerHTML = tracksHtml;
    }
}, false);

function getPlaylistsForCurrentUser(offset)
{
    var access_token = document.getElementById("access_token").innerText;

    $.ajax({
        url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset,
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
            playlists = playlists.concat(response.items);
            if(offset + 50 < response.total)
                getPlaylistsForCurrentUser(offset + 50);
            else
            {
                displayPlaylistData();
                // Don't do this here, create a new button for after pulling in playlists
                // playlistTrackLinks = playlists.map(property("tracks"));
                // // playlistTrackLinks = playlistTrackLinks.reduce(flatten,[]);
                // addPlaylistsTracksToList(0);
            }
        }
    });
}

function addPlaylistsTracksToList(playlistIdx)
{
    getPlaylistTracksFromOffset(playlistIdx, playlistTrackLinks[playlistIdx], 0);
}

function getPlaylistTracksFromOffset(playlistIdx, playlistTrackLink, offset)
{
    var access_token = document.getElementById("access_token").innerText;

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
    tracks = Array.from(new Set(tracks.map(t => t.id)))
        .map(id => {
            return tracks.find(t => t.id === id)
        });

    albums = tracks.map(property("album")).reduce(flatten,[]);
    albums = Array.from(new Set(albums.map(a => a.id)))
        .map(id => {
            return albums.find(a => a.id === id)
        });

    artists = albums.map(property("artists")).reduce(flatten,[]);
    artists = Array.from(new Set(artists.map(a => a.id)))
    .map(id => {
        return artists.find(a => a.id === id)
    });

    getGenresFromArtists(0);
    
    setSongCount(tracks.length);
}

function getGenresFromArtists(artistIdx)
{
    var access_token = document.getElementById("access_token").innerText;

    var urlFor50Artists = "https://api.spotify.com/v1/artists?ids=";
    var limit = artistIdx + 50 > artists.length ? artists.length - artistIdx : 50; 
    var i;
    for(i = artistIdx; i < artistIdx + limit; i++)
    {
        if(i != artistIdx)
            urlFor50Artists += ",";
        urlFor50Artists += artists[i].id;
    }

    $.ajax({
        // url: artists[artistIdx].href,
        url: urlFor50Artists,
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
            artistsFull = artistsFull.concat(response.artists);

            if(i < artists.length){
                getGenresFromArtists(i);
            }
            else {
                genres = artistsFull.map(property("genres")).reduce(flatten,[]);
                genres = Array.from(new Set(genres.map(g => g)))
                    .map(gg => {
                        return genres.find(g => g === gg)
                    });

                document.getElementById("first-genre").value = genres[0];
                document.getElementById("first-genre").text = genres[0];
            }
        }
    });
}

function setSongCount(trackCcount){
    songCountPlaceholder.innerHTML = songCountTemplate({
        count: trackCcount
    });
}

function displayPlaylistData(){
    document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  playlists.length;
    var playlistsHtml = playlists.map(function (playlist) {
        return playlistsTemplate(playlist);
    }).join('');
    playlistsPlaceholder.innerHTML = playlistsHtml;

}

function removePlaylist(element)
{
    playlists = playlists.filter(function(value, index, arr){ return value.id != element.id;});
    document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  playlists.length;
    element.remove();
}