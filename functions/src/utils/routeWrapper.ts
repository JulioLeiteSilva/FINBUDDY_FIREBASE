import { onCall, CallableRequest, HttpsError } from "firebase-functions/v2/https";

export interface AuthenticatedRequest<T = any> {
    uid: string;
    data: T;
    auth?: {
        token?: {
            email?: string;
            [key: string]: any;
        };
    };
}

export type AuthenticatedHandler<TInput = any, TOutput = any> = (
    request: AuthenticatedRequest<TInput>
) => Promise<TOutput>;

export const createAuthenticatedRoute = <TInput = any, TOutput = any>(
    handler: AuthenticatedHandler<TInput, TOutput>,
    options?: {
        successMessage?: string;
        requireData?: boolean;
    }
) => {
    return onCall<TInput>(async (request: CallableRequest<TInput>) => {
        // Authentication check
        if (!request.auth?.uid) {
            throw new HttpsError(
                'unauthenticated',
                'O usuário não está autenticado'
            );
        }

        // Data validation (optional)
        if (options?.requireData && (!request.data || Object.keys(request.data as any).length === 0)) {
            throw new HttpsError(
                'invalid-argument',
                'Dados são obrigatórios'
            );
        }

        try {
            const result = await handler({
                uid: request.auth.uid,
                data: request.data,
                auth: request.auth,
            });

            // Return with optional success message
            if (options?.successMessage) {
                return {
                    message: options.successMessage,
                    data: result,
                };
            }

            return result;
        } catch (error) {
            console.error('Route error:', error);

            // Handle known error types
            if (error instanceof Error) {
                throw new HttpsError(
                    'invalid-argument',
                    error.message
                );
            }

            // Handle unknown errors
            throw new HttpsError(
                'internal',
                'Erro interno do servidor'
            );
        }
    });
};
