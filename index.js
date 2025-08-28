const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const port = process.env.PORT || 8005;

app.use(cors());
app.use(express.json());

function tmpFilePath(ext) {
  const safeExt = ext && ext.startsWith('.') ? ext : (ext ? `.${ext}` : '');
  return path.join(
    __dirname,
    `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}${safeExt}`
  );
}

async function downloadToTemp(url, fallbackExt) {
  // Basic Google Drive "preview" link guard — suggest using direct links
  if (/drive\.google\.com\/file\/d\//i.test(url)) {
    throw new Error('Use a direct Google Drive download link (uc?export=download&id=FILE_ID) not a preview page.');
  }

  const extFromUrl = path.extname(new URL(url).pathname) || fallbackExt || '';
  const tmp = tmpFilePath(extFromUrl);

  const resp = await axios.get(url, {
    responseType: 'stream',
    maxRedirects: 5,
    timeout: 60_000,
    headers: {
      'User-Agent': 'combine-api/1.0',
      'Accept': '*/*'
    },
    // If you need auth headers/cookies, add them here
  });

  const ct = (resp.headers['content-type'] || '').toLowerCase();
  if (ct.includes('text/html')) {
    // Likely a preview page / auth wall
    throw new Error('URL returned HTML (probably a preview page). Provide a direct file URL.');
  }

  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(tmp);
    resp.data.pipe(w);
    w.on('finish', resolve);
    w.on('error', reject);
  });

  return tmp;
}

app.post('/combine', async (req, res) => {
  const { audio_url, image_url } = req.body || {};
  if (!audio_url || !image_url) {
    return res.status(400).json({ error: 'Missing audio_url or image_url' });
  }

  let audioPath, imagePath;
  const outPath = path.join(__dirname, `output_${Date.now()}.mp4`);
  const cleanup = () => {
    for (const p of [imagePath, audioPath, outPath]) {
      if (p) try { fs.unlinkSync(p); } catch {}
    }
  };

  try {
    // Download inputs locally (avoids partial content / preview pages)
    imagePath = await downloadToTemp(image_url, '.jpg');
    audioPath = await downloadToTemp(audio_url, '.mp3');

    if (!ffmpegPath) {
      throw new Error('ffmpeg binary not found. Install ffmpeg-static or add ffmpeg to PATH.');
    }

    const args = [
      '-y',
      '-loop', '1',
      '-i', imagePath,
      '-i', audioPath,
      '-c:v', 'libx264',
      '-tune', 'stillimage',
      '-vf', 'scale=1920:-2,format=yuv420p',
      '-c:a', 'aac', '-b:a', '192k',
      '-r', '30',
      '-shortest',
      '-movflags', '+faststart',
      outPath
    ];

    const ff = spawn(ffmpegPath, args, { windowsHide: true });

    ff.stderr.on('data', d => process.stdout.write(d)); // progress
    ff.on('error', (err) => {
      console.error('FFmpeg spawn error:', err.message);
    });

    ff.on('close', code => {
      try { fs.unlinkSync(imagePath); } catch {}
      try { fs.unlinkSync(audioPath); } catch {}

      if (code !== 0) {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
        return res.status(500).json({ error: `ffmpeg exited with code ${code}` });
      }

      res.download(outPath, 'video.mp4', (err) => {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
        if (err) console.error('Download error:', err.message);
      });
    });
  } catch (e) {
    console.error('Combine error:', e.message);
    cleanup();
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Combine API running at http://localhost:${port}`);
});
