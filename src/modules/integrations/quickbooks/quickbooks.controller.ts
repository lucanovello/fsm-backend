import { AppError } from "../../../shared/errors.js";

import { QuickBooksCallbackQuerySchema } from "./dto/quickbooks.dto.js";
import {
  createQuickBooksConnectUrl,
  getActiveQuickBooksConnection,
  handleQuickBooksCallback,
  handleQuickBooksWebhook,
} from "./quickbooks.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function quickBooksConnectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) throw orgRequired();
    const result = await createQuickBooksConnectUrl(req.org.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function quickBooksCallbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = QuickBooksCallbackQuerySchema.parse(req.query);
    const result = await handleQuickBooksCallback(parsed);
    res.status(200).json({
      status: "connected",
      connectionId: result.connectionId,
      realmId: result.realmId,
    });
  } catch (err) {
    next(err);
  }
}

export async function quickBooksWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.get("intuit-signature") ?? undefined;
    const result = await handleQuickBooksWebhook({
      signature,
      rawBody: req.rawBody,
      body: req.body,
    });

    if (result.queued) {
      res.status(202).json({ status: "queued" });
      return;
    }

    res.status(202).json({ status: "ignored" });
  } catch (err) {
    next(err);
  }
}

export async function quickBooksActiveConnectionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) throw orgRequired();
    const connection = await getActiveQuickBooksConnection(req.org.id);
    res.status(200).json({ connection });
  } catch (err) {
    next(err);
  }
}
