# FLUX.1 Krea [dev]

> FLUX.1 Krea [dev] is a 12 billion parameter flow transformer that generates high-quality images from text with incredible aesthetics. It is suitable for personal and commercial use.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/flux/krea`
- **Model ID**: `fal-ai/flux/krea`
- **Category**: text-to-image
- **Kind**: inference


## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt to generate an image from.
  - Examples: "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel."

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The size of the generated image. Default value: `landscape_4_3`
  Possible enum values: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  - Default: `"landscape_4_3"`
  - One of: ImageSize | Enum

- **`num_inference_steps`** (`integer`, _optional_):
  The number of inference steps to perform. Default value: `28`
  - Default: `28`
  - Range: `1` to `50`

- **`seed`** (`integer`, _optional_):
  The same seed and the same prompt given to the same version of the model
  will output the same image every time.

- **`guidance_scale`** (`float`, _optional_):
  The CFG (Classifier Free Guidance) scale is a measure of how close you want
  the model to stick to your prompt when looking for a related image to show you. Default value: `4.5`
  - Default: `4.5`
  - Range: `1` to `20`

- **`sync_mode`** (`boolean`, _optional_):
  If set to true, the function will wait for the image to be generated and uploaded
  before returning the response. This will increase the latency of the function but
  it allows you to get the image directly in the response without going through the CDN.
  - Default: `false`

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`enable_safety_checker`** (`boolean`, _optional_):
  If set to true, the safety checker will be enabled. Default value: `true`
  - Default: `true`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"jpeg"`
  - Default: `"jpeg"`
  - Options: `"jpeg"`, `"png"`

- **`acceleration`** (`AccelerationEnum`, _optional_):
  The speed of the generation. The higher the speed, the faster the generation. Default value: `"none"`
  - Default: `"none"`
  - Options: `"none"`, `"regular"`, `"high"`



**Required Parameters Example**:

```json
{
  "prompt": "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel."
}
```

**Full Example**:

```json
{
  "prompt": "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel.",
  "image_size": "landscape_4_3",
  "num_inference_steps": 28,
  "guidance_scale": 4.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "jpeg",
  "acceleration": "none"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<Image>`, _required_):
  The generated images.
  - Array of Image
  - Examples: [{"height":768,"content_type":"image/jpeg","url":"https://storage.googleapis.com/falserverless/example_outputs/flux_krea_t2i_output_1.jpg","width":1024}]

- **`timings`** (`Timings`, _required_)

- **`seed`** (`integer`, _required_):
  Seed of the generated Image. It will be the same value of the one passed in the
  input or the randomly generated that was used in case none was passed.

- **`has_nsfw_concepts`** (`list<boolean>`, _required_):
  Whether the generated images contain NSFW concepts.
  - Array of boolean

- **`prompt`** (`string`, _required_):
  The prompt used for generating the image.



**Example Response**:

```json
{
  "images": [
    {
      "height": 768,
      "content_type": "image/jpeg",
      "url": "https://storage.googleapis.com/falserverless/example_outputs/flux_krea_t2i_output_1.jpg",
      "width": 1024
    }
  ],
  "prompt": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/flux/krea \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel."
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
    "fal-ai/flux/krea",
    arguments={
        "prompt": "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel."
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

const result = await fal.subscribe("fal-ai/flux/krea", {
  input: {
    prompt: "A candid street photo of a woman with a pink bob and bold eyeliner on a graffiti-covered subway platform. She wears a bright yellow patent leather coat over a black-and-white checkered turtleneck and platform boots. Natural subway lighting creates an authentic urban scene with a relaxed, unposed feel."
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

- [Model Playground](https://fal.ai/models/fal-ai/flux/krea)
- [API Documentation](https://fal.ai/models/fal-ai/flux/krea/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/flux/krea)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)