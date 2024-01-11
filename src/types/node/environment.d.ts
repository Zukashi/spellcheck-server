// environment.d.ts
declare namespace NodeJS {
    export interface ProcessEnv {
        NODE_ENV: string;
        PORT: string;
        COOKIE_SECRET: string;
        COOKIE_PATH: string;
        COOKIE_EXP: string;
        COOKIE_DOMAIN: string;
        SECURE_COOKIE: string;
        JWT_SECRET: string;
        TEXTGEARS_API_KEY: string;

    }
}
