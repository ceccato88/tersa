# Imagen 4 Ultra

> Google’s highest quality image generation model


## Overview

- **Endpoint**: `https://fal.run/fal-ai/imagen4/preview/ultra`
- **Model ID**: `fal-ai/imagen4/preview/ultra`
- **Category**: text-to-image
- **Kind**: inference


## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The text prompt describing what you want to see
  - Examples: "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation."

- **`negative_prompt`** (`string`, _optional_):
  A description of what to discourage in the generated images Default value: `""`
  - Default: `""`

- **`aspect_ratio`** (`AspectRatioEnum`, _optional_):
  The aspect ratio of the generated image Default value: `"1:1"`
  - Default: `"1:1"`
  - Options: `"1:1"`, `"16:9"`, `"9:16"`, `"3:4"`, `"4:3"`

- **`num_images`** (`integer`, _optional_):
  Number of images to generate (1-4) Default value: `1`
  - Default: `1`
  - Range: `1` to `1`

- **`seed`** (`integer`, _optional_):
  Random seed for reproducible generation

- **`resolution`** (`ResolutionEnum`, _optional_):
   Default value: `"1K"`
  - Default: `"1K"`
  - Options: `"1K"`, `"2K"`



**Required Parameters Example**:

```json
{
  "prompt": "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation."
}
```

**Full Example**:

```json
{
  "prompt": "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation.",
  "aspect_ratio": "1:1",
  "num_images": 1,
  "resolution": "1K"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<File>`, _required_)
  - Array of File
  - Examples: [{"url":"https://v3.fal.media/files/panda/uzopSU5Me5PUENW-IXMXD_output.png"}]

- **`seed`** (`integer`, _required_):
  Seed used for generation
  - Examples: 42



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/panda/uzopSU5Me5PUENW-IXMXD_output.png"
    }
  ],
  "seed": 42
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/imagen4/preview/ultra \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation."
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
    "fal-ai/imagen4/preview/ultra",
    arguments={
        "prompt": "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation."
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

const result = await fal.subscribe("fal-ai/imagen4/preview/ultra", {
  input: {
    prompt: "This four-panel comic strip uses a charming, deliberately pixelated art style reminiscent of classic 8-bit video games, featuring simple shapes and a limited, bright color palette dominated by greens, blues, browns, and the dinosaur's iconic grey/black. The setting is a stylized pixel beach. Panel one shows the familiar Google Chrome T-Rex dinosaur, complete with its characteristic pixelated form, wearing tiny pixel sunglasses and lounging on a pixelated beach towel under a blocky yellow sun. Pixelated palm trees sway gently in the background against a blue pixel sky. A caption box with pixelated font reads, \"Even error messages need a vacation.\" Panel two is a close-up of the T-Rex attempting to build a pixel sandcastle. It awkwardly pats a mound of brown pixels with its tiny pixel arms, looking focused. Small pixelated shells dot the sand around it. Panel three depicts the T-Rex joyfully hopping over a series of pixelated cacti planted near the beach, mimicking its game obstacle avoidance. Small \"Boing! Boing!\" sound effect text appears in a blocky font above each jump. A pixelated crab watches from the side, waving its pixel claw. The final panel shows the T-Rex floating peacefully on its back in the blocky blue pixel water, sunglasses still on, with a contented expression. A small thought bubble above it contains pixelated \"Zzz...\" indicating relaxation."
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

- [Model Playground](https://fal.ai/models/fal-ai/imagen4/preview/ultra)
- [API Documentation](https://fal.ai/models/fal-ai/imagen4/preview/ultra/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/imagen4/preview/ultra)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)