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

    // Vercel requires using the /tmp directory for writing files
    const outputPath = path.join('/tmp', `combined-${Date.now()}.mp4`);

    const cmd = `"${ffmpegPath}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" \
      -c:v libx264 -tune stillimage -c:a aac -b:a 192k \
      -pix_fmt yuv420p -shortest "${outputPath}"`;

    exec(cmd, (error) => {
      if (error) {
        console.error('FFmpeg Error:', error);
        return res.status(500).json({ error: 'Video creation failed' });
      }

      // Stream the video file directly to the response
      res.setHeader('Content-Disposition', 'attachment; filename="combined-video.mp4"');
      res.setHeader('Content-Type', 'video/mp4');

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on('end', () => {
        fs.unlinkSync(outputPath); // Cleanup temporary file after sending
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Combine API running on port ${PORT}`));

module.exports = app; // <-- Required for Vercel
