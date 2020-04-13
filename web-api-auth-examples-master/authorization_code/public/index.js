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
        return x[key];
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

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

var userPlaylistsSource = document.getElementById('user-playlists-template').innerHTML,
    userPlaylistsTemplate = Handlebars.compile(userPlaylistsSource),
    userPlaylistsPlaceholder = document.getElementById('user-playlists');

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
            url: 'https://api.spotify.com/v1/me/playlists',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {
                var playlists = response.items;
                var playlistTracksApiLinks = playlists.map(property("tracks")).reduce(flatten,[]);
                getTracksFromPlaylists(playlistTracksApiLinks);
            }
        });

        function getTracksFromPlaylists(playlists) {
            var allTracks = [];
            var numList = 0
            playlists.forEach(playlist => {
                $.ajax({
                    url: playlist.href,
                    async: false,
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    success: function(response) {
                        numList++;
                        allTracks = allTracks.concat(response.items);
                        if(numList == 20)
                        {
                            var tracksFlattend = allTracks.map(property("track")).reduce(flatten,[]);
                            var tracksHtml = tracksFlattend.map(function (track) {
                                return userPlaylistsTemplate(track);
                            }).join('');
                            userPlaylistsPlaceholder.innerHTML = tracksHtml;
                        }
                    }
                });
            });
        }
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
}