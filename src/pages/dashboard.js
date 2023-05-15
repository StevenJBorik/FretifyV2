  import React from 'react';
  import { useRouter } from "next/router"
  import { Howl, Howler } from 'howler';
  import 'url-polyfill'; 
  import Head from 'next/head';
  import Script from 'next/script';




  



  const client_id = '6df6b59cb94b4bfbb76803a2092a11ee';
  const client_secret = 'd4e56a8f3ba0415788089db89d49b931';
  const redirect_uri = 'http://localhost:3000/dashboard'
  const SpotifyUri = require('spotify-uri');



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
    const [tokenData, setTokenData] = React.useState(router.query.data ? JSON.parse(router.query.data) : null);
    const [deviceId, setDeviceId] = React.useState(null);
    const [accessToken, setAccessToken] = React.useState('');
    const [audioPlayerOptions, setAudioPlayerOptions] = React.useState({});
    const [trackPlayer, setTrackPlayer] = React.useState(null);


    
    React.useEffect(() => {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
      
      fetchData();

    }, []);
    
    

    const fetchData = async () => {
      try { 
          const code = tokenData.access_token; 
          console.log('code:', code);
          setAccessToken(code);
      } catch (error) {
        console.error('Error getting data:', error.message);
      }
    };

    const fetchAudioData = async (url) => {
      try {
        const response = await fetch(url.toString());
        console.log(response);
        const data = await response.arrayBuffer();
        return data;
      } catch (error) {
        console.error('Error fetching audio data:', error.message);
      }
    };    

    const handleSearch = (e) => {
      e.preventDefault();
      console.log(songQuery); 
      console.log(accessToken); 
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
    
    const handlePlayTrack = async (index) => {
      console.log('handlePlayTrack called with index:', index);
    
      try {
        const track = searchResults[index];
    
        if (!track) {
          console.error('Track not found.');
          return;
        }
        
        console.log("track", track); 
        // Pause the current track player, if there is one
        if (trackPlayer) {
          trackPlayer.pause();
        }
    
        // Get the track information using the track URI
        const trackId = track.uri.split(':')[2];
    
        // Create a new Spotify Web Playback SDK instance
        window.onSpotifyWebPlaybackSDKReady = () => {
          const player = new Spotify.Player({
            name: 'Fretify',
            getOAuthToken: (cb) => { cb(accessToken); },
            volume: 0.75
          });
        }  
          
      
        // Connect to the Web Playback SDK
        await Player.connect();
    
        // Play the selected track using the track ID
        await Player.play(`spotify:track:${trackId}`);
    
        // Save the player object as the current track player
        setTrackPlayer(Player);
      } catch (error) {
        console.error('Error playing track:', error.message);
        console.log('Response object:', error.response);
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

    // const handlePlayPlaylist = async (playlist) => {
    //   try {
    //     // Initialize the Spotify SDK
    //     const { Player } = window.Spotify;
    //     const player = new Player({
    //       name: 'My Spotify Player',
    //       getOAuthToken: async (callback) => {
    //         const tokenData = await getAccessToken(); // Assuming this function exists to get the token data
    //         callback(tokenData.access_token);
    //       },
    //     });
    
    //     // Connect to the player and play the playlist
    //     await player.connect();
    //     await player.pause();
    //     await player.clearQueue();
    //     await player.play({
    //       context_uri: `spotify:playlist:${playlist.id}`,
    //     });
    
    //     // Update the current playlist and tracks
    //     setCurrentPlaylist(playlist);
    //     setCurrentPlaylistTracks([]);
    //     setCurrentTrack(null);
    //     setCurrentTrackIndex(0);
    //     setIsPlaying(true);
    //   } catch (error) {
    //     console.error('Error playing playlist:', error.message);
    //   }
    // };
    
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
        <form onSubmit={handleSearch}>
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
              {searchResults.map((track, index) => (
                <li key={track.id}>
                  {track.name} - {track.artists[0].name}{' '}
                  <button onClick={() => handlePlayTrack(index)}>Play</button>
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