import { ConnectionOptions, EntitySchema } from 'typeorm';
import { AppOptions } from '.';
import { SessionProvider } from './client';

export interface Profile {
    id: string;
    name: string;
    email: string;
    image: string;
}

export interface Session {
    userId: string | number | object;
    expires: Date;
    sessionToken: string;
    accessToken: string;
}

export interface VerificationRequest {
    identifier: string;
    token: string;
    expires: Date;
}

export interface SendVerificationRequestParams {
    identifier: string;
    url: string;
    token: string;
    baseUrl: string;
    provider: SessionProvider;
}

export type EmailSessionProvider = SessionProvider & {
    sendVerificationRequest: (params: SendVerificationRequestParams) => Promise<void>;
    maxAge: number | undefined;
};

export interface AdapterInstance<TUser, TProfile, TSession, TVerificationRequest> {
    createUser(profile: TProfile): Promise<TUser>;
    getUser(id: string): Promise<TUser | null>;
    getUserByEmail(email: string): Promise<TUser | null>;
    getUserByProviderAccountId(providerId: string, providerAccountId: string): Promise<TUser | null>;
    updateUser(user: TUser): Promise<TUser>;
    linkAccount(
        userId: string,
        providerId: string,
        providerType: string,
        providerAccountId: string,
        refreshToken: string,
        accessToken: string,
        accessTokenExpires: number,
    ): Promise<void>;
    createSession(user: TUser): Promise<TSession>;
    getSession(sessionToken: string): Promise<TSession | null>;
    updateSession(session: TSession, force?: boolean): Promise<TSession>;
    deleteSession(sessionToken: string): Promise<void>;
    createVerificationRequest?(
        email: string,
        url: string,
        token: string,
        secret: string,
        provider: EmailSessionProvider,
        options: AppOptions,
    ): Promise<TVerificationRequest>;
    getVerificationRequest?(
        email: string,
        verificationToken: string,
        secret: string,
        provider: SessionProvider,
    ): Promise<TVerificationRequest | null>;
    deleteVerificationRequest?(
        email: string,
        verificationToken: string,
        secret: string,
        provider: SessionProvider,
    ): Promise<void>;
}

interface Adapter<TUser = any, TProfile extends Profile = any, TSession extends Session = any, TVerificationRequest extends VerificationRequest = any> {
    getAdapter(appOptions: AppOptions): Promise<AdapterInstance<TUser, TProfile, TSession, TVerificationRequest>>;
}

type Schema<T = any> = EntitySchema<T>['options'];

interface Adapters {
    Default: TypeORMAdapter['Adapter'];
    TypeORM: TypeORMAdapter;
    Prisma: PrismaAdapter;
}

/**
 * TODO: fix auto-type schema
 */

interface TypeORMAdapter<
    A extends TypeORMAccountModel = any,
    U extends TypeORMUserModel = any,
    S extends TypeORMSessionModel = any,
    VR extends TypeORMVerificationRequestModel = any
> {
    Adapter(
        typeOrmConfig: ConnectionOptions,
        options?: {
            models?: {
                Account?: {
                    model: A;
                    schema: Schema<A>;
                };
                User?: {
                    model: U;
                    schema: Schema<U>;
                };
                Session?: {
                    model: S;
                    schema: Schema<S>;
                };
                VerificationRequest?: {
                    model: VR;
                    schema: Schema<VR>;
                };
            };
        },
    ): Adapter<U, Profile, S, VR>;
    Models: {
        Account: {
            model: TypeORMAccountModel;
            schema: Schema<TypeORMAccountModel>;
        };
        User: {
            model: TypeORMUserModel;
            schema: Schema<TypeORMUserModel>;
        };
        Session: {
            model: TypeORMSessionModel;
            schema: Schema<TypeORMSessionModel>;
        };
        VerificationRequest: {
            model: TypeORMVerificationRequestModel;
            schema: Schema<TypeORMVerificationRequestModel>;
        };
    };
}

interface PrismaAdapter {
    Adapter(config: {
        prisma: any;
        modelMapping?: {
            User: string;
            Account: string;
            Session: string;
            VerificationRequest: string;
        };
    }): Adapter;
}

declare const Adapters: Adapters;

declare class TypeORMAccountModel {
    compoundId: string;
    userId: number;
    providerType: string;
    providerId: string;
    providerAccountId: string;
    refreshToken?: string;
    accessToken?: string;
    accessTokenExpires?: Date;

    constructor(
        userId: number,
        providerId: string,
        providerType: string,
        providerAccountId: string,
        refreshToken?: string,
        accessToken?: string,
        accessTokenExpires?: Date,
    );
}

declare class TypeORMUserModel {
    name?: string;
    email?: string;
    image?: string;
    emailVerified?: Date;

    constructor(name?: string, email?: string, image?: string, emailVerified?: Date);
}

declare class TypeORMSessionModel implements Session {
    userId: number;
    expires: Date;
    sessionToken: string;
    accessToken: string;

    constructor(userId: number, expires: Date, sessionToken?: string, accessToken?: string);
}

declare class TypeORMVerificationRequestModel implements VerificationRequest {
    identifier: string;
    token: string;
    expires: Date;

    constructor(identifier: string, token: string, expires: Date);
}

export default Adapters;
export {
    Adapter,
    Adapters,
    TypeORMAdapter,
    TypeORMAccountModel,
    TypeORMUserModel,
    TypeORMSessionModel,
    TypeORMVerificationRequestModel,
    PrismaAdapter,
};
