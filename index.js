require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

// Initialize the YouTube Data API client
const youtube = google.youtube("v3");

// Set your API key or OAuth 2.0 credentials
const API_KEY = process.env.API_KEY; // Replace with your API key

// Import the sources from sources.json
const sourcesData = require("./sources.json");
const outputFilename = "output.json";

// Function to retrieve all video data from a playlist
async function getAllVideosFromPlaylist(playlistId) {
  try {
    const videos = [];
    let nextPageToken = null;

    do {
      const response = await youtube.playlistItems.list({
        auth: API_KEY,
        playlistId: playlistId,
        maxResults: 50, // Adjust the number of results per page as needed
        pageToken: nextPageToken,
        part: "snippet",
      });

      const videoItems = response.data.items;
      nextPageToken = response.data.nextPageToken;

      if (videoItems) {
        videoItems.forEach((item) => {
          const videoData = {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnails: item.snippet.thumbnails,
            videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          };
          videos.push(videoData);
        });
      }
    } while (nextPageToken);

    return videos;
  } catch (error) {
    console.error(
      `Error retrieving playlist videos for playlist ${playlistId}:`,
      error.message
    );
    return [];
  }
}

// Function to retrieve all video data from a channel
async function getAllVideosFromChannel(channelId) {
  try {
    const videos = [];
    let nextPageToken = null;

    do {
      const response = await youtube.search.list({
        auth: API_KEY,
        channelId: channelId,
        maxResults: 50, // Adjust the number of results per page as needed
        pageToken: nextPageToken,
        order: "date", // You can change the order if needed (e.g., 'viewCount', 'relevance')
        part: "snippet",
        type: "video",
      });

      const videoItems = response.data.items;
      nextPageToken = response.data.nextPageToken;

      if (videoItems) {
        videoItems.forEach((item) => {
          const videoData = {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnails: item.snippet.thumbnails,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          };
          videos.push(videoData);
        });
      }
    } while (nextPageToken);

    return videos;
  } catch (error) {
    console.error(
      `Error retrieving channel videos for channel ${channelId}:`,
      error.message
    );
    return [];
  }
}

// Main function to retrieve data from both playlist and channel sources
async function main() {
  try {
    const allVideos = [];

    for (const source of sourcesData) {
      if (source.type === "youtube-channel") {
        const channelUrl = source.url;
        const channelId = channelUrl.split("/").pop(); // Extract channel ID from URL
        const channelVideos = await getAllVideosFromChannel(channelId);
        allVideos.push(...channelVideos);
      } else if (source.type === "youtube-playlist") {
        const playlistUrl = source.url;
        const playlistId = playlistUrl.split("list=")[1]; // Extract playlist ID from URL
        const playlistVideos = await getAllVideosFromPlaylist(playlistId);
        allVideos.push(...playlistVideos);
      }
    }

    // Process the combined video data as needed
    console.log(`Total videos retrieved: ${allVideos.length}`);

    // Write the combined video data to output.json
    fs.writeFileSync(outputFilename, JSON.stringify(allVideos, null, 2));
    console.log(`Video data written to ${outputFilename}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

console.log("Gathering youtube video data... 📹");

// Call the main function to start retrieving data
main();
