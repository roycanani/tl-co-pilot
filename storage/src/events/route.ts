import express from "express";
const router = express.Router();
import eventsController from "./controller";

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: The Events API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - id
 *         - status
 *         - htmlLink
 *         - created
 *         - updated
 *         - summary
 *         - start
 *         - end
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the event
 *         status:
 *           type: string
 *           description: The status of the event
 *         htmlLink:
 *           type: string
 *           description: A link to view the event in the web interface
 *         created:
 *           type: string
 *           format: date-time
 *           description: The creation timestamp of the event
 *         updated:
 *           type: string
 *           format: date-time
 *           description: The last updated timestamp of the event
 *         summary:
 *           type: string
 *           description: The summary or title of the event
 *         start:
 *           type: object
 *           properties:
 *             dateTime:
 *               type: string
 *               format: date-time
 *               description: The start date and time of the event
 *             timeZone:
 *               type: string
 *               description: The time zone of the start time
 *         end:
 *           type: object
 *           properties:
 *             dateTime:
 *               type: string
 *               format: date-time
 *               description: The end date and time of the event
 *             timeZone:
 *               type: string
 *               description: The time zone of the end time
 *       example:
 *         id: 3rs6uulmjas3cfu08iat7f2sf4
 *         status: confirmed
 *         htmlLink: https://www.google.com/calendar/event?eid=...
 *         created: 2025-03-31T20:31:03.000Z
 *         updated: 2025-03-31T20:31:04.117Z
 *         summary: Meeting with DevOps
 *         start:
 *           dateTime: 2025-03-31T13:00:00+03:00
 *           timeZone: UTC
 *         end:
 *           dateTime: 2025-03-31T14:00:00+03:00
 *           timeZone: UTC
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get("/", eventsController.getAll.bind(eventsController));

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 */
router.get("/:id", eventsController.getById.bind(eventsController));

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post("/", eventsController.create.bind(eventsController));

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
router.put("/:id", eventsController.update.bind(eventsController));

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 */
router.delete("/:id", eventsController.delete.bind(eventsController));

/**
 * @swagger
 * /events/finished/{id}:
 *   patch:
 *     summary: Mark a event as finished
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event marked as finished successfully
 */
router.patch(
  "/finished/:id",
  eventsController.markAsFinished.bind(eventsController)
);

export default router;
