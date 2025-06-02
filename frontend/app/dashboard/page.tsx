export const dynamic = "force-dynamic";

import { CalendarClock, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for events
interface UpcomingEvents {
  _id: {
    $oid: string;
  };
  id: string;
  description: string;
  updated: string;
  status: string;
  due?: string;
  htmlLink: string;
  __v: number;
}

// Mock data for tasks
interface TasksToBeDone {
  _id: {
    $oid: string;
  };
  id: string;
  title: string;
  updated: string;
  status: string;
  due?: string;
  webViewLink: string;
  __v: number;
}

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Helper function to check if a date is today or in the past
function isOverdue(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Helper function to check if a date is today
function isToday(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate.getTime() === today.getTime();
}

export default async function DashboardPage() {
  let upcomingEvents: UpcomingEvents[] = [];
  let tasksToBeDone: TasksToBeDone[] = [];
  process.stdout.write(`Upcoming Events:\n`);
  console.log("Upcoming Tasks:");

  // Fetch upcoming events and tasks from the API
  try {
    const response = await fetch("http://storage:3000/events");
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }
    upcomingEvents = await response.json();
    console.log(`Upcoming Events: ${JSON.stringify(upcomingEvents)}\n`);
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  try {
    const response = await fetch("http://storage:3000/tasks");
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    tasksToBeDone = await response.json();
    console.log("Upcoming Tasks:", tasksToBeDone);
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of upcoming events and tasks that need your attention.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {upcomingEvents.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      upcomingEvents.filter(
                        (event) => event.due && isToday(event.due)
                      ).length
                    }{" "}
                    today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Tasks
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      tasksToBeDone.filter(
                        (task) => task.status === "needsAction"
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      tasksToBeDone.filter(
                        (task) =>
                          task.status === "needsAction" &&
                          task.due &&
                          isOverdue(task.due)
                      ).length
                    }{" "}
                    overdue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Tasks
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      tasksToBeDone.filter(
                        (task) => task.status === "completed"
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    Your scheduled events and meetings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingEvents
                    .filter((event) => event.status !== "completed")
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{event.description}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span
                                className={
                                  event.due && isOverdue(event.due)
                                    ? "text-destructive"
                                    : ""
                                }
                              >
                                {event.due
                                  ? formatDate(event.due)
                                  : "No due date"}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              event.due && isOverdue(event.due)
                                ? "destructive"
                                : event.due && isToday(event.due)
                                ? "default"
                                : "outline"
                            }
                          >
                            {event.due && isOverdue(event.due)
                              ? "Overdue"
                              : event.due && isToday(event.due)
                              ? "Today"
                              : "Upcoming"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View all events
                  </Button>
                </CardFooter>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Tasks To Be Done</CardTitle>
                  <CardDescription>
                    Your pending tasks and action items
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasksToBeDone
                    .filter((task) => task.status === "needsAction")
                    .slice(0, 3)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{task.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span
                                className={
                                  task.due && isOverdue(task.due)
                                    ? "text-destructive"
                                    : ""
                                }
                              >
                                {task.due
                                  ? formatDate(task.due)
                                  : "No due date"}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              task.due && isOverdue(task.due)
                                ? "destructive"
                                : task.due && isToday(task.due)
                                ? "default"
                                : "outline"
                            }
                          >
                            {task.due && isOverdue(task.due)
                              ? "Overdue"
                              : task.due && isToday(task.due)
                              ? "Today"
                              : "Upcoming"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View all tasks
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>
                  Complete list of your upcoming and past events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{event.description}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span
                            className={
                              event.due &&
                              isOverdue(event.due) &&
                              event.status !== "completed"
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {event.due && formatDate(event.due)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            event.status === "completed"
                              ? "secondary"
                              : event.due && isOverdue(event.due)
                              ? "destructive"
                              : event.due && isToday(event.due)
                              ? "default"
                              : "outline"
                          }
                        >
                          {event.status === "completed"
                            ? "Completed"
                            : event.due && isOverdue(event.due)
                            ? "Overdue"
                            : event.due && isToday(event.due)
                            ? "Today"
                            : "Upcoming"}
                        </Badge>
                        <Link
                          href={event.htmlLink ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Open link</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(event.updated).toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
                <CardDescription>
                  Complete list of your pending and completed tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasksToBeDone.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span
                            className={
                              task.due &&
                              isOverdue(task.due) &&
                              task.status !== "completed"
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {task.due ? formatDate(task.due) : "No due date"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.status === "completed"
                              ? "secondary"
                              : task.due && isOverdue(task.due)
                              ? "destructive"
                              : task.due && isToday(task.due)
                              ? "default"
                              : "outline"
                          }
                        >
                          {task.status === "completed"
                            ? "Completed"
                            : task.due && isOverdue(task.due)
                            ? "Overdue"
                            : task.due && isToday(task.due)
                            ? "Today"
                            : "Upcoming"}
                        </Badge>
                        <Link
                          href={task.webViewLink ?? ""}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Open link</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(task.updated).toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
