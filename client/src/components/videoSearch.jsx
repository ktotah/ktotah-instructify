import { useState } from 'react';
import axios from 'axios';
import { useMutation } from '@apollo/client'; // Import useMutation
import { SAVE_VIDEO_TO_TUTORIAL } from '../utils/mutations';

// setting our constant for the API key
const YOUTUBE = 'https://www.googleapis.com/youtube/v3/search';

// This function will make a GET request to the YouTube API and return a list of videos matching the search term.
export async function getVideos(searchTerm) {
  // We will use the API key from our .env file
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  console.log('Using API Key:', apiKey); // Debugging statement to check if API key is being read correctly

  // trying to get the data from the API
  try {
    // We will use the axios library to make a GET request to the YouTube API
    const response = await axios.get(YOUTUBE, {
      // then we set out query parameters
      params: {
        part: 'snippet',
        q: searchTerm,
        type: 'video',
        maxResults: 10,
        key: apiKey,
      },
    });
    // We will return the data from the API
    return response.data.items;
    // If there is an error, we will log it and throw it
  } catch (error) {
    console.error('Error fetching videos from YouTube API:', error);
    if (error.response && error.response.status === 403) {
      console.error('Access to YouTube API forbidden. Check your API key and permissions.');
    }
    throw error;
  }
}

// export functions to handle the form submission
export default function VideoSearch() {
  // We will set up our state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [error, setError] = useState(null);

  // set a function to handle save video using mutation
  const [saveVideo] = useMutation(SAVE_VIDEO_TO_TUTORIAL, {
    onCompleted: () => alert('Video saved to your tutorials!'),
    onError: (error) => alert('Error saving video: ' + error.message),
  });

  // We will set up our event handlers
  const handleInputChange = (event) => {
    // We will set the search term to the value of the input field
    setSearchTerm(event.target.value);
  };

  // setting our prevent default function to stop the form from reloading the page
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // We will make a GET request to the YouTube API
    try {
      // We will set the state of the videos to the data returned from the API
      const fetchedVideos = await getVideos(searchTerm);
      // We will set the state of the videos to the data returned from the API
      setVideos(fetchedVideos);
      // We will set the state of the selectedVideoId to null
      setSelectedVideoId(null);
    } catch (error) {
      setError('Error fetching videos: ' + error.message);
    }
  };

  // This function will handle the video click event
  const handleVideoClick = (videoId) => {
    setSelectedVideoId(videoId);
  };

  // handling the save button for the video
  const handleSaveVideo = (video) => {
    saveVideo({
      variables: {
        title: video.snippet.title,
        videoId: video.id.videoId,
        thumbnail: video.snippet.thumbnails.default.url,
        content: 'Default content for the tutorial.',
      },
    });
  };

  return (
    <div>
      <h2>Video Search Page</h2>
      <form onSubmit={handleFormSubmit}>
        <input
          type="text"
          placeholder="Search for videos"
          value={searchTerm}
          onChange={handleInputChange}
          className="form-control mb-2"
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      <ul className="mt-3">
        {Array.isArray(videos) && videos.length > 0 ? (
          videos.map((video) => (
            <li key={video.id.videoId} style={{ cursor: 'pointer' }}>
              <div onClick={() => handleVideoClick(video.id.videoId)}>
                <h3>{video.snippet.title}</h3>
                {selectedVideoId === video.id.videoId ? (
                  <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                    frameBorder="0"
                    // acelerometer and gyroscope are needed for the video to work on mobile devices
                    // autoplay is needed for the video to start playing automatically
                    // allowFullScreen is needed for the video to be full screen
                    // picture in picture is needed for the video to be in picture in picture mode
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Selected Video"
                  ></iframe>
                ) : (
                  <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
                )}
              </div>
              <button className="btn btn-secondary mt-2" onClick={() => handleSaveVideo(video)}>
                Save to My Tutorials
              </button>
            </li>
          ))
        ) : (
          <li>No videos found</li>
        )}
      </ul>
    </div>
  );
}
