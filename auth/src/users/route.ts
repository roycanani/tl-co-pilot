import express from "express";
import usersController from "./controller";
import { authMiddleware } from "../auth/controller";
export const usersRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         userName:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The email of the user
 *       example:
 *         userName: John Doe
 *         email: john.doe@example.com
 *         password: password123
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *     security:
 *       - bearerAuth: []
 */
usersRouter.get(
  "/",
  authMiddleware,
  usersController.getAll.bind(usersController)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *     security:
 *       - bearerAuth: []
 */
usersRouter.get(
  "/:id",
  authMiddleware,
  usersController.getById.bind(usersController)
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
usersRouter.post("/", usersController.create.bind(usersController));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *     security:
 *       - bearerAuth: []
 */
usersRouter.put(
  "/:id",
  authMiddleware,
  usersController.update.bind(usersController)
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *     security:
 *       - bearerAuth: []
 */
usersRouter.delete(
  "/:id",
  authMiddleware,
  usersController.delete.bind(usersController)
);

/**
 * @swagger
 * /users/{id}/token:
 *   get:
 *     summary: Get user token by ID (Internal Use)
 *     tags: [Users]
 *     description: Generates a token for the specified user ID, intended for internal service consumption. The generated token is also stored locally by the server.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The access token for the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Token generation or storage failed
 *     security:
 *       - bearerAuth: []
 */
usersRouter.get(
  "/:id/token",
  // authMiddleware, // TODO - Add a specific middleware for this route if needed (for intenral services usage)
  usersController.getUserToken.bind(usersController) // Assumes a new method in usersController
);

export default usersRouter;
