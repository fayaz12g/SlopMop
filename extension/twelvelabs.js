const { TwelveLabs } = require('twelvelabs-js');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');

const ytDlpWrap = new YTDlpWrap('./bin/yt-dlp.exe'); 
const client = new TwelveLabs({ apiKey: '' });
const textPrompt = "Analyze this video for common AI artifacts like unnatural movements, flickering textures, or warped backgrounds, and state in one sentence whether it appears to be AI-generated and why.";

async function downloadVideo(url, outputFile, durationSeconds) {
    try {
        const stdout = await ytDlpWrap.execPromise([
            url,
            '--download-sections', `*0-${durationSeconds}`,
            '--force-keyframes-at-cuts',
            '-f', 'best',
            '-o', outputFile,
        ]);

        console.log('Download completed successfully.');
        return stdout;
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}


/*
Main logic
 */
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


// =============== Example Usage ===============

// const VideoUrl = 'https://github.com/twelvelabs-io/twelvelabs-developer-experience/raw/refs/heads/main/quickstarts/steve_jobs_introduces_iphone_in_2007.mp4';
// const timerLabel = "Video Analysis Execution Time";
// console.time(timerLabel);

// analysis_result = runAnalysis(VideoUrl)
// console.timeEnd(timerLabel);
/*
{
  "Analysis Result": "The video does not exhibit common AI artifacts such as unnatural movements, flickering textures, or warped backgrounds, and appears to be a genuine, straightforward recording of a 
presentation with consistent visual quality and natural scene behavior, indicating it is not AI-generated."
}
*/
