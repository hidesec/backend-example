import "reflect-metadata";
import { container, injectable } from "tsyringe";

const BEAN_METADATA_KEY = "custom:bean-methods";

interface BeanDefinition {
    token: string;
    methodName: string;
}

/**
 * 
 * @param token 
 * @returns 
 */
export function Bean(token?: string) {
    return function (target: any, propertyKey?: string, _descriptor?: PropertyDescriptor) {
        if (propertyKey === undefined) {
            injectable()(target);
            const registrationToken = token ?? target.name;
            container.register(registrationToken, { useClass: target });
            return target
        }
        
        const existingBeans: BeanDefinition[] = Reflect.getMetadata(BEAN_METADATA_KEY, target.constructor) || [];

        existingBeans.push({
            token: token ?? propertyKey,
            methodName: propertyKey,
        });

        Reflect.defineMetadata(BEAN_METADATA_KEY, existingBeans, target.constructor);
    }
}

export function Configuration() {
    return function <T extends new (...args: any[]) => any>(target: T): T {
        const instance = new target();

        const beans: BeanDefinition[] = Reflect.getMetadata(BEAN_METADATA_KEY, target) || [];

        if (beans.length === 0) {
            console.warn(`[@Configuration] "${target.name}" has no @Bean methods defined.`);
        }

        beans.forEach(({ token, methodName }) => {
            const beanInstance = (instance as any)[methodName]();
            container.register(token, { useValue: beanInstance });
        });

        return target;
    }
}

