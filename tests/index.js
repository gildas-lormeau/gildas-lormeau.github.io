(() => {

    const VIDEO_FILENAME = "0001-0718.mp4";
    const VIDEO_FPS = 15;
    const VIDEO_TIME_OFFSET = 0.0125;

    const viewer = document.getElementById("viewer");
    const progress = document.getElementById("progress");
    const form = document.forms[0];
    let images, width, height, maxFrames, fps, workers, animationFrameId;

    form.onsubmit = async event => {
        images = [];
        width = Number(form.width.value);
        height = Number(form.height.value);
        maxFrames = Number(form.count.value) - 1;
        workers = Number(form.workers.value);
        fps = VIDEO_FPS / (360 / (maxFrames + 1));
        event.preventDefault();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        progress.hidden = false;
        viewer.hidden = true;
        progress.value = 0;
        progress.max = maxFrames;
        await decodeFrames();
        progress.hidden = true;
        viewer.hidden = false;
        viewImages();
    };

    function decodeFrames() {
        const promises = [];
        for (let index = 0; index < workers; index++) {
            promises.push(workerDecodeFrames(index / fps));
        }
        return Promise.all(promises);
    }

    function workerDecodeFrames(startTime) {
        return new Promise(resolve => {
            const loader = document.createElement("video");
            const decoder = document.createElement("canvas");
            const decoderContext = decoder.getContext("2d");
            loader.addEventListener("canplay", loadImages);
            decoder.width = viewer.width = width;
            decoder.height = viewer.height = height;
            loader.src = VIDEO_FILENAME;

            function loadImages() {
                loader.removeEventListener("canplay", loadImages);
                loader.addEventListener("seeked", captureFrame);
                loader.currentTime = startTime + VIDEO_TIME_OFFSET;
            }

            function captureFrame() {
                decoderContext.drawImage(loader, 0, 0, width, height);
                const currentFrame = Math.floor(loader.currentTime * fps);
                images[currentFrame] = decoderContext.getImageData(0, 0, width, height);
                progress.value++;
                if (currentFrame < maxFrames) {
                    loader.currentTime = Math.min(((currentFrame + workers) / fps) + VIDEO_TIME_OFFSET, loader.duration);
                } else {
                    loader.removeEventListener("seeked", captureFrame);
                    resolve();
                }
            }
        });
    }

    function viewImages(frameNumber = 0) {
        animationFrameId = requestAnimationFrame(() => {
            viewer.getContext("2d").putImageData(images[frameNumber], 0, 0);
            viewImages((frameNumber + 1) % maxFrames);
        });
    }

})();