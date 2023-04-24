  import React from 'react';
  import { useRouter } from "next/router"
  import { getAccessToken } from './api';

  const client_id = '6df6b59cb94b4bfbb76803a2092a11ee';
  const client_secret = 'd4e56a8f3ba0415788089db89d49b931';
  const redirect_uri = 'http://localhost:3000/dashboard'


  const Dashboard = () => {
    const router = useRouter(); 
    const [songQuery, setSongQuery] = React.useState('');
    const [playlistQuery, setPlaylistQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [searchPlaylistResults, setSearchPlaylistResults] = React.useState([]); 
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTrack, setCurrentTrack] = React.useState(null);
    const [currentPlaylist, setCurrentPlaylist] = React.useState(null);
    const [currentPlaylistTracks, setCurrentPlaylistTracks] = React.useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = React.useState(0);
    const [tokenData, setTokenData] = React.useState(router.query.data ? router.query.data : null);
    const [deviceId, setDeviceId] = React.useState(null);
    const [accessToken, setAccessToken] = React.useState('');
    
    React.useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      try {
        if (tokenData) {
          const code = tokenData.code; 
          const newAccessToken = await fetchAccessToken(code);
          setAccessToken(newAccessToken.access_token);
          // setDeviceId(deviceId);
        }
      } catch (error) {
        console.error('Error getting data:', error.message);
      }
    };



    const fetchAccessToken = async (code) => {
      try {
        console.log(router.query.data); 
        const data = {
          redirect_uri: redirect_uri,
          grant_type: 'client_credentials',
          client_id: client_id,
          client_secret: client_secret
        }
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`
          },
          body: new URLSearchParams(data),
        });
    
        const tokenData = await response.json();
        const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    
        
        const accessToken = {
          ...tokenData.access_token,
          expires_at: expiresAt
        };
        
        setTokenData(accessToken); 
        setAccessToken(accessToken.access_token);
        return accessToken;
      } catch (error) {
        console.error('Error getting token data:', error.message);
        return null;
      }
    };
      


    const handleSearch = (e) => {
      e.preventDefault();
      fetch(`https://api.spotify.com/v1/search?q=${songQuery}&type=track`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.json())
      .then((data) => {
        setSearchResults(data.tracks.items);
      })
      .catch((error) => console.log(error));
    };
    
    
    const handlePlayTrack = async (track) => {
      try {
        const { access_token, refresh_token } = tokenData;  
        const player = new Spotify.Player({
          name: 'Web Playback SDK Quick Start Player',
          getOAuthToken: cb => { cb(access_token); }
        });
    
        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uris: [track.uri]
            })
          }).then(response => {
            if (response.ok) {
              setIsPlaying(true);
              setCurrentTrack(track);
    
              // Check if the track is in the current playlist
              if (
                currentPlaylist &&
                currentPlaylistTracks.some((t) => t.track.uri === track.uri)
              ) {
                const index = currentPlaylistTracks.findIndex((t) => t.track.uri === track.uri);
                setCurrentTrackIndex(index);
              }
            } else {
              console.error('Error playing track:', response.status);
            }
          });
        });
    
        player.connect();
      } catch (error) {
        console.error('Error playing track:', error.message);
      }
    };
    
    const handlePauseTrack = async () => {
      try {
        const { access_token, refresh_token } = tokenData;

        const player = new Spotify.Player({
          name: 'Web Playback SDK Quick Start Player',
          getOAuthToken: cb => { cb(access_token); }
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          player.togglePlay();
          setIsPlaying(false);
        });

        player.connect();
      } catch (error) {
        console.error('Error pausing track:', error.message);
      }
    };
    

    const handleSearchPlaylist = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${playlistQuery}&type=playlist`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        const data = await response.json();
        setSearchPlaylistResults(data.playlists.items);
      } catch (error) {
        console.error('Error searching for playlists:', error.message);
      }
    };

    const handlePlayPlaylist = async (playlist) => {
      try {
        // Initialize the Spotify SDK
        const { Player } = window.Spotify;
        const player = new Player({
          name: 'My Spotify Player',
          getOAuthToken: async (callback) => {
            const tokenData = await getAccessToken(); // Assuming this function exists to get the token data
            callback(tokenData.access_token);
          },
        });
    
        // Connect to the player and play the playlist
        await player.connect();
        await player.pause();
        await player.clearQueue();
        await player.play({
          context_uri: `spotify:playlist:${playlist.id}`,
        });
    
        // Update the current playlist and tracks
        setCurrentPlaylist(playlist);
        setCurrentPlaylistTracks([]);
        setCurrentTrack(null);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing playlist:', error.message);
      }
    };
    
    const handleSkipTrack = async () => {
      if (currentTrackIndex + 1 >= currentPlaylistTracks.length) {
        return;
      }
    
      try {
        await player.nextTrack();
        const nextTrackIndex = currentTrackIndex + 1;
        setCurrentTrack(currentPlaylistTracks[nextTrackIndex].track);
        setCurrentTrackIndex(nextTrackIndex);
      } catch (error) {
        console.error('Error skipping track:', error.message);
      }
    };
    
    return (
      <div>
        <form onSubmit={(e) => handleSearch(e, accessToken)}>
          <label>
            Search for a song: 
            <input type="text" value={songQuery} onChange={(e) => setSongQuery(e.target.value)} />
          </label>
          <button type="submit">Search</button>
        </form>
        {searchResults.length > 0 && (
          <div>
            <h2>Song Results:</h2>
            <ul>
              {searchResults.map((track) => (
                <li key={track.id}>
                  {track.name} - {track.artists[0].name}{' '}
                  <button onClick={() => handlePlayTrack(track)}>Play</button>
                </li>
              ))}
            </ul>
          </div>
        )}
    
        <form onSubmit={(e) => handleSearchPlaylist(e, accessToken, playlistQuery)}>
          <label>
            Search for a playlist:
            <input type="text" value={playlistQuery} onChange={(e) => setPlaylistQuery(e.target.value)} />
          </label>
          <button type="submit">Search</button>
        </form>
    
        {searchPlaylistResults.length > 0 && (
          <div>
            <h2>Playlist Results:</h2>
            <ul>
              {searchPlaylistResults.map((playlist) => (
                <li key={playlist.id}>
                  {playlist.name} - {playlist.owner.display_name}{' '}
                  <button onClick={() => handlePlayPlaylist(playlist)}>Play</button>
                </li>
              ))}
            </ul>
          </div>
        )}
    
        {currentPlaylist && (
          <div>
            <h2>Now Playing:</h2>
            <p>{currentTrack.name} - {currentTrack.artists[0].name}</p>
            <button onClick={handleSkipTrack}>Skip</button>
            {isPlaying ? (
              <button onClick={handlePauseTrack}>Pause</button>
            ) : (
              <button onClick={() => handlePlayTrack(currentTrack)}>Play</button>
            )}
          </div>
        )}
      </div>
    );  
  };
  export default Dashboard;