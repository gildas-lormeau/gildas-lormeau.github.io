(() => {

    const VIDEO_FILENAME = "0001-0718.mp4";
    const VIDEO_FPS = 15;
    const VIDEO_TIME_OFFSET = 0.0125;

    const viewerElement = document.getElementById("viewer");
    const progressElement = document.getElementById("progress");
    const formElement = document.forms[0];
    let images, width, height, maxFrames, fps, workers, animationFrameId;

    formElement.onsubmit = async event => {
        images = [];
        width = Number(formElement.width.value);
        height = Number(formElement.height.value);
        maxFrames = Number(formElement.count.value) - 1;
        workers = Number(formElement.workers.value);
        fps = VIDEO_FPS / (360 / (maxFrames + 1));
        event.preventDefault();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        progressElement.hidden = false;
        viewerElement.hidden = true;
        progressElement.value = 0;
        progressElement.max = maxFrames;
        await decodeFrames();
        progressElement.hidden = true;
        viewerElement.hidden = false;
        viewImages();
    };

    function decodeFrames() {
        const workerPromises = [];
        for (let index = 0; index < workers; index++) {
            workerPromises.push(workerDecodeFrames(index / fps));
        }
        return Promise.all(workerPromises);
    }

    function workerDecodeFrames(startTime) {
        return new Promise((resolve, reject) => {
            const videoElement = document.createElement("video");
            const canvasElement = document.createElement("canvas");
            canvasElement.width = viewerElement.width = width;
            canvasElement.height = viewerElement.height = height;
            videoElement.src = VIDEO_FILENAME;
            videoElement.onerror = reject;
            videoElement.oncanplay = () => oncanplay(videoElement, startTime);
            videoElement.onseeked = () => onseeked(videoElement, canvasElement.getContext("2d"), () => {
                videoElement.onseeked = null;
                resolve();
            });
        });
    }

    function oncanplay(videoElement, startTime) {
        videoElement.oncanplay = null;
        videoElement.currentTime = startTime + VIDEO_TIME_OFFSET;
    };

    function onseeked(videoElement, decoderContext, callback) {
        decoderContext.drawImage(videoElement, 0, 0, width, height);
        const currentFrame = Math.floor(videoElement.currentTime * fps);
        images[currentFrame] = decoderContext.getImageData(0, 0, width, height);
        progressElement.value++;
        if (currentFrame < maxFrames) {
            videoElement.currentTime = Math.min(((currentFrame + workers) / fps) + VIDEO_TIME_OFFSET, videoElement.duration);
        } else {
            callback();
        }
    }

    function viewImages(frameNumber = 0) {
        animationFrameId = requestAnimationFrame(() => {
            viewerElement.getContext("2d").putImageData(images[frameNumber], 0, 0);
            viewImages((frameNumber + 1) % maxFrames);
        });
    }

})();