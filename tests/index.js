(async () => {

    const WIDTH = 1920;
    const HEIGHT = 1080;
    const VIDEO_FPS = 30;
    const MAX_FRAMES = 359;
    const VIDEO_FILENAME = "0001-0359.mp4";
    const WORKERS = 8;

    const viewer = document.getElementById("viewer");
    const progress = document.getElementById("progress");
    const images = [];

    await decodeFrames();
    progress.remove();
    viewer.hidden = false;
    viewImages();

    function decodeFrames() {
        const promises = [];
        for (let index = 0; index < WORKERS; index++) {
            promises.push(workerDecodeFrames(index / VIDEO_FPS));
        }
        return Promise.all(promises);
    }

    function workerDecodeFrames(startTime) {
        return new Promise(resolve => {
            const loader = document.createElement("video");
            const decoder = document.createElement("canvas");
            const decoderContext = decoder.getContext("2d");
            loader.addEventListener("canplay", loadImages);
            decoder.width = WIDTH;
            decoder.height = HEIGHT;
            viewer.width = WIDTH;
            viewer.height = HEIGHT;
            loader.src = VIDEO_FILENAME;

            function loadImages() {
                loader.removeEventListener("canplay", loadImages);
                loader.addEventListener("seeked", captureFrame);
                loader.currentTime = startTime;
            }

            function captureFrame() {
                decoderContext.drawImage(loader, 0, 0, WIDTH, HEIGHT);
                const imageData = decoderContext.getImageData(0, 0, WIDTH, HEIGHT);
                const currentFrame = Math.round(loader.currentTime * VIDEO_FPS);
                images[currentFrame] = imageData;
                progress.value++;
                if (loader.currentTime < loader.duration) {
                    loader.currentTime = (currentFrame + WORKERS) / VIDEO_FPS;
                } else {
                    loader.removeEventListener("seeked", captureFrame);
                    resolve();
                }
            }
        });
    }

    function viewImages(frameNumber = 0) {
        requestAnimationFrame(() => {
            viewer.getContext("2d").putImageData(images[frameNumber], 0, 0);
            viewImages((frameNumber + 1) % MAX_FRAMES);
        });
    }

})();