import { Router } from "express";

import {
  quickBooksActiveConnectionHandler,
  quickBooksConnectHandler,
} from "./quickbooks.controller.js";

export const quickBooksRoutes = Router();

quickBooksRoutes.post("/connect", quickBooksConnectHandler);

quickBooksRoutes.get("/connection", quickBooksActiveConnectionHandler);
