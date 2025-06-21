const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const {google} = require('googleapis');
const API_KEY = process.env.API_KEY;
const cors = require('cors');
//const corsOptions = {origin: ['http://localhost:3000', 'https://orangecyclingstudent.github.io/RandomVideoGenerator/', 'https://orangecyclingstudent.github.io/RandomVideoGenerator']};
app.use(cors());

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

async function youtubeSearchChannel(channelName){
    try{
        const response = await youtube.search.list({
            q:channelName,
            part: 'snippet,id',
            type: 'channel',
            maxResults: 1,
        });

        const items = response.data.items;
        if (items.length > 0) {
            const channelId = items[0].id.channelId;
            return channelId;
        } else {
            throw new Error('No channel found');
        }
    }
    catch(error){
        console.error('Error fetching channel ID:', error);
        throw error;
    }
}

async function youtubeSearchVideo(channelId, mood){
    try{
        const response = await youtube.search.list({
            channelId: channelId,
            q: mood,
            order: 'relevance',
            part: 'snippet,id',
            type: 'video',
            maxResults: 1,
            order: 'date',
        });

        const items = response.data.items;
        if (items.length > 0) {
            const videoId = items[0].id.videoId;
            return videoId;
        } else {
            throw new Error('No videos found');
        }
    }
    catch(error){
        console.error('Error fetching video ID:', error);
        throw error;
    }
}

function getElaboratedMoodQuery(mood) {
  switch (mood.toLowerCase()) {
    case 'funny':
      return 'funny|comedy|hilarious|humor|sketch';
    case 'serious':
      return 'serious|educational|documentary|insightful|informative|deep|thought';
    case 'sad':
      return 'sad|emotional|touching|heartfelt|somber|moving';
    case 'random':
      return '';
    case 'angry':
      return 'angry|frustrated|intense|fiery|passionate|protest';
    default:
      return mood;
  }
}
app.use(express.json());

app.post('/', async (req, res) => {
    const reqData = req.body;
    const creator = reqData.creator;
    const mood = reqData.mood;
    const channelId = await youtubeSearchChannel(creator);
    const moodQuery = getElaboratedMoodQuery(mood);
    const videoId = await youtubeSearchVideo(channelId, moodQuery);
    if (!channelId || !videoId) {
        return res.status(404).json({ error: 'Channel or video not found' });
    }
    //console.log(`Channel ID: ${channelId}, Video ID: ${videoId}`);
    res.status(200).json({
        videoUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`,
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});