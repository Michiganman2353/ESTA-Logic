'use strict';
/**
 * Example API Endpoint Using Contracts
 *
 * This file demonstrates how backend endpoints should use API contracts
 * from @esta/api-contracts to enforce interface boundaries.
 *
 * Key Principles:
 * 1. Validate incoming requests using contract schemas
 * 2. Map internal domain types to DTOs at the boundary
 * 3. Validate outgoing responses using contract schemas
 * 4. Handle validation errors appropriately
 */
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = handler;
var zod_1 = require('zod');
var v1_1 = require('@esta/api-contracts/v1');
var firebase_1 = require('../../../lib/firebase');
var cors_1 = require('../../../lib/cors');
/**
 * Map internal user to DTO
 * This function sits at the boundary and converts internal representations
 * to the external contract shape
 */
function mapUserToDto(user) {
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName,
    role: user.role,
    employerId: user.employerId,
    employerSize: user.employerSize,
    status: user.status,
    createdAt: user.metadata.createdAt.toISOString(),
    updatedAt: user.metadata.updatedAt.toISOString(),
  };
}
/**
 * Handle validation errors
 */
function handleValidationError(error, res) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.errors.map(function (e) {
        return {
          path: e.path.join('.'),
          message: e.message,
        };
      }),
    },
  });
}
/**
 * Login API Endpoint with Contract Validation
 * POST /api/v1/auth/login-example
 *
 * This endpoint demonstrates the correct pattern for using API contracts
 */
function handler(req, res) {
  return __awaiter(this, void 0, void 0, function () {
    var origin,
      request,
      auth,
      db,
      uid,
      decodedToken,
      userRecord,
      userDoc,
      userData,
      internalUser,
      customToken,
      userDto,
      validatedUserDto,
      response,
      validatedResponse,
      error_1,
      firebaseError;
    var _a, _b;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          origin = req.headers.origin || '';
          (0, cors_1.setCorsHeaders)(res, origin);
          // Handle preflight
          if (req.method === 'OPTIONS') {
            return [2 /*return*/, (0, cors_1.handlePreflight)(res, origin)];
          }
          // Only allow POST requests
          if (req.method !== 'POST') {
            return [
              2 /*return*/,
              res.status(405).json({
                success: false,
                error: {
                  code: 'METHOD_NOT_ALLOWED',
                  message: 'Only POST requests are allowed',
                },
              }),
            ];
          }
          _c.label = 1;
        case 1:
          _c.trys.push([1, 9, , 10]);
          request = void 0;
          try {
            request = v1_1.LoginRequestSchema.parse(req.body);
          } catch (error) {
            if (error instanceof zod_1.ZodError) {
              return [2 /*return*/, handleValidationError(error, res)];
            }
            throw error;
          }
          auth = (0, firebase_1.getFirebaseAuth)();
          db = (0, firebase_1.getFirebaseDb)();
          uid = void 0;
          if (!request.idToken) return [3 /*break*/, 3];
          return [4 /*yield*/, auth.verifyIdToken(request.idToken)];
        case 2:
          decodedToken = _c.sent();
          uid = decodedToken.uid;
          return [3 /*break*/, 6];
        case 3:
          if (!(request.email && request.password)) return [3 /*break*/, 5];
          // Development mode: lookup by email
          if (
            process.env.NODE_ENV === 'production' ||
            process.env.VERCEL_ENV === 'production'
          ) {
            return [
              2 /*return*/,
              res.status(400).json({
                success: false,
                error: {
                  code: 'AUTH_METHOD_NOT_ALLOWED',
                  message:
                    'Email/password login is not supported in production. Please use Firebase Auth.',
                },
              }),
            ];
          }
          return [4 /*yield*/, auth.getUserByEmail(request.email)];
        case 4:
          userRecord = _c.sent();
          uid = userRecord.uid;
          return [3 /*break*/, 6];
        case 5:
          return [
            2 /*return*/,
            res.status(400).json({
              success: false,
              error: {
                code: 'MISSING_CREDENTIALS',
                message: 'Email and password or ID token are required',
              },
            }),
          ];
        case 6:
          return [4 /*yield*/, db.collection('users').doc(uid).get()];
        case 7:
          userDoc = _c.sent();
          if (!userDoc.exists) {
            return [
              2 /*return*/,
              res.status(404).json({
                success: false,
                error: {
                  code: 'USER_NOT_FOUND',
                  message: 'User not found',
                },
              }),
            ];
          }
          userData = userDoc.data();
          internalUser = {
            uid: uid,
            email:
              (userData === null || userData === void 0
                ? void 0
                : userData.email) || '',
            displayName:
              (userData === null || userData === void 0
                ? void 0
                : userData.name) || '',
            role:
              (userData === null || userData === void 0
                ? void 0
                : userData.role) || 'employee',
            employerId:
              userData === null || userData === void 0
                ? void 0
                : userData.employerId,
            employerSize:
              (userData === null || userData === void 0
                ? void 0
                : userData.employerSize) || 'small',
            status:
              userData === null || userData === void 0
                ? void 0
                : userData.status,
            metadata: {
              createdAt:
                ((_a =
                  userData === null || userData === void 0
                    ? void 0
                    : userData.createdAt) === null || _a === void 0
                  ? void 0
                  : _a.toDate()) || new Date(),
              updatedAt:
                ((_b =
                  userData === null || userData === void 0
                    ? void 0
                    : userData.updatedAt) === null || _b === void 0
                  ? void 0
                  : _b.toDate()) || new Date(),
            },
          };
          return [4 /*yield*/, auth.createCustomToken(uid)];
        case 8:
          customToken = _c.sent();
          userDto = mapUserToDto(internalUser);
          validatedUserDto = v1_1.UserDtoSchema.parse(userDto);
          response = {
            success: true,
            token: customToken,
            user: validatedUserDto,
          };
          validatedResponse = v1_1.LoginResponseSchema.parse(response);
          // ========================================================================
          // STEP 5: Send validated response
          // ========================================================================
          return [2 /*return*/, res.status(200).json(validatedResponse)];
        case 9:
          error_1 = _c.sent();
          console.error('Login error:', error_1);
          // Handle different error types
          if (error_1 instanceof zod_1.ZodError) {
            return [2 /*return*/, handleValidationError(error_1, res)];
          }
          if (
            error_1 &&
            typeof error_1 === 'object' &&
            'code' in error_1 &&
            typeof error_1.code === 'string'
          ) {
            firebaseError = error_1;
            // Handle Firebase Auth errors
            if (firebaseError.code === 'auth/user-not-found') {
              return [
                2 /*return*/,
                res.status(401).json({
                  success: false,
                  error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                  },
                }),
              ];
            }
            if (firebaseError.code === 'auth/invalid-credential') {
              return [
                2 /*return*/,
                res.status(401).json({
                  success: false,
                  error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid credentials',
                  },
                }),
              ];
            }
            if (firebaseError.code === 'auth/id-token-expired') {
              return [
                2 /*return*/,
                res.status(401).json({
                  success: false,
                  error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Session expired. Please login again.',
                  },
                }),
              ];
            }
          }
          return [
            2 /*return*/,
            res.status(500).json({
              success: false,
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Login failed. Please try again later.',
              },
            }),
          ];
        case 10:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * BENEFITS OF THIS APPROACH:
 *
 * 1. Type Safety: Both compile-time and runtime validation
 * 2. Clear Boundaries: Internal types don't leak to frontend
 * 3. Validation Errors: Caught early with clear messages
 * 4. Documentation: Contract serves as API documentation
 * 5. Testability: Easy to test request/response validation
 * 6. Maintainability: Changes to internal types don't break API
 * 7. Versioning: Can create v2 contracts without breaking v1 clients
 *
 * MIGRATION PATH FOR EXISTING ENDPOINTS:
 *
 * 1. Import contract schemas from @esta/api-contracts/v1
 * 2. Add request validation at the start of the handler
 * 3. Add DTO mapping functions for response data
 * 4. Add response validation before sending
 * 5. Update error handling to use contract error format
 * 6. Test with both valid and invalid inputs
 */
