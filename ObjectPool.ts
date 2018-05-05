export interface IPoolable {
    reset(): void;
    release(): void;
}

export class ObjectPool {
    private static objects: { [type: string]: any[]; } = {};

    static get<T extends IPoolable>(ctor: { new(): T; }): T {
        let typeName = (<any>ctor).name;
        if (!ObjectPool.objects[typeName]) {
            ObjectPool.objects[typeName] = [];
        }

        let object: T = ObjectPool.objects[typeName].pop();
        if (object) {
            object.reset();
        } else {
            object = new ctor();
            object.release = () => {
                ObjectPool.objects[typeName].push(object);
            };
        }

        return object;
    }
}
