
export class Resources {
    private readonly rootPath = "../";

    private finishedCallback: () => void;
    private resourcesToLoad = 0;
    private images: { [name: string]: HTMLImageElement; } = {};
    private sounds: { [name: string]: HTMLAudioElement; } = {};

    constructor(finishedCallback: () => void) {
        this.finishedCallback = finishedCallback;
    }

    public loadImage(name: string, fileName: string): void {
        this.resourcesToLoad++;

        let img = this.images[name] = new Image();
        img.onload = () => this.onResourceLoaded();
        img.src = this.rootPath + "images/" + fileName;
    }

    public loadSound(name: string, fileName: string): void {
        let sound = this.sounds[name] = new Audio(this.rootPath + "sounds/" + fileName);
        sound.load();
    }

    public getImage(name: string): HTMLImageElement {
        return this.images[name];
    }

    public playSound(name: string): void {
        let sound = this.sounds[name];

        try {
            sound.load();
            sound.play();
        } catch (e) { /* ignored */ }
    }

    private onResourceLoaded(): void {
        if (--this.resourcesToLoad === 0) {
            this.finishedCallback();
        }
    }
}
