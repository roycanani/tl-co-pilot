import requests


def get_current_weather(city: str) -> dict:
    # Placeholder function to simulate getting current weather data
    # In a real implementation, this would call a weather API
    print(f"Getting current weather for {city}")
    return {"city": city, "temperature": "25°C", "condition": "Sunny"}


def upload_post(title, description):
    import requests
    from requests_toolbelt.multipart.encoder import MultipartEncoder

    url = "https://node119.cs.colman.ac.il:4000/posts"
    headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2RhZmJmZjEwNDQ4MmNjMDI0MGQ4YzkiLCJyYW5kb20iOiIwLjIxOTA1OTU1NTU1NzA3NjkiLCJ1c2VybmFtZSI6InJveXRoZWtpbmciLCJlbWFpbCI6InJveTMzNDQxY0BnbWFpbC5jb20iLCJpbWFnZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pRN3MzM1NQX29mdHhFamVETk5kMlNlNVlrdXhiQUxCSFB4aWJ2VkZNZXRoLWpkLV9kZXc9czk2LWMiLCJpYXQiOjE3NDI4NDg1MDksImV4cCI6MTc0Mjg1MjEwOX0.iu-EGPFBJ0QLj0n7_rPsMYbqMQ_mVOusxpvpsqVKAwI",
        "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
    }

    s = f'{{"content":"{description}","title":"{title}"}}'

    # Prepare the multipart form data
    multipart_data = MultipartEncoder(
        fields={
            "post": (None, str(s), "application/json"),
            "file": (
                "image.jpeg",
                open("../image.jpeg", "rb"),
                "image/jpeg",
            ),
        }
    )

    headers["Content-Type"] = multipart_data.content_type

    response = requests.post(url, headers=headers, data=multipart_data, verify=False)
