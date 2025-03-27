"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWeather = getCurrentWeather;
exports.uploadPost = uploadPost;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Simulated weather tool.
function getCurrentWeather(city) {
    console.log(`Getting current weather for ${city}`);
    return { city, temperature: "25°C", condition: "Sunny" };
}
// Simulated upload_post tool.
async function uploadPost(title, description) {
    const url = "https://node119.cs.colman.ac.il:4000/posts";
    const form = new form_data_1.default();
    // Prepare the JSON content.
    const postContent = JSON.stringify({ title, content: description });
    form.append("post", postContent, { contentType: "application/json" });
    // Adjust image path as needed.
    const imagePath = path_1.default.resolve(__dirname, "../image.jpeg");
    form.append("file", fs_1.default.createReadStream(imagePath), {
        filename: "image.jpeg",
        contentType: "image/jpeg",
    });
    try {
        const response = await axios_1.default.post(url, form, {
            headers: {
                ...form.getHeaders(),
                authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            // Note: verify SSL settings as needed
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
        });
        console.log("Upload response:", response.data);
    }
    catch (error) {
        console.error("Error uploading post:", error);
    }
}
