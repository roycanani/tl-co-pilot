import express from "express";
const router = express.Router();
import authController, { authMiddleware } from "./controller";
import passport from "passport";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The Authentication API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInfoResponse: # Example schema for user-info
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         user:
 *           type: object
 *           # Define user properties here based on what authController.userInfo returns
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             # etc.
 *     GoogleLoginResponse: # Example schema for google/callback
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Authentication successful
 *         # Add other properties returned by loginOIDC, e.g., user info, tokens
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     description: Redirects to Google's OAuth authentication page
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/tasks",
      "https://www.googleapis.com/auth/calendar",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     tags: [Auth]
 *     description: Handles the callback from Google after authentication.
 *     responses:
 *       200:
 *         description: User authenticated successfully. The response structure depends on `authController.loginOIDC`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoogleLoginResponse' # Example, adjust as needed
 *       302:
 *         description: Redirects on failure (e.g., to a login page or error page)
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login", // Adjust as needed, perhaps to an error page or frontend route
  }),
  authController.loginOIDC
);

/**
 * @swagger
 * /auth/user-info:
 *   get:
 *     summary: Get authenticated user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: [] # This implies you are using Bearer token authentication for this route.
 *                        # Ensure authMiddleware correctly handles token validation.
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfoResponse' # Example, adjust as needed
 *       401:
 *         description: No token provided or token is invalid
 *       403:
 *         description: Forbidden, token valid but user lacks permissions (if applicable)
 */
router.get("/user-info", authMiddleware, authController.userInfo);

export default router;
