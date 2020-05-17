(() => {

    const VIDEO_FPS = {
        "0001-0359.mp4": 60,
        "0001-0718.mp4": 15,
        "0001-0718-SD.mp4": 15,
    }
    const VIDEO_MAX_FRAMES = 360;
    const VIDEO_TIME_OFFSET = 0.001;

    const viewerElement = document.getElementById("viewer");
    const progressElement = document.getElementById("progress");
    const formElement = document.forms[0];
    let images, filename, width, height, maxFrames, fps, workers, animationFrameId;

    formElement.onsubmit = async event => {
        images = [];
        filename = formElement.filename.value;
        width = Number(formElement.width.value);
        height = Number(formElement.height.value);
        maxFrames = Number(formElement.count.value) - 1;
        workers = Number(formElement.workers.value);
        fps = (VIDEO_FPS[filename] / VIDEO_MAX_FRAMES) * (maxFrames + 1);
        event.preventDefault();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        progressElement.hidden = false;
        viewerElement.hidden = true;
        progressElement.value = 0;
        progressElement.max = maxFrames;
        await decodeFrames(() => progressElement.value++);
        progressElement.hidden = true;
        viewerElement.hidden = false;
        viewImages();
    };

    function decodeFrames(progressCallback) {
        const workerPromises = [];
        for (let indexWorker = 0; indexWorker < workers; indexWorker++) {
            workerPromises.push(new Promise((resolve, reject) => {
                const videoElement = document.createElement("video");
                const canvasElement = document.createElement("canvas");
                const contextCanvasElement = canvasElement.getContext("2d");
                canvasElement.width = viewerElement.width = width;
                canvasElement.height = viewerElement.height = height;
                videoElement.src = filename;
                videoElement.onerror = reject;
                videoElement.oncanplay = () => {
                    videoElement.oncanplay = null;
                    videoElement.currentTime = (indexWorker / fps) + VIDEO_TIME_OFFSET;
                };
                videoElement.onseeked = () => onseeked(videoElement, contextCanvasElement, progressCallback, () => {
                    videoElement.onseeked = null;
                    resolve();
                })
            }));
        }
        return Promise.all(workerPromises);
    }

    function onseeked(videoElement, decoderContext, progressCallback, endCallback) {
        decoderContext.drawImage(videoElement, 0, 0, width, height);
        const currentFrame = Math.floor(videoElement.currentTime * fps);
        images[currentFrame] = decoderContext.getImageData(0, 0, width, height);
        progressCallback(currentFrame);
        if (currentFrame < maxFrames) {
            videoElement.currentTime = Math.min(((currentFrame + workers) / fps) + VIDEO_TIME_OFFSET, videoElement.duration);
        } else {
            endCallback();
        }
    }

    function viewImages(frameNumber = 0) {
        animationFrameId = requestAnimationFrame(() => {
            viewerElement.getContext("2d").putImageData(images[frameNumber], 0, 0);
            viewImages((frameNumber + 1) % maxFrames);
        });
    }

})();