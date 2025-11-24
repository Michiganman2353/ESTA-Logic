import { z } from 'zod';
/**
 * API Types and Schemas
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    metadata?: {
        timestamp: string;
        requestId?: string;
        page?: number;
        totalPages?: number;
        totalItems?: number;
    };
}
export declare const ApiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown;
    }, {
        code: string;
        message: string;
        details?: unknown;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
        totalItems: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown;
    }, {
        code: string;
        message: string;
        details?: unknown;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
        totalItems: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown;
    }, {
        code: string;
        message: string;
        details?: unknown;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
        totalItems: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
        totalItems?: number | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export interface ErrorResponse {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}
export declare const ErrorResponseSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    statusCode: z.ZodNumber;
    details: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}, {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}>;
//# sourceMappingURL=api.d.ts.map