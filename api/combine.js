import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioUrl, imageUrl } = req.body;
  if (!audioUrl || !imageUrl) {
    return res.status(400).json({ error: 'Missing audioUrl or imageUrl' });
  }

  try {
    // Temporary storage in Vercel serverless /tmp directory
    const outputPath = path.join('/tmp', 'output.mp4');
    const cmd = `"${ffmpegPath}" -loop 1 -i "${imageUrl}" -i "${audioUrl}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;

    await new Promise((resolve, reject) => {
      exec(cmd, (error) => {
        if (error) {
          console.error('FFmpeg error:', error);
          return reject(error);
        }
        resolve();
      });
    });

    const video = fs.readFileSync(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Video creation failed' });
  }
}
