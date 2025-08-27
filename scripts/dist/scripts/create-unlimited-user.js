"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnlimitedUser = createUnlimitedUser;
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
// Carregar variáveis de ambiente do .env.local
(0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), '.env.local') });
// Configuração do Supabase
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
}
// Cliente com privilégios de admin
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
/**
 * Cria um usuário "unlimited" com perfil personalizado
 * Usa a Supabase Auth API para garantir compatibilidade e segurança
 */
function createUnlimitedUser(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, authData, authError, profileData, _d, profileResult, profileError, error_1;
        var email = _b.email, password = _b.password, _e = _b.fullName, fullName = _e === void 0 ? 'Unlimited User' : _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 5, , 6]);
                    console.log("\uD83D\uDE80 Criando usu\u00E1rio unlimited: ".concat(email));
                    return [4 /*yield*/, supabase.auth.admin.createUser({
                            email: email,
                            password: password,
                            email_confirm: true, // Confirma email automaticamente
                            user_metadata: {
                                full_name: fullName,
                                email_verified: true
                            }
                        })];
                case 1:
                    _c = _f.sent(), authData = _c.data, authError = _c.error;
                    if (authError) {
                        console.error('❌ Erro ao criar usuário:', authError.message);
                        return [2 /*return*/, {
                                success: false,
                                error: "Erro na autentica\u00E7\u00E3o: ".concat(authError.message)
                            }];
                    }
                    if (!authData.user) {
                        return [2 /*return*/, {
                                success: false,
                                error: 'Usuário não foi criado'
                            }];
                    }
                    console.log("\u2705 Usu\u00E1rio criado com ID: ".concat(authData.user.id));
                    profileData = {
                        id: authData.user.id, // UUID do usuário
                        customer_id: "unlimited_".concat(authData.user.id),
                        subscription_id: "unlimited_sub_".concat(authData.user.id),
                        product_id: 'unlimited_product',
                        onboarded_at: new Date()
                    };
                    return [4 /*yield*/, supabase
                            .from('profile')
                            .insert(profileData)
                            .select()
                            .single()];
                case 2:
                    _d = _f.sent(), profileResult = _d.data, profileError = _d.error;
                    if (!profileError) return [3 /*break*/, 4];
                    console.error('❌ Erro ao criar perfil:', profileError.message);
                    // Tentar limpar o usuário criado se o perfil falhou
                    return [4 /*yield*/, supabase.auth.admin.deleteUser(authData.user.id)];
                case 3:
                    // Tentar limpar o usuário criado se o perfil falhou
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: "Erro ao criar perfil: ".concat(profileError.message)
                        }];
                case 4:
                    console.log('✅ Perfil criado com sucesso');
                    return [2 /*return*/, {
                            success: true,
                            user: authData.user,
                            profile: profileResult
                        }];
                case 5:
                    error_1 = _f.sent();
                    console.error('❌ Erro inesperado:', error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: "Erro inesperado: ".concat(error_1 instanceof Error ? error_1.message : 'Erro desconhecido')
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Script para execução via linha de comando
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, email, password, fullName, result;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    args = process.argv.slice(2);
                    if (args.length < 2) {
                        console.log('❌ Uso: node create-unlimited-user.js <email> <password> [nome_completo]');
                        console.log('📝 Exemplo: node create-unlimited-user.js user@example.com senha123 "João Silva"');
                        process.exit(1);
                    }
                    email = args[0], password = args[1], fullName = args[2];
                    console.log('🔧 CRIAÇÃO DE USUÁRIO UNLIMITED');
                    console.log('================================');
                    console.log("\uD83D\uDCE7 Email: ".concat(email));
                    console.log("\uD83D\uDC64 Nome: ".concat(fullName || 'Unlimited User'));
                    console.log('================================');
                    return [4 /*yield*/, createUnlimitedUser({
                            email: email,
                            password: password,
                            fullName: fullName
                        })];
                case 1:
                    result = _e.sent();
                    if (result.success) {
                        console.log('\n🎉 USUÁRIO CRIADO COM SUCESSO!');
                        console.log('================================');
                        console.log("\uD83D\uDC64 ID: ".concat((_a = result.user) === null || _a === void 0 ? void 0 : _a.id));
                        console.log("\uD83D\uDCE7 Email: ".concat((_b = result.user) === null || _b === void 0 ? void 0 : _b.email));
                        console.log("\uD83C\uDD94 Customer ID: ".concat((_c = result.profile) === null || _c === void 0 ? void 0 : _c.customer_id));
                        console.log("\uD83D\uDCCB Product ID: ".concat((_d = result.profile) === null || _d === void 0 ? void 0 : _d.product_id));
                        console.log('================================');
                        console.log('\n✅ O usuário pode fazer login normalmente!');
                    }
                    else {
                        console.log('\n❌ FALHA NA CRIAÇÃO DO USUÁRIO');
                        console.log('================================');
                        console.log("\uD83D\uDEA8 Erro: ".concat(result.error));
                        console.log('================================');
                        process.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}
