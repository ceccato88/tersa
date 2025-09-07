# Ideogram Text to Image

> Generate high-quality images, posters, and logos with Ideogram V3. Features exceptional typography handling and realistic outputs optimized for commercial and creative use.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/ideogram/v3`
- **Model ID**: `fal-ai/ideogram/v3`
- **Category**: text-to-image
- **Kind**: inference
**Tags**: realism, typography



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`image_urls`** (`list<string>`, _optional_):
  A set of images to use as style references (maximum total size 10MB across all style references). The images should be in JPEG, PNG or WebP format
  - Array of string

- **`rendering_speed`** (`RenderingSpeedEnum`, _optional_):
  The rendering speed to use. Default value: `"BALANCED"`
  - Default: `"BALANCED"`
  - Options: `"TURBO"`, `"BALANCED"`, `"QUALITY"`

- **`color_palette`** (`ColorPalette`, _optional_):
  A color palette for generation, must EITHER be specified via one of the presets (name) or explicitly via hexadecimal representations of the color with optional weights (members)

- **`style_codes`** (`list<string>`, _optional_):
  A list of 8 character hexadecimal codes representing the style of the image. Cannot be used in conjunction with style_reference_images or style
  - Array of string

- **`style`** (`Enum`, _optional_):
  The style type to generate with. Cannot be used with style_codes.
  - Options: `"AUTO"`, `"GENERAL"`, `"REALISTIC"`, `"DESIGN"`

- **`expand_prompt`** (`boolean`, _optional_):
  Determine if MagicPrompt should be used in generating the request or not. Default value: `true`
  - Default: `true`

- **`num_images`** (`integer`, _optional_):
  Number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `8`

- **`seed`** (`integer`, _optional_):
  Seed for the random number generator

- **`sync_mode`** (`boolean`, _optional_):
  If set to true, the function will wait for the image to be generated and uploaded
  before returning the response. This will increase the latency of the function but
  it allows you to get the image directly in the response without going through the CDN.
  - Default: `false`

- **`prompt`** (`string`, _required_)
  - Examples: "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\""

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The resolution of the generated image Default value: `square_hd`
  - Default: `"square_hd"`
  - One of: ImageSize | Enum

- **`negative_prompt`** (`string`, _optional_):
  Description of what to exclude from an image. Descriptions in the prompt take precedence to descriptions in the negative prompt. Default value: `""`
  - Default: `""`



**Required Parameters Example**:

```json
{
  "prompt": "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\""
}
```

**Full Example**:

```json
{
  "rendering_speed": "BALANCED",
  "expand_prompt": true,
  "num_images": 1,
  "prompt": "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\"",
  "image_size": "square_hd"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<File>`, _required_)
  - Array of File
  - Examples: [{"url":"https://v3.fal.media/files/penguin/lHdRabS80guysb8Zw1kul_image.png"}]

- **`seed`** (`integer`, _required_):
  Seed used for the random number generator
  - Examples: 123456



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/penguin/lHdRabS80guysb8Zw1kul_image.png"
    }
  ],
  "seed": 123456
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/ideogram/v3 \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\""
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
    "fal-ai/ideogram/v3",
    arguments={
        "prompt": "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\""
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

const result = await fal.subscribe("fal-ai/ideogram/v3", {
  input: {
    prompt: "The Bone Forest stretched across the horizon, its trees fashioned from the ossified remains of ancient leviathans that once swam through the sky. Shamans with antlers growing from their shoulders and eyes that revealed the true nature of any being they beheld conducted rituals to commune with the spirits that still inhabited the calcified grove. In sky writes \"Ideogram V3 in fal.ai\""
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

- [Model Playground](https://fal.ai/models/fal-ai/ideogram/v3)
- [API Documentation](https://fal.ai/models/fal-ai/ideogram/v3/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/ideogram/v3)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)