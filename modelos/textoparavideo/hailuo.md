# MiniMax Hailuo 02 [Pro] (Text to Video)

> MiniMax Hailuo-02 Text To Video API (Pro, 1080p): Advanced video generation model with 1080p resolution


## Overview

- **Endpoint**: `https://fal.run/fal-ai/minimax/hailuo-02/pro/text-to-video`
- **Model ID**: `fal-ai/minimax/hailuo-02/pro/text-to-video`
- **Category**: text-to-video
- **Kind**: inference


## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_)
  - Examples: "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them."

- **`prompt_optimizer`** (`boolean`, _optional_):
  Whether to use the model's prompt optimizer Default value: `true`
  - Default: `true`



**Required Parameters Example**:

```json
{
  "prompt": "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them."
}
```

**Full Example**:

```json
{
  "prompt": "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them.",
  "prompt_optimizer": true
}
```


### Output Schema

The API returns the following output format:

- **`video`** (`File`, _required_):
  The generated video
  - Examples: {"url":"https://v3.fal.media/files/kangaroo/_qEOfY3iKHsc86kqHUUh2_output.mp4"}



**Example Response**:

```json
{
  "video": {
    "url": "https://v3.fal.media/files/kangaroo/_qEOfY3iKHsc86kqHUUh2_output.mp4"
  }
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/minimax/hailuo-02/pro/text-to-video \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them."
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/minimax/hailuo-02/pro/text-to-video",
    arguments={
        "prompt": "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them."
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/minimax/hailuo-02/pro/text-to-video", {
  input: {
    prompt: "A Galactic Smuggler is a rogue figure with a cybernetic arm and a well-worn coat that hints at many dangerous escapades across the galaxy. Their ship is filled with rare and exotic treasures from distant planets, concealed in hidden compartments, showing their expertise in illicit trade. Their belt is adorned with energy-based weapons, ready to be drawn at any moment to protect themselves or escape from tight situations. This character thrives in the shadows of space, navigating between the law and chaos with stealth and wit, always seeking the next big score while evading bounty hunters and law enforcement. The rogue's ship, rugged yet efficient, serves as both a home and a tool for their dangerous lifestyle. The treasures they collect reflect the diverse and intriguing worlds they've encountered—alien artifacts, rare minerals, and artifacts of unknown origin. Their reputation precedes them, with whispers of their dealings and the deadly encounters that often follow. A master of negotiation and deception, the Galactic Smuggler navigates the cosmos with an eye on the horizon, always one step ahead of those who pursue them."
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/minimax/hailuo-02/pro/text-to-video)
- [API Documentation](https://fal.ai/models/fal-ai/minimax/hailuo-02/pro/text-to-video/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/minimax/hailuo-02/pro/text-to-video)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)