import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Simulated weather tool.
export function getCurrentWeather(city: string): {
  city: string;
  temperature: string;
  condition: string;
} {
  console.log(`Getting current weather for ${city}`);
  return { city, temperature: "25°C", condition: "Sunny" };
}

// Simulated upload_post tool.
export async function uploadPost(
  title: string,
  description: string
): Promise<void> {
  const url = "https://node119.cs.colman.ac.il:4000/posts";
  const form = new FormData();

  // Prepare the JSON content.
  const postContent = JSON.stringify({ title, content: description });
  form.append("post", postContent, { contentType: "application/json" });

  // Adjust image path as needed.
  const imagePath = path.resolve(__dirname, "../image.jpeg");
  form.append("file", fs.createReadStream(imagePath), {
    filename: "image.jpeg",
    contentType: "image/jpeg",
  });

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      // Note: verify SSL settings as needed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
    });
    console.log("Upload response:", response.data);
  } catch (error) {
    console.error("Error uploading post:", error);
  }
}
