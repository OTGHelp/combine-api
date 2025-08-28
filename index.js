const express = require('express');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.post('/combine', async (req, res) => {
  try {
    const { audioUrl, imageUrl } = req.body;

    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or imageUrl' });
    }

    const outputPath = path.join('/tmp', 'output.mp4');
    const cmd = `"${ffmpegPath}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;

    exec(cmd, (error) => {
      if (error) {
        console.error('FFmpeg Error:', error);
        return res.status(500).json({ error: 'Video creation failed' });
      }

      try {
        // Read the video file
        const video = fs.readFileSync(outputPath);

        // Set headers for Vercel
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="combined-video.mp4"');
        res.send(video);
      } catch (readErr) {
        console.error('Read Error:', readErr);
        return res.status(500).json({ error: 'Could not read video file' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Combine API running on port ${PORT}`));

module.exports = app; // <-- IMPORTANT for Vercel
