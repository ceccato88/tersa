# Topaz

> Use the powerful and accurate topaz image enhancer to enhance your images.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/topaz/upscale/image`
- **Model ID**: `fal-ai/topaz/upscale/image`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: image-to-image



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`model`** (`ModelEnum`, _optional_):
  Model to use for image enhancement. Default value: `"Standard V2"`
  - Default: `"Standard V2"`
  - Options: `"Low Resolution V2"`, `"Standard V2"`, `"CGI"`, `"High Fidelity V2"`, `"Text Refine"`, `"Recovery"`, `"Redefine"`, `"Recovery V2"`

- **`upscale_factor`** (`float`, _optional_):
  Factor to upscale the video by (e.g. 2.0 doubles width and height) Default value: `2`
  - Default: `2`
  - Range: `1` to `4`

- **`crop_to_fill`** (`boolean`, _optional_)
  - Default: `false`

- **`image_url`** (`string`, _required_):
  Url of the image to be upscaled
  - Examples: "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"

- **`output_format`** (`OutputFormatEnum`, _optional_):
  Output format of the upscaled image. Default value: `"jpeg"`
  - Default: `"jpeg"`
  - Options: `"jpeg"`, `"png"`

- **`subject_detection`** (`SubjectDetectionEnum`, _optional_):
  Subject detection mode for the image enhancement. Default value: `"All"`
  - Default: `"All"`
  - Options: `"All"`, `"Foreground"`, `"Background"`

- **`face_enhancement`** (`boolean`, _optional_):
  Whether to apply face enhancement to the image. Default value: `true`
  - Default: `true`

- **`face_enhancement_creativity`** (`float`, _optional_):
  Creativity level for face enhancement. 0.0 means no creativity, 1.0 means maximum creativity. Ignored if face ehnancement is disabled.
  - Default: `0`
  - Range: `0` to `1`

- **`face_enhancement_strength`** (`float`, _optional_):
  Strength of the face enhancement. 0.0 means no enhancement, 1.0 means maximum enhancement. Ignored if face ehnancement is disabled. Default value: `0.8`
  - Default: `0.8`
  - Range: `0` to `1`



**Required Parameters Example**:

```json
{
  "image_url": "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"
}
```

**Full Example**:

```json
{
  "model": "Standard V2",
  "upscale_factor": 2,
  "image_url": "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg",
  "output_format": "jpeg",
  "subject_detection": "All",
  "face_enhancement": true,
  "face_enhancement_strength": 0.8
}
```


### Output Schema

The API returns the following output format:

- **`image`** (`File`, _required_):
  The upscaled image.



**Example Response**:

```json
{
  "image": {
    "url": "",
    "content_type": "image/png",
    "file_name": "z9RV14K95DvU.png",
    "file_size": 4404019
  }
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/topaz/upscale/image \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "image_url": "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"
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
    "fal-ai/topaz/upscale/image",
    arguments={
        "image_url": "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"
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

const result = await fal.subscribe("fal-ai/topaz/upscale/image", {
  input: {
    image_url: "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg"
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

- [Model Playground](https://fal.ai/models/fal-ai/topaz/upscale/image)
- [API Documentation](https://fal.ai/models/fal-ai/topaz/upscale/image/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/topaz/upscale/image)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)