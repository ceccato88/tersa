"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile = exports.projects = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
var uuid = (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["uuid_generate_v4()"], ["uuid_generate_v4()"])));
exports.projects = (0, pg_core_1.pgTable)('project', {
    id: (0, pg_core_1.text)('id').primaryKey().default(uuid).notNull(),
    name: (0, pg_core_1.varchar)('name').notNull(),
    transcriptionModel: (0, pg_core_1.varchar)('transcription_model').notNull(),
    visionModel: (0, pg_core_1.varchar)('vision_model').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at'),
    content: (0, pg_core_1.json)('content'),
    userId: (0, pg_core_1.varchar)('user_id').notNull(),
    image: (0, pg_core_1.varchar)('image'),
    members: (0, pg_core_1.text)('members').array(),
    welcomeProject: (0, pg_core_1.boolean)('demo_project').notNull().default(false),
});
exports.profile = (0, pg_core_1.pgTable)('profile', {
    id: (0, pg_core_1.text)('id').primaryKey().notNull(),
    customerId: (0, pg_core_1.text)('customer_id'),
    subscriptionId: (0, pg_core_1.text)('subscription_id'),
    productId: (0, pg_core_1.text)('product_id'),
    onboardedAt: (0, pg_core_1.timestamp)('onboarded_at'),
});
var templateObject_1;
