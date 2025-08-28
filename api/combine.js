// api/combine.js  (CommonJS)
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { audioUrl, imageUrl } = req.body || {};
    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ error: 'Missing audioUrl or imageUrl' });
    }

    const outPath = path.join(os.tmpdir(), `out-${Date.now()}.mp4`);
    const cmd = `"${ffmpegPath}" -hide_banner -loglevel error -y ` +
      `-loop 1 -i "${imageUrl}" -i "${audioUrl}" ` +
      `-c:v libx264 -tune stillimage -preset veryfast -r 1 ` + // keep it fast for serverless
      `-c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outPath}"`;

    await new Promise((resolve, reject) => {
      exec(cmd, (err) => (err ? reject(err) : resolve()));
    });

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="output.mp4"');
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on('close', () => fs.unlink(outPath, () => {}));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Video creation failed', detail: err.message });
  }
};
