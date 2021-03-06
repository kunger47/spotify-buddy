var playlists = [];         // Array of users playlists
var playlistNames = [];
var playlistTrackLinks = [];// Array of playlist track hrefs and totals
var playlistTracks = [];    // Array of playlist tracks (.track to get the full track)
var savedTracks = [];       // Array of saved tracks (.track to get the full track)
var tracks = [];            // Array of all user tracks
// var albums = [];         // Array of all users albums (used for dates)
var artistsFull = [];       // Array of all users artistsFull (used for dates)
var genres = [];            // Array of genres
var filteredSongs = [];     // Filtered Songs
var allUsersSongs = [];     // Array of Arrays to be stored in local storage
var matchingSongs = [];     // Array of 2 users matching songs
var getSavedSongs = true;
var displayedSongs = 0;
var trackedUsers = [];

var matchingTracksSource = document.getElementById('resulting-tracks-template').innerHTML,
    matchingTracksTemplate = Handlebars.compile(matchingTracksSource),
    matchingTracksPlaceholder = document.getElementById('matching-tracks');

var resultingTracksSource = document.getElementById('resulting-tracks-template').innerHTML,
    resultingTracksTemplate = Handlebars.compile(resultingTracksSource),
    resultingTracksPlaceholder = document.getElementById('resulting-tracks');

var playlistsSource = document.getElementById('resulting-playlists-template').innerHTML,
    playlistsTemplate = Handlebars.compile(playlistsSource),
    playlistsPlaceholder = document.getElementById('resulting-playlists');

var filteredSongsLocalStorage = "filtered-songs";
allUsersSongs = JSON.parse(sessionStorage.getItem(filteredSongsLocalStorage) || "[]");

var usersTrackedLocalStorage = "tracked-users";
trackedUsers = JSON.parse(sessionStorage.getItem(usersTrackedLocalStorage) || "[]");
var userCount = trackedUsers.length;

//Getting Playlists
document.getElementById('get_user_playlists').addEventListener('click', function() {
    playlists = [];
    getSavedSongs = true;
    getPlaylistsForCurrentUser(0);
}, false);

function getPlaylistsForCurrentUser(offset)
{
    $('#playlist-progress-status').show();
    var progress = document.getElementById("downloading-playlists");
    var access_token = document.getElementById("access_token").innerText;

    $.ajax({
        url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset,
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
            playlists = playlists.concat(response.items);
            var newOffset = offset + 50;
            if(newOffset < response.total)
            {
                progress.value = newOffset;
                progress.max = response.total;
                getPlaylistsForCurrentUser(newOffset);
            }
            else
            {
                $('#playlist-progress-status').hide();
                playlistNames = playlists.map(twoProperty("id", "name"));
                displayPlaylistData();
            }
        }
    });
}

function displayPlaylistData(){
    document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  playlists.length;
    
    var savedSongs = playlistsTemplate({ id: -1, name: "Saved Songs", images: [{url: "/images/SpotifyHeartNoBackground.png"}] });
    playlistsPlaceholder.innerHTML = savedSongs;
    var playlistsHtml = playlists.map(function (playlist) {
        return playlistsTemplate(playlist);
    }).join('');
    playlistsPlaceholder.innerHTML += playlistsHtml;
    $('#get-songs').show();
}

//Getting Songs
document.getElementById('get_user_songs').addEventListener('click', function() {
    playlistTrackLinks = [];
    playlistTracks = [];
    savedTracks = [];
    tracks = [];
    // albums = [];
    artistsFull = [];
    genres = [];
    playlistTrackLinks = playlists.map(property("tracks"));
    addSavedSongsToList(0);
}, false);

function addSavedSongsToList(offset)
{
    if(getSavedSongs)
    {
        $('#song-progress-status').show();
        var progress = document.getElementById("downloading-songs");
        var access_token = document.getElementById("access_token").innerText;
        $.ajax({
            url: "https://api.spotify.com/v1/me/tracks?limit=50&offset=" + offset,
            // need to embrace async? - it is async now... but not really
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {
                savedTracks = savedTracks.concat(response.items);
                var newOffset = offset + 50;
                if(newOffset < response.total){
                    progress.max = response.total;
                    progress.value = newOffset;
                    addSavedSongsToList(newOffset);
                } else {
                    if(playlistTrackLinks.length > 0)
                    {
                        $('#song-progress-status').hide();
                        $('#playlist-song-progress-status').show();
                        var playlistSongsProgress = document.getElementById("downloading-playlist-songs");
                        playlistSongsProgress.max = playlistTrackLinks.length;
                        addPlaylistsTracksToList(0, playlistSongsProgress);
                    }
                    else
                        processTrackData();
                }
            }
        });
    } else {
        $('#playlist-song-progress-status').show();
        var pSProgress = document.getElementById("downloading-playlist-songs");
        pSProgress.max = playlistTrackLinks.length;
        addPlaylistsTracksToList(0, pSProgress);
    }
}

function addPlaylistsTracksToList(playlistIdx, progress)
{
    progress.value = playlistIdx;
    getPlaylistTracksFromOffset(playlistIdx, playlistTrackLinks[playlistIdx], 0, progress);
}

function getPlaylistTracksFromOffset(playlistIdx, playlistTrackLink, offset, progress)
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
                getPlaylistTracksFromOffset(playlistIdx, playlistTrackLink, newOffset, progress);
            }
            else {
                if(playlistIdx < playlistTrackLinks.length - 1)
                {
                    addPlaylistsTracksToList(playlistIdx + 1, progress);
                }
                else
                {
                    processTrackData();
                    $('#playlist-song-progress-status').hide();
                }
            }
        }
    });
}

function processTrackData(){
    tracks = savedTracks.map(property("track"));
    tracks = tracks.concat(playlistTracks.map(property("track")));
    tracks = tracks.reduce(flatten,[]).filter((el) => { return el != null });
    tracks = Array.from(new Set(tracks.map(t => t.id)))
        .map(id => {
            return tracks.find(t => t.id === id)
        });
    tracks = tracks.filter(t => {
        return t.is_local == false;
    });

    // albums = tracks.map(property("album")).reduce(flatten,[]);
    // albums = Array.from(new Set(albums.map(a => a.id)))
    //     .map(id => {
    //         return albums.find(a => a.id === id)
    //     });

    var artists = tracks.map(property("artists")).reduce(flatten,[]).filter((el) => { return el != null });
    artists = Array.from(new Set(artists.map(a => a.id)))
        .map(id => {
            return artists.find(a => a.id === id)
        });

    getGenresFromArtists(artists, 0);
}

function getGenresFromArtists(artists, artistIdx)
{
    $('#artist-progress-status').show();
    var progress = document.getElementById("downloading-artists");
    progress.max = artists.length;
    progress.value = artistIdx;

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
                getGenresFromArtists(artists, i);
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
                setSongCount(tracks.length);
                $('#artist-progress-status').hide();
                $('#filter-songs').show();
            }
        }
    });
}

function setSongCount(trackCount){
    document.getElementById("song-count").innerText = "Number of Songs Found: " +  trackCount;
}

//Filter Songs
document.getElementById('filter-by-all').addEventListener('click', function() {
    displayedSongs = 0;
    resultingTracksPlaceholder.innerHTML = null;
    filteredSongs = tracks;

    FilterSongsByDate();
    FilterSongsByNumOfArtists();
    FilterSongsByGenre();
    FilterSongsByGenreKeyWord();
    FilterSongsByArtistKeyWord();
    FilterSongsByTitleKeyWord();
    FilterSongsByAlbumKeyWord();
    FilterSongsByPopularity();
    FilterSongsByLength();
    RemoveExplicitSongs();

    DisplayFilteredSongs();
    
    allUsersSongs[userCount] = filteredSongs.map(twoProperty("id", "uri"));
    sessionStorage.setItem(filteredSongsLocalStorage, JSON.stringify(allUsersSongs));
    
    trackedUsers[userCount] = document.getElementById("user-id").innerText;
    sessionStorage.setItem(usersTrackedLocalStorage, JSON.stringify(trackedUsers));
    
    $('#user-count-message').html("Collected songs from " + trackedUsers[0] + " and " + trackedUsers[1] + ".");
    
    if(userCount > 0)
    {
        $('#compare-users').show();
    }

    $('#select-songs').show();
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

function FilterSongsByNumOfArtists() {
    var NumOfArtists = parseInt(document.getElementById("NumOfArtists").value);

    if(!isNaN(NumOfArtists))
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var trackArtists = t.artists;
            return trackArtists != null ? trackArtists.length == NumOfArtists : false;
        });
    }
};

function FilterSongsByGenre() {
    //Need to be able to select Multiple genres?? ugh
    var genreList = document.getElementById("genre-list");
    var selectedGenre = genreList.options[genreList.selectedIndex].value;

    if(selectedGenre != "1")
    {
        var artistIdsWithGenre = artistsFull.filter(a => {
            return a.genres.includes(selectedGenre);
        }).map(property("id"));

        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            t.artists.forEach(a => {
                if(artistIdsWithGenre.includes(a.id))
                    match = true;
            });
            return match;
        });
    }
};

function FilterSongsByGenreKeyWord() {
    var genreSearch = document.getElementById("genre-keyword").value.toLowerCase();

    if(genreSearch != "")
    {
        var artistIdsWithGenre = artistsFull.filter(a => {
            var match = false;
            a.genres.forEach(g => {
                if(g.toLowerCase().includes(genreSearch))
                    match = true;
            });
            return match;
        }).map(property("id"));

        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            t.artists.forEach(a => {
                if(artistIdsWithGenre.includes(a.id))
                    match = true;
            });
            return match;
        });
    }
};

function FilterSongsByArtistKeyWord() {
    var search = document.getElementById("artist-keyword").value.toLowerCase();

    if(search != "")
    {
        var artistmatchIds = artistsFull.filter(a => {
            var match = false;
            if(a.name.toLowerCase().includes(search))
                match = true;
            return match;
        }).map(property("id"));

        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            t.artists.forEach(a => {
                if(artistmatchIds.includes(a.id))
                    match = true;
            });
            return match;
        });
    }
};

function FilterSongsByTitleKeyWord() {
    var search = document.getElementById("title-keyword").value.toLowerCase();

    if(search != "")
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            if(t.name.toLowerCase().includes(search))
                match = true;
            return match;
        });
    }
};

function FilterSongsByAlbumKeyWord() {
    var search = document.getElementById("album-keyword").value.toLowerCase();

    if(search != "")
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            var match = false;
            if(t.album.name.toLowerCase().includes(search))
                match = true;
            return match;
        });
    }
};

function FilterSongsByPopularity() {
    var popFilter = document.getElementById("popularity-filter");
    var popComparator = document.getElementById("popularity-compare");
    var search = parseInt(popFilter.value);

    // TODO: add toggle for filter by pop or not
    // if(search != "")
    // {
        if(popComparator.value == "=")
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.popularity == search;
            });
        }
        else if(popComparator.value == ">=")
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.popularity >= search;
            });
        }
        else
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.popularity <= search;
            });
        }
    // }
};

function FilterSongsByLength() {
    var filter = document.getElementById("length-filter");
    var comparator = document.getElementById("length-compare");
    var search = parseInt(filter.value);

    // TODO: add toggle for filter by pop or not
    // if(search != "")
    // {
        if(comparator.value == "=")
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.duration_ms == search * 60 * 1000;
            });
        }
        else if(comparator.value == ">=")
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.duration_ms >= search * 60 * 1000;
            });
        }
        else
        {
            filteredSongs = filteredSongs.filter((t) => 
            {
                return t.duration_ms <= search * 60 * 1000;
            });
        }
    // }
};

function RemoveExplicitSongs() {
    var ignoreExplicitSongs = document.getElementById("explicit-keyword").checked;

    if(ignoreExplicitSongs)
    {
        filteredSongs = filteredSongs.filter((t) => 
        {
            return !t.explicit;
        });
    }
};

function DisplayFilteredSongs(){
    setFilterSongCount(filteredSongs.length);
    AddMoreFilteredSongsToDisplay();
}

function AddMoreFilteredSongsToDisplay() {
    var tracksHtml = filteredSongs.slice(displayedSongs, displayedSongs + 100).map(function (track) {
        return resultingTracksTemplate(track);
    }).join('');
    resultingTracksPlaceholder.innerHTML += tracksHtml;
    displayedSongs += 100;
    if(filteredSongs.length < displayedSongs)
    {
        $('#load-more-songs').hide();
    } else {
        $('#load-more-songs').show();
    }
}

function setFilterSongCount(trackCount){
    document.getElementById("filter-song-count").innerText = "Number of Songs Found: " +  trackCount;
}

document.getElementById('load-more-songs').addEventListener('click', function() {
    AddMoreFilteredSongsToDisplay();
});

//Save Playlist
document.getElementById('save-songs-to-playlist').addEventListener('click', function() {
    var playlistName = document.getElementById("playlist-name").value;
    var access_token = document.getElementById("access_token").innerText;
    var userId = document.getElementById("user-id").innerText;
    var dataPackage = JSON.stringify({"name":playlistName, "description":"Created By Me"});

    if(playlistName != "")
    {
        var playlistToAddTo = playlistNames.find(p => p.name == playlistName);
        if(playlistToAddTo != undefined)
        {
            var emptyTrackList = [];
            AddSongsToExistingPlaylist(playlistToAddTo.id, emptyTrackList, 0);
        } else {
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
                    AddSongsToPlaylist(playlistId, filteredSongs, 0, false);
                }
            });
        }
    }
}, false);

function AddSongsToPlaylist(playlistId, songsToAdd, offset, isUpdating){
    $('#save-progress-status').show();
    var progress = document.getElementById("saving-playlist");
    progress.max = songsToAdd.length;
    progress.value = offset;

    var access_token = document.getElementById("access_token").innerText;
    var userId = document.getElementById("user-id").innerText;

    var limit = offset + 100 > songsToAdd.length ? songsToAdd.length - offset : 100; 
    var songsToAddUris = songsToAdd.map(property("uri")).slice(offset, offset + limit);
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
                AddSongsToPlaylist(playlistId, songsToAdd, offset + 100, isUpdating);
            else
            {
                isUpdating ? $('#updated-message').show() : $('#saved-message').show();
                $('#save-progress-status').hide();
            }
        }
    });
}

function AddSongsToExistingPlaylist(playlistId, tracksOfPlaylist, offset) {
    $.ajax({
        url: "https://api.spotify.com/v1/playlists/" + playlistId + "/tracks?offset=" + offset,
        async: false,
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
            tracksOfPlaylist = tracksOfPlaylist.concat(response.items);
            if(offset + 100 < response.total){
                var newOffset = offset + 100;
                return getPlaylistTracksFromOffset(playlistId, tracksOfPlaylist, newOffset);
            } else {
                var tracksNotInPlaylist = filteredSongs.filter(function (track) {
                    return !tracksOfPlaylist.some(t => {
                        return t.track.id == track.id;
                    });
                });
                AddSongsToPlaylist(playlistId, tracksNotInPlaylist, 0, true);
            }
        }
    });
}

//Get Matching songs
document.getElementById('compare-user-data').addEventListener('click', function() {
    matchingSongs = allUsersSongs[0].filter(function (track) {
        var match = false;
        allUsersSongs[1].forEach(t => {
            if(t.id == track.id)
            {
                match = true;
            }
        });
        return match;
    });

    DisplayMatchingSongs();

    $('#select-matching-songs').show();

}, false);

function DisplayMatchingSongs(){
    setMatchingSongCount(matchingSongs.length);
    var tracksHtml = matchingSongs.map(function (track) {
        return matchingTracksTemplate(track);
    }).join('');
    matchingTracksPlaceholder.innerHTML = tracksHtml;
}

function setMatchingSongCount(trackCount){
    document.getElementById("matching-song-count").innerText = "Number of Matching Songs: " +  trackCount;
}

//Save matching songs to playlist
document.getElementById('save-matching-songs-to-playlist').addEventListener('click', function() {
    var playlistName = document.getElementById("matching-playlist-name").value;
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
                AddSongsToMatchingPlaylist(playlistId, 0);
            }
        });
    }
}, false);

function AddSongsToMatchingPlaylist(playlistId, offset){
    $('#save-matching-progress-status').show();
    var progress = document.getElementById("saving-matching-playlist");
    progress.max = matchingSongs.length;
    progress.value = offset;

    var access_token = document.getElementById("access_token").innerText;
    var userId = document.getElementById("user-id").innerText;

    var limit = offset + 100 > matchingSongs.length ? matchingSongs.length - offset : 100; 
    var songsToAddUris = matchingSongs.map(property("uri")).slice(offset, offset + limit);
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
                AddSongsToMatchingPlaylist(playlistId, offset + 100);
            else
            {
                $('#saved-matching-message').show();
                $('#save-matching-progress-status').hide();
                sessionStorage.setItem(filteredSongsLocalStorage, "[]");
                sessionStorage.setItem(usersTrackedLocalStorage, "[]");
            }
        }
    });
}

//Removal Functions
function removePlaylist(element)
{
    if(element.id == -1)
    {
        getSavedSongs = false;
    } else { 
        playlists = playlists.filter(function(value, index, arr){ return value.id != element.id;});
        document.getElementById("playlist-count").innerText = "Number of Playlists Found: " +  (playlists.length + (getSavedSongs ? 1 : 0));
    }

    element.remove();
}

function removeSong(element)
{
    filteredSongs = filteredSongs.filter(function(value, index, arr){ return value.id != element.id;});
    setFilterSongCount(filteredSongs.length);
    StopSample(element);
    element.remove();
}

function PlaySample(element){
    var audio = document.getElementById("audio-" + element.id);
    audio.play();
}

function StopSample(element) {
    var audio = document.getElementById("audio-" + element.id);
    audio.pause();
    // audio.currentTime = 0;
}

//Helpers
function property(key){
    return function(x){
        return x != null ? x[key] : null;
    }
}

function twoProperty(key1, key2){
    return function(x){
        return x != null ? {[key1]: x[key1], [key2]: x[key2]} : null;
    }
}

function flatten(a,b){
    return a.concat(b);
}