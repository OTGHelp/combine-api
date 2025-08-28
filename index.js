const express = require('express');
const { exec } = require('child_process');
<<<<<<< HEAD
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
=======
const ffmpegPath = require('ffmpeg-static');
>>>>>>> 9abf618d5436a934c9f04d231195e5099d864d52
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.post('/combine', async (req, res) => {
  try {
    const { audioUrl, imageUrl } = req.body;
<<<<<<< HEAD
=======

>>>>>>> 9abf618d5436a934c9f04d231195e5099d864d52
    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or imageUrl' });
    }

    const outputPath = path.join('/tmp', 'output.mp4');
<<<<<<< HEAD
    const cmd = `"${ffmpeg.path}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
=======
    const cmd = `"${ffmpegPath}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;
>>>>>>> 9abf618d5436a934c9f04d231195e5099d864d52

    exec(cmd, (error) => {
      if (error) {
        console.error('FFmpeg Error:', error);
        return res.status(500).json({ error: 'Video creation failed' });
      }

<<<<<<< HEAD
      const video = fs.readFileSync(outputPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.send(video);
=======
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
>>>>>>> 9abf618d5436a934c9f04d231195e5099d864d52
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Combine API running on port ${PORT}`));
<<<<<<< HEAD
=======

module.exports = app; // <-- IMPORTANT for Vercel
>>>>>>> 9abf618d5436a934c9f04d231195e5099d864d52
