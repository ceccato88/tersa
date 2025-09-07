# Imagen 4

> Google’s highest quality image generation model


## Overview

- **Endpoint**: `https://fal.run/fal-ai/imagen4/preview`
- **Model ID**: `fal-ai/imagen4/preview`
- **Category**: text-to-image
- **Kind**: inference


## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The text prompt describing what you want to see
  - Examples: "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal."

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
  - Range: `1` to `4`

- **`seed`** (`integer`, _optional_):
  Random seed for reproducible generation

- **`resolution`** (`ResolutionEnum`, _optional_):
   Default value: `"1K"`
  - Default: `"1K"`
  - Options: `"1K"`, `"2K"`



**Required Parameters Example**:

```json
{
  "prompt": "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal."
}
```

**Full Example**:

```json
{
  "prompt": "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal.",
  "aspect_ratio": "1:1",
  "num_images": 1,
  "resolution": "1K"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<File>`, _required_)
  - Array of File
  - Examples: [{"url":"https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png"}]

- **`seed`** (`integer`, _required_):
  Seed used for generation
  - Examples: 42



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png"
    }
  ],
  "seed": 42
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/imagen4/preview \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal."
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
    "fal-ai/imagen4/preview",
    arguments={
        "prompt": "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal."
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

const result = await fal.subscribe("fal-ai/imagen4/preview", {
  input: {
    prompt: "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal."
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

- [Model Playground](https://fal.ai/models/fal-ai/imagen4/preview)
- [API Documentation](https://fal.ai/models/fal-ai/imagen4/preview/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/imagen4/preview)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)