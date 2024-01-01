const FILE_FORMATS = ["html", "zip", "png"];
const FILE_FOMAT_LABELS = ["an HTML", "a ZIP", "a PNG"];
const FILE_TYPES = ["text/html", "application/zip", "image/png"];
const ANIMATION_DURATION = 250;
const fileIconElement = document.querySelector("#file-icon");
const fileLinkElement = document.querySelector("#file-link");
const fileFormatElement = document.querySelector("#file-format");
let imageIndex = 0;
let animating = false;

updateIcon();

fileIconElement.onmouseenter = async () => {
    if (!animating) {
        animating = true;
        let animation = fileIconElement.animate([
            { transform: "rotateY(90deg)" }
        ], {
            duration: ANIMATION_DURATION,
            iterations: 1,
            fill: "forwards"
        });
        await animation.finished;
        imageIndex = (imageIndex + 1) % 3;
        updateIcon();
        animation = fileIconElement.animate([
            { transform: "rotateY(180deg)" }
        ], {
            duration: ANIMATION_DURATION,
            iterations: 1,
            fill: "forwards"
        });
        await animation.finished;
        animation = fileIconElement.animate([
            { transform: "rotateY(0deg)" }
        ], {
            duration: ANIMATION_DURATION * 2,
            iterations: 1,
            fill: "forwards"
        });
        await animation.finished;
        animating = false;
    }
};

function updateIcon() {
    fileIconElement.src = document.querySelectorAll(".file-icons")[imageIndex].src;
    fileLinkElement.download = "index." + FILE_FORMATS[imageIndex];
    fileLinkElement.type = FILE_TYPES[imageIndex];
    fileFormatElement.textContent = FILE_FOMAT_LABELS[imageIndex];
}