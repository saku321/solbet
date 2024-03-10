namespace NodeJS {
    interface ProcessEnv {
        SECRET_KEY: string;
        USER: string,
        HOST: string,
        PASSWORD: string,
        DATABASE:string,
    }
    declare module "*.png" {
        const value: any;
        export = value;
    }
    declare module "*.jpg" {
        const value: any;
        export = value;
    }
}