export interface IPoolable {
    reset(): void;
}

export class ObjectPool {
    private static objects: { [type: string]: any[]; } = {};

    static get<T extends IPoolable>(ctor: { new(): T; }): T {
        let typeName = (<any>ctor).name;
        if (!ObjectPool.objects[typeName]) {
            ObjectPool.objects[typeName] = [];
        }

        return ObjectPool.objects[typeName].pop() || new ctor();
    }

    static release<T extends IPoolable>(object: T): void {
        object.reset();
        let typeName = (<any>object.constructor).name;
        ObjectPool.objects[typeName].push(object);
    }
}
