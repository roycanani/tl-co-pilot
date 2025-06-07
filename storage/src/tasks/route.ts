import express from "express";
const router = express.Router();
import tasksController from "./controller";

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: The Tasks API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - updated
 *         - status
 *         - due
 *         - webViewLink
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the task
 *         title:
 *           type: string
 *           description: The title of the task
 *         updated:
 *           type: string
 *           format: date-time
 *           description: The last updated timestamp of the task
 *         notes:
 *           type: string
 *           description: Additional notes for the task
 *         status:
 *           type: string
 *           description: The status of the task (e.g., needsAction, completed)
 *         due:
 *           type: string
 *           format: date-time
 *           description: The due date of the task
 *         webViewLink:
 *           type: string
 *           description: A link to view the task in the web interface
 *       example:
 *         id: VHBsZXNMX3hpYURsMEVJbg
 *         title: Check on model accuracy
 *         updated: 2025-03-31T20:31:08.205Z
 *         notes: Compare different models
 *         status: needsAction
 *         due: 2025-03-31T00:00:00.000Z
 *         webViewLink: https://tasks.google.com/task/TplesL_xiaDl0EIn?sa=6
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get("/", tasksController.getAll.bind(tasksController));

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.get("/:id", tasksController.getById.bind(tasksController));

/**
 * @swagger
 * /tasks/user/{userId}:
 *   get:
 *     summary: Get tasks by User ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The User ID
 *     responses:
 *       200:
 *         description: List of tasks for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: No tasks found for this user
 */
router.get("/user/:userId", tasksController.getByUserId.bind(tasksController));

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post("/", tasksController.create.bind(tasksController));

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put("/:id", tasksController.update.bind(tasksController));

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete("/:id", tasksController.delete.bind(tasksController));

/**
 * @swagger
 * /tasks/finished/{id}:
 *   patch:
 *     summary: Mark a task as finished
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task marked as finished successfully
 */
router.patch(
  "/finished/:id",
  tasksController.markAsFinished.bind(tasksController)
);

export default router;
