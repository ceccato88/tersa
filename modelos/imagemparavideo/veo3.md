# Veo3

> Veo 3 is the latest state-of-the art video generation model from Google DeepMind


## Overview

- **Endpoint**: `https://fal.run/fal-ai/veo3/image-to-video`
- **Model ID**: `fal-ai/veo3/image-to-video`
- **Category**: image-to-video
- **Kind**: inference


## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The text prompt describing how the image should be animated
  - Examples: "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\""

- **`image_url`** (`string`, _required_):
  URL of the input image to animate. Should be 720p or higher resolution in 16:9 aspect ratio. If the image is not in 16:9 aspect ratio, it will be cropped to fit.
  - Examples: "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png"

- **`duration`** (`DurationEnum`, _optional_):
  The duration of the generated video in seconds Default value: `"8s"`
  - Default: `"8s"`
  - Options: `"8s"`

- **`generate_audio`** (`boolean`, _optional_):
  Whether to generate audio for the video. If false, %33 less credits will be used. Default value: `true`
  - Default: `true`

- **`resolution`** (`ResolutionEnum`, _optional_):
  Resolution of the generated video Default value: `"720p"`
  - Default: `"720p"`
  - Options: `"720p"`, `"1080p"`



**Required Parameters Example**:

```json
{
  "prompt": "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\"",
  "image_url": "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png"
}
```

**Full Example**:

```json
{
  "prompt": "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\"",
  "image_url": "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png",
  "duration": "8s",
  "generate_audio": true,
  "resolution": "720p"
}
```


### Output Schema

The API returns the following output format:

- **`video`** (`File`, _required_):
  The generated video
  - Examples: {"url":"https://storage.googleapis.com/falserverless/example_outputs/veo3-i2v-output.mp4"}



**Example Response**:

```json
{
  "video": {
    "url": "https://storage.googleapis.com/falserverless/example_outputs/veo3-i2v-output.mp4"
  }
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/veo3/image-to-video \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\"",
     "image_url": "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png"
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
    "fal-ai/veo3/image-to-video",
    arguments={
        "prompt": "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\"",
        "image_url": "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png"
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

const result = await fal.subscribe("fal-ai/veo3/image-to-video", {
  input: {
    prompt: "A woman looks into the camera, breathes in, then exclaims energetically, \"have you guys checked out Veo3 Image-to-Video on Fal? It's incredible!\"",
    image_url: "https://storage.googleapis.com/falserverless/example_inputs/veo3-i2v-input.png"
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

- [Model Playground](https://fal.ai/models/fal-ai/veo3/image-to-video)
- [API Documentation](https://fal.ai/models/fal-ai/veo3/image-to-video/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/veo3/image-to-video)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)