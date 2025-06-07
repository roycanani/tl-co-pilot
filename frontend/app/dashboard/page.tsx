"use client";

import { useState, useEffect } from "react";
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
import { CalendarClock, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { FinishItemCheckbox } from "@/components/FinishItemCheckbox";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/context/auth-context";
import config from "@/lib/config";

interface DateTime {
  dateTime: string;
  timeZone: string;
}

interface UpcomingEvents {
  _id: {
    $oid: string;
  };
  id: string;
  description: string;
  updated: string;
  status: string;
  start: DateTime;
  end: DateTime;
  htmlLink: string;
  __v: number;
  finished: boolean;
}

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
  finished: boolean;
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

export default function DashboardPage() {
  const { user, getToken, isAuthenticated } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvents[]>([]);
  const [tasksToBeDone, setTasksToBeDone] = useState<TasksToBeDone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const finishTask = (itemId: string) => {
    // Update the tasksToBeDone state to mark the task as finished
    setTasksToBeDone((prevTasks) =>
      prevTasks.map((task) =>
        task.id === itemId ? { ...task, finished: true } : task
      )
    );
  };

  const finishEvent = (itemId: string) => {
    // Update the upcomingEvents state to mark the event as finished
    setUpcomingEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === itemId ? { ...event, finished: true } : event
      )
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?._id) {
        console.warn("User is not authenticated or user ID is missing");
        setIsLoading(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();

        // Fetch upcoming events
        try {
          const eventsResponse = await fetch(
            `${config.storageUrl}/events/user/${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!eventsResponse.ok) {
            throw new Error("Failed to fetch events");
          }
          const events = await eventsResponse.json();
          setUpcomingEvents(events);
          console.log(`Upcoming Events:`, events);
        } catch (error) {
          console.error("Error fetching events:", error);
        }

        // Fetch tasks
        try {
          const tasksResponse = await fetch(
            `${config.storageUrl}/tasks/user/${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!tasksResponse.ok) {
            throw new Error("Failed to fetch tasks");
          }
          const tasks = await tasksResponse.json();
          setTasksToBeDone(tasks);
          console.log("Upcoming Tasks:", tasks);
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, getToken, isAuthenticated]);

  // Filter out finished items
  const nonFinishedEvents = upcomingEvents.filter((event) => !event.finished);
  const nonFinishedTasks = tasksToBeDone.filter((task) => !task.finished);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
                      {nonFinishedEvents.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {
                        nonFinishedEvents.filter(
                          (event) =>
                            event.start.dateTime &&
                            isToday(event.start.dateTime)
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
                        nonFinishedTasks.filter(
                          (task) => task.status === "needsAction"
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {
                        nonFinishedTasks.filter(
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
                      {tasksToBeDone.filter((task) => task.finished).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This week (not yet hidden)
                    </p>
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
                    {nonFinishedEvents
                      .filter((event) => event.status !== "completed")
                      .slice(0, 3)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">
                                  {event.description}
                                </h3>
                                {event.htmlLink && (
                                  <a
                                    href={event.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span
                                  className={
                                    event.start.dateTime &&
                                    isOverdue(event.start.dateTime)
                                      ? "text-destructive"
                                      : ""
                                  }
                                >
                                  {event.start.dateTime
                                    ? formatDate(event.start.dateTime)
                                    : "No date defined"}
                                </span>
                              </div>
                              <FinishItemCheckbox
                                itemId={event.id}
                                itemType="event"
                                className="mt-2"
                                onCheckCallBack={finishEvent}
                              />
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                variant={
                                  event.start.dateTime &&
                                  isOverdue(event.start.dateTime)
                                    ? "destructive"
                                    : event.start.dateTime &&
                                      isToday(event.start.dateTime)
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {event.start.dateTime &&
                                isOverdue(event.start.dateTime)
                                  ? "Overdue"
                                  : event.start.dateTime &&
                                    isToday(event.start.dateTime)
                                  ? "Today"
                                  : "Upcoming"}
                              </Badge>
                            </div>
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
                    {nonFinishedTasks
                      .filter((task) => task.status === "needsAction")
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{task.title}</h3>
                                {task.webViewLink && (
                                  <a
                                    href={task.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
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
                              <FinishItemCheckbox
                                itemId={task.id}
                                itemType="task"
                                className="mt-2"
                                onCheckCallBack={finishTask}
                              />
                            </div>
                            <div className="flex flex-col items-end space-y-1">
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
                    Complete list of your upcoming events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nonFinishedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{event.description}</h3>
                            {event.htmlLink && (
                              <a
                                href={event.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span
                              className={
                                event.start.dateTime &&
                                isOverdue(event.start.dateTime)
                                  ? "text-destructive"
                                  : ""
                              }
                            >
                              {event.start.dateTime
                                ? formatDate(event.start.dateTime)
                                : "No date defined"}
                            </span>
                          </div>
                          <FinishItemCheckbox
                            itemId={event.id}
                            itemType="event"
                            className="mt-2"
                            onCheckCallBack={finishEvent}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              event.start.dateTime &&
                              isOverdue(event.start.dateTime)
                                ? "destructive"
                                : event.start.dateTime &&
                                  isToday(event.start.dateTime)
                                ? "default"
                                : "outline"
                            }
                          >
                            {event.start.dateTime &&
                            isOverdue(event.start.dateTime)
                              ? "Overdue"
                              : event.start.dateTime &&
                                isToday(event.start.dateTime)
                              ? "Today"
                              : "Upcoming"}
                          </Badge>
                        </div>
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
                    Complete list of your pending tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nonFinishedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col space-y-2 border-b pb-4 last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{task.title}</h3>
                            {task.webViewLink && (
                              <a
                                href={task.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span
                              className={
                                task.due && isOverdue(task.due)
                                  ? "text-destructive"
                                  : ""
                              }
                            >
                              {task.due ? formatDate(task.due) : "No due date"}
                            </span>
                          </div>
                          <FinishItemCheckbox
                            itemId={task.id}
                            itemType="task"
                            className="mt-2"
                            onCheckCallBack={finishTask}
                          />
                        </div>
                        <div className="flex items-center gap-2">
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
