var playlists = [];         // Array of users playlists
var playlistTrackLinks = [];// Array of playlist track hrefs and totals
var playlistTracks = [];    // Array of playlist tracks (.track to get the full track)
var tracks = [];            // Array of all user tracks
var albums = [];            // Array of all users albums (used for dates)
var artistsFull = [];       // Array of all users albums (used for dates)
var artists = [];           // Array of all users artists (used for genres)
var genres = [];            // Array of genres
var filteredSongs = [];     // Filtered Songs

var resultingTracksSource = document.getElementById('resulting-tracks-template').innerHTML,
    resultingTracksTemplate = Handlebars.compile(resultingTracksSource),
    resultingTracksPlaceholder = document.getElementById('resulting-tracks');

var playlistsSource = document.getElementById('resulting-playlists-template').innerHTML,
    playlistsTemplate = Handlebars.compile(playlistsSource),
    playlistsPlaceholder = document.getElementById('resulting-playlists');

document.getElementById('get_user_playlists').addEventListener('click', function() {
    playlists = [];
    getPlaylistsForCurrentUser(0);
}, false);

document.getElementById('get_user_songs').addEventListener('click', function() {
    playlistTrackLinks = [];
    playlistTracks = [];
    tracks = [];
    albums = [];
    artistsFull = [];
    genres = [];
    playlistTrackLinks = playlists.map(property("tracks"));
    addPlaylistsTracksToList(0);
}, false);

function FilterSongsByDate() {
    var year = document.getElementById("year").value;
    var month = document.getElementById("month").value;
    var day = document.getElementById("day").value;

    if(year != "")
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var releaseDate = t.album.release_date;
            return releaseDate != null ? releaseDate.substring(0, year.length) == year : false;
        });
    }
    if(month != "" && month.length == 2)
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var releaseDate = t.album.release_date; 1995-01-01
            return releaseDate != null ? releaseDate.substring(5, 7) == month : false;
        });
    }
    if(day != "" && day.length == 2)
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var releaseDate = t.album.release_date;
            return releaseDate != null ? releaseDate.substring(8, 10) == day : false;
        });
    }
};

function FilterSongsByArtists() {
    var NumOfArtists = parseInt(document.getElementById("NumOfArtists").value);

    if(!isNaN(NumOfArtists))
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var trackArtists = t.artists;
            return trackArtists != null ? trackArtists.length == NumOfArtists : false;
        });

        DisplayFilteredSongs();
    }
};

function FilterSongsByGenre() {
    //Need to be able to select Multiple genres?? ugh
    var genreList = document.getElementById("genre-list");
    var selectedGenre = genreList.options[genreList.selectedIndex].value;

    var artistIdsWithGenre = artistsFull.filter(a => {
        return a.genres.includes(selectedGenre);
    }).map(property("id"));

    if(selectedGenre != "1")
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            t.artists.forEach(a => {
                if(artistIdsWithGenre.includes(a.id))
                    match = true;
            });
            return match;
        });

        DisplayFilteredSongs();
    }
};

function FilterSongsByGenreKeyWord() {
    var genreSearch = document.getElementById("genre-keyword").value;

    var artistIdsWithGenre = artistsFull.filter(a => {
        var match = false;
        a.genres.forEach(g => {
            if(g.includes(genreSearch))
                match = true;
        });
        return match;
    }).map(property("id"));

    if(genreSearch != "")
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            t.artists.forEach(a => {
                if(artistIdsWithGenre.includes(a.id))
                    match = true;
            });
            return match;
        });

        DisplayFilteredSongs();
    }
};

document.getElementById('filter-by-all').addEventListener('click', function() {
    filteredSongs = tracks;

    FilterSongsByDate();
    FilterSongsByArtists();
    FilterSongsByGenre();
    FilterSongsByGenreKeyWord();

    DisplayFilteredSongs();
    $('#select-songs').show();
}, false);

function DisplayFilteredSongs(){
    setFilterSongCount(filteredSongs.length);
    var tracksHtml = filteredSongs.map(function (track) {
        return resultingTracksTemplate(track);
    }).join('');
    resultingTracksPlaceholder.innerHTML = tracksHtml;
}

document.getElementById('save-songs-to-playlist').addEventListener('click', function() {
    var playlistName = document.getElementById("playlist-name").value;
    var access_token = document.getElementById("access_token").innerText;
    var userId = document.getElementById("user-id").innerText;
    var dataPackage = JSON.stringify({"name":playlistName, "description":"Created By Me"});

    if(playlistName != "")
    {
        $.ajax({
            type: "POST",
            url: "https://api.spotify.com/v1/users/" + userId + "/playlists",
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            dataType: 'json',
            data: dataPackage,
            success: function(response) {
                var playlistId = response.id;
                AddSongsToPlaylist(playlistId, 0);
            }
        });
    }
}, false);

function AddSongsToPlaylist(playlistId, offset){
    var access_token = document.getElementById("access_token").innerText;
    var userId = document.getElementById("user-id").innerText;

    var limit = offset + 100 > filteredSongs.length ? filteredSongs.length - offset : 100; 
    var songsToAddUris = filteredSongs.map(property("uri")).slice(offset, offset + limit);
    var songsToAddBody = {"uris": songsToAddUris};

    $.ajax({
        type: 'POST',
        url: "https://api.spotify.com/v1/users/" + userId + "/playlists/" + playlistId + "/tracks",
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        data: JSON.stringify(songsToAddBody),
        success: function(response) {
            if(limit == 100)
                AddSongsToPlaylist(playlistId, offset + 100);
            else
                $('#saved-message').show();
        }
    });
}

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

    // albums = tracks.map(property("album")).reduce(flatten,[]);
    // albums = Array.from(new Set(albums.map(a => a.id)))
    //     .map(id => {
    //         return albums.find(a => a.id === id)
    //     });

    artists = tracks.map(property("artists")).reduce(flatten,[]).filter((el) => { return el != null });
    artists = Array.from(new Set(artists.map(a => a.id)))
    .map(id => {
        return artists.find(a => a.id === id)
    });

    getGenresFromArtists(0);
    
    setSongCount(tracks.length);
    $('#filter-songs').show();
}

function getGenresFromArtists(artistIdx)
{
    var access_token = document.getElementById("access_token").innerText;
    var urlFor50Artists = "https://api.spotify.com/v1/artists?ids=";
    var limit = artistIdx + 50 > artists.length ? artists.length - artistIdx : 50; 
    for(var i = artistIdx; i < artistIdx + limit; i++)
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
                artistsFull = artistsFull.filter((el) => { return el != null });
                genres = artistsFull.map(property("genres")).reduce(flatten,[]);
                genres = Array.from(new Set(genres.map(g => g)))
                    .map(gg => {
                        return genres.find(g => g === gg)
                    });

                var genreList = document.getElementById("genre-list");
                genres.forEach((g) => {
                    let option = document.createElement("option");
                    option.text = g;
                    option.value = g;
                    genreList.options.add(option);
                });
            }
        }
    });
}

function setSongCount(trackCount){
    document.getElementById("song-count").innerText = "Number of Songs Found: " +  trackCount;
}

function setFilterSongCount(trackCount){
    document.getElementById("filter-song-count").innerText = "Number of Songs Found: " +  trackCount;
}

function displayPlaylistData(){
    document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  playlists.length;
    var playlistsHtml = playlists.map(function (playlist) {
        return playlistsTemplate(playlist);
    }).join('');
    playlistsPlaceholder.innerHTML = playlistsHtml;
    $('#get-songs').show();
}

function removePlaylist(element)
{
    playlists = playlists.filter(function(value, index, arr){ return value.id != element.id;});
    document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  playlists.length;
    element.remove();
}

function removeSong(element)
{
    filteredSongs = filteredSongs.filter(function(value, index, arr){ return value.id != element.id;});
    setFilterSongCount(filteredSongs.length);
    element.remove();
}

function property(key){
    return function(x){
        return x != null ? x[key] : null;
    }
}

function flatten(a,b){
    return a.concat(b);
}