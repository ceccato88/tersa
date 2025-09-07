# Ideogram V3 Character

> Generate consistent character appearances across multiple images. Maintain facial features, proportions, and distinctive traits for cohesive storytelling and branding


## Overview

- **Endpoint**: `https://fal.run/fal-ai/ideogram/character`
- **Model ID**: `fal-ai/ideogram/character`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: character-consistency, 



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

- **`style`** (`StyleEnum`, _optional_):
  The style type to generate with. Cannot be used with style_codes. Default value: `"AUTO"`
  - Default: `"AUTO"`
  - Options: `"AUTO"`, `"REALISTIC"`, `"FICTION"`

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

- **`prompt`** (`string`, _required_):
  The prompt to fill the masked part of the image.
  - Examples: "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance."

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The resolution of the generated image Default value: `square_hd`
  - Default: `"square_hd"`
  - One of: ImageSize | Enum

- **`negative_prompt`** (`string`, _optional_):
  Description of what to exclude from an image. Descriptions in the prompt take precedence to descriptions in the negative prompt. Default value: `""`
  - Default: `""`

- **`reference_image_urls`** (`list<string>`, _required_):
  A set of images to use as character references. Currently only 1 image is supported, rest will be ignored. (maximum total size 10MB across all character references). The images should be in JPEG, PNG or WebP format
  - Array of string
  - Examples: ["https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"]

- **`reference_mask_urls`** (`list<string>`, _optional_):
  A set of masks to apply to the character references. Currently only 1 mask is supported, rest will be ignored. (maximum total size 10MB across all character references). The masks should be in JPEG, PNG or WebP format
  - Array of string



**Required Parameters Example**:

```json
{
  "prompt": "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance.",
  "reference_image_urls": [
    "https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"
  ]
}
```

**Full Example**:

```json
{
  "rendering_speed": "BALANCED",
  "style": "AUTO",
  "expand_prompt": true,
  "num_images": 1,
  "prompt": "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance.",
  "image_size": "square_hd",
  "reference_image_urls": [
    "https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"
  ]
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<File>`, _required_)
  - Array of File
  - Examples: [{"url":"https://v3.fal.media/files/monkey/NC_1eo9ecE9fARcxviJ2R_image.png"}]

- **`seed`** (`integer`, _required_):
  Seed used for the random number generator
  - Examples: 123456



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/monkey/NC_1eo9ecE9fARcxviJ2R_image.png"
    }
  ],
  "seed": 123456
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/ideogram/character \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance.",
     "reference_image_urls": [
       "https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"
     ]
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
    "fal-ai/ideogram/character",
    arguments={
        "prompt": "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance.",
        "reference_image_urls": ["https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"]
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

const result = await fal.subscribe("fal-ai/ideogram/character", {
  input: {
    prompt: "Place the woman leisurely enjoying a cup of espresso while relaxing at a sunlit café table in Siena, Italy. The café setting showcases vintage wooden furniture with peeling white paint, aged brick flooring, and sun-bleached stone walls decorated with trailing ivy and vibrant potted geraniums that capture Siena's medieval character. Golden late-morning light streams through overhead, creating soft shadows that highlight the weathered architectural details. The composition appears slightly off-center, conveying the unguarded tranquility and personal intimacy of a peaceful moment savoring the Tuscan morning ambiance.",
    reference_image_urls: ["https://v3.fal.media/files/kangaroo/0rinwnj_Kn9Fsu2dK-aKm_image.png"]
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

- [Model Playground](https://fal.ai/models/fal-ai/ideogram/character)
- [API Documentation](https://fal.ai/models/fal-ai/ideogram/character/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/ideogram/character)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)