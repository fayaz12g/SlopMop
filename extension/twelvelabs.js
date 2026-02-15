const { TwelveLabs } = require('twelvelabs-js');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 9603;

const ytDlpWrap = new YTDlpWrap('./bin/yt-dlp.exe'); // Adjust the path to yt-dlp as needed (Windows - yt-dlp.exe; Linux - yt-dlp_linux; Mac - yt-dlp_macos); For Limux/Mac, make sure to have ffmpeg installed (bash command: `ffmpeg -version`)
const client = new TwelveLabs({ apiKey: 'API KEY' });
// const textPrompt = "Analyze this video for common AI artifacts like unnatural movements, flickering textures, or warped backgrounds, and state in one sentence whether it appears to be AI-generated and why.";
const textPrompt = "Is this video AI-generated? State in one sentence whether it appears to be AI-generated and why.";


// Middleware
app.use(cors()); // Allows the browser extension to talk to localhost
app.use(express.json()); // Parses the JSON body of the request

async function downloadVideo(url, outputFile, durationSeconds) {
    try {
        const stdout = await ytDlpWrap.execPromise([
            url,
            '--download-sections', `*0-${durationSeconds}`,
            '--force-keyframes-at-cuts',
            '-f', 'b[ext=mp4]',
            '-o', outputFile,
        ]);

        console.log('Download completed successfully.');
        return stdout;
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}


//Main logic
async function runAnalysis(videoUrl) {
    const tempFile = path.join(__dirname, `temp_${Date.now()}.mp4`);
    
    try {
        // Invoke the download function
        await downloadVideo(videoUrl, tempFile, 5);

        console.log("Starting Twelve Labs upload...");
        
        // Upload
        const task = await client.tasks.create({
            indexId: '6990edbe6b6b27483e8324cd',
            videoFile: fs.createReadStream(tempFile),
        });

        console.log(`Task created (ID: ${task.id}). Waiting for indexing...`);
        
        // Wait for ready status
        const completed = await client.tasks.waitForDone(task.id, (t) => {
            console.log(`Status: ${t.status}`);
        });

        if (completed.status !== 'ready') {
            throw new Error(`Indexing failed with status: ${completed.status}`);
        }

        console.log("Running analysis...");
        
        const result = await client.analyze({
            videoId: completed.videoId,
            prompt: textPrompt
        });

        return JSON.stringify({"Analysis Result" : result.data}, null, 2);

    } catch (error) {
        console.error("Pipeline Error:", error.message);
        throw error;
    } finally {
        // Cleanup happens regardless of success or failure
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log("Cleaned up temporary video file.");
        }
    }
}


// API Endpoint
app.post('/analyze', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: "Missing videoUrl in request body" });
    }

    console.log(`Received request for: ${videoUrl}`);
    const timerLabel = `Total Analysis for ${videoUrl}`;
    console.time(timerLabel);

    try {
        const result = await runAnalysis(videoUrl);
        console.timeEnd(timerLabel);
        
        res.send(result); 

    } catch (error) {
        console.timeEnd(timerLabel);
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
});

