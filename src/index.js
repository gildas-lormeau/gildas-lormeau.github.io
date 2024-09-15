const ANIMATION_DURATION = 250;
const ANIMATION_ROTATION_STEP = 90;
const TOTAL_ANIMATION_ROTATION = 360;
const TOTAL_ANIMATION_DURATION = (TOTAL_ANIMATION_ROTATION / ANIMATION_ROTATION_STEP) * ANIMATION_DURATION;
const ANIMATION_OPTIONS = { fill: "forwards" };
const NO_DURATION = 0;
const NO_DELAY = 0;
const THREE_QUARTER_VALUE = .75;

const RotationAnimation = (() => {

    const START_ROTATION = 0;

    return class {
        constructor(element, breakPoints = []) {
            this.element = element;
            this.breakPoints = breakPoints;
        }

        async animate() {
            await animateNext(this.element, this.breakPoints);
        }
    };

    async function animateNext(element, breakPoints, currentRotation = START_ROTATION) {
        currentRotation += ANIMATION_ROTATION_STEP;
        await animate(element, currentRotation, ANIMATION_DURATION);
        for (const breakPoint of breakPoints) {
            if (currentRotation == breakPoint.rotation) {
                await breakPoint.callback();
            }
        }
        if (currentRotation < TOTAL_ANIMATION_ROTATION) {
            await animateNext(element, breakPoints, currentRotation);
        } else {
            await animate(element, START_ROTATION);
        }
    }

    async function animate(element, currentRotation, duration = NO_DURATION) {
        const transform = `rotateY(${currentRotation}deg)`;
        const animation = element.animate([{ transform }], { ...ANIMATION_OPTIONS, duration });
        await animation.finished;
    }

})();

const ImageRotationAnimation = (() => {

    const START_IMAGE_INDEX = 0;
    const BREAKPOINT_ROTATION = TOTAL_ANIMATION_ROTATION * THREE_QUARTER_VALUE;

    return class {
        constructor(element, fileIconSources = []) {
            this.element = element;
            this.fileIconSources = fileIconSources;
            this.rotationAnimation = new RotationAnimation(element, [{
                rotation: BREAKPOINT_ROTATION,
                callback: async () => {
                    this.imageIndex = (this.imageIndex + 1) % this.fileIconSources.length;
                    await updateImage(this.element, this.fileIconSources[this.imageIndex]);
                }
            }]);
        }

        async init() {
            this.imageIndex = START_IMAGE_INDEX;
            await updateImage(this.element, this.fileIconSources[this.imageIndex]);
        }

        async animate() {
            await this.rotationAnimation.animate();
        }
    };

    function updateImage(element, src) {
        element.src = src;
        return new Promise(resolve => element.onload = resolve);
    }

})();

const LinkTranslationAnimation = (() => {

    const START_LINK_INDEX = 0;
    const START_TRANSLATION = 0;
    const TRANSLATION_DELAY = TOTAL_ANIMATION_DURATION * THREE_QUARTER_VALUE;
    const LINE_HEIGHT_PROPERTY = "--line-height";

    return class {
        constructor(element) {
            this.element = element;
            this.linkCount = element.childElementCount;
            this.lineHeight = parseFloat(getComputedStyle(element).getPropertyValue(LINE_HEIGHT_PROPERTY));
        }

        init() {
            this.linkIndex = START_LINK_INDEX;
            this.element.appendChild(this.element.firstElementChild.cloneNode(true));
        }

        async animate() {
            this.linkIndex++;
            await animate(this.element, this.linkIndex * this.lineHeight, ANIMATION_DURATION, TRANSLATION_DELAY);
            Array.from(this.element.children).forEach(linkElement => linkElement.tabIndex = -1);
            if (this.linkIndex >= this.linkCount) {
                this.linkIndex = START_LINK_INDEX;
                await animate(this.element);
            }
            document.activeElement.blur();
            this.element.children[this.linkIndex].tabIndex = 0;
        }
    };

    async function animate(element, currentTranslation = START_TRANSLATION, duration = NO_DURATION, delay = NO_DELAY) {
        const transform = `translateY(${-currentTranslation}em)`;
        const animation = element.animate([{ transform }], { ...ANIMATION_OPTIONS, duration, delay, easing: "ease-in-out" });
        await animation.finished;
    }

})();

const MainAnimation = (() => {

    return class {
        constructor(fileIconElement, fileLinkElement, fileIconSources) {
            this.fileIconAnimation = new ImageRotationAnimation(fileIconElement, fileIconSources);
            this.linkAnimation = new LinkTranslationAnimation(fileLinkElement);
            this.animating = false;
        }

        async init() {
            await this.fileIconAnimation.init();
            this.linkAnimation.init();
        }

        async animate() {
            if (!this.animating) {
                this.animating = true;
                await Promise.all([this.fileIconAnimation.animate(), this.linkAnimation.animate()]);
                this.animating = false;
            }
        }
    };

})();

(async () => {

    const fileIconElement = document.querySelector("#file-icon");
    const mainAnimation = new MainAnimation(
        fileIconElement,
        document.querySelector("#links"),
        Array.from(document.querySelectorAll(".file-icons")).map(element => element.src));

    await mainAnimation.init();
    fileIconElement.onmouseenter = fileIconElement.ontouchstart = () => mainAnimation.animate();

})();