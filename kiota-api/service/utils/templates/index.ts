import dotenv from "dotenv";
import fs from "fs";
import { Template } from "../../enums/Template";


dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const Mustache = require("mustache");
const templateDir = "./service/templates/email";

export function renderBasicContent(data: unknown) {
  const _template = fs.readFileSync(
    `${templateDir}/${Template.BASIC}`,
    "utf-8"
  );

  return Mustache.render(_template, data);
}

export function renderAdminContent(data: unknown) {
  const _template = fs.readFileSync(
    `${templateDir}/${Template.ADMIN}`,
    "utf-8"
  );

  return Mustache.render(_template, data);
}

export function renderRewardBalanceContent(template: Template, data: unknown) {
  const _template = fs.readFileSync(`${templateDir}/${template}`, "utf-8");

  return Mustache.render(_template, data);
}

export function renderTxCompleteAdminContent(template: Template, data: any) {
  const _template = fs.readFileSync(`${templateDir}/${template}`, "utf-8");

  return Mustache.render(_template, data);
}

export function renderExceptionContent(template: Template, data: any) {
  const _template = fs.readFileSync(`${templateDir}/${template}`, "utf-8");

  return Mustache.render(_template, data);
}

export function renderRewardClientContent(template: Template, data: any) {
  const _template = fs.readFileSync(`${templateDir}/${template}`, "utf-8");

  return Mustache.render(_template, data);
}

export function renderRewardAgentContent(template: Template, data: any) {
  const _template = fs.readFileSync(`${templateDir}/${template}`, "utf-8");

  return Mustache.render(_template, data);
}
