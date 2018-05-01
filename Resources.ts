
export class Resources {
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
        img.src = "images/" + fileName;
    }

    public loadSound(name: string, fileName: string): void {
        this.sounds[name] = new Audio("sounds/" + fileName);
    }

    public getImage(name: string): HTMLImageElement {
        return this.images[name];
    }

    public getSound(name: string): HTMLAudioElement {
        return this.sounds[name];
    }

    private onResourceLoaded(): void {
        if (--this.resourcesToLoad === 0) {
            this.finishedCallback();
        }
    }
}
