const express = require('express');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('✅ Combine API is running');
});

app.post('/combine', async (req, res) => {
  try {
    const { audioUrl, imageUrl } = req.body;

    // Validate required inputs
    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or imageUrl' });
    }

    // Vercel serverless environment: Use /tmp for temporary storage
    const outputPath = path.join('/tmp', `output_${Date.now()}.mp4`);

    // Build ffmpeg command
    const cmd = `"${ffmpegPath}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" \
-c:v libx264 -tune stillimage -c:a aac -b:a 192k \
-pix_fmt yuv420p -shortest "${outputPath}"`;

    // Execute ffmpeg command
    exec(cmd, (error) => {
      if (error) {
        console.error('❌ FFmpeg Error:', error);
        return res.status(500).json({ error: 'Video creation failed' });
      }

      try {
        // Read generated video
        const video = fs.readFileSync(outputPath);

        // Send as mp4
        res.setHeader('Content-Type', 'video/mp4');
        res.send(video);
      } catch (readErr) {
        console.error('❌ Read Error:', readErr);
        res.status(500).json({ error: 'Error reading output video' });
      }
    });
  } catch (err) {
    console.error('❌ Internal Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Key change for Vercel: Export the app instead of app.listen()
module.exports = app;
