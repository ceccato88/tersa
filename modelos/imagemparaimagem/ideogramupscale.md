# Ideogram Upscale

> Ideogram Upscale enhances the resolution of the reference image by up to 2X and might enhance the reference image too. Optionally refine outputs with a prompt for guided improvements.


## Overview

- **Endpoint**: `https://fal.run/fal-ai/ideogram/upscale`
- **Model ID**: `fal-ai/ideogram/upscale`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: upscaling, high-res



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`image_url`** (`string`, _required_):
  The image URL to upscale
  - Examples: "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"

- **`prompt`** (`string`, _optional_):
  The prompt to upscale the image with Default value: `""`
  - Default: `""`

- **`resemblance`** (`integer`, _optional_):
  The resemblance of the upscaled image to the original image Default value: `50`
  - Default: `50`
  - Range: `1` to `100`

- **`detail`** (`integer`, _optional_):
  The detail of the upscaled image Default value: `50`
  - Default: `50`
  - Range: `1` to `100`

- **`expand_prompt`** (`boolean`, _optional_):
  Whether to expand the prompt with MagicPrompt functionality.
  - Default: `false`

- **`seed`** (`integer`, _optional_):
  Seed for the random number generator

- **`sync_mode`** (`boolean`, _optional_):
  If set to true, the function will wait for the image to be generated and uploaded
  before returning the response. This will increase the latency of the function but
  it allows you to get the image directly in the response without going through the CDN.
  - Default: `false`



**Required Parameters Example**:

```json
{
  "image_url": "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
}
```

**Full Example**:

```json
{
  "image_url": "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png",
  "resemblance": 50,
  "detail": 50
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<File>`, _required_)
  - Array of File
  - Examples: [{"file_size":6548418,"file_name":"image.png","content_type":"image/png","url":"https://fal.media/files/lion/DxTSV6683MLl4VPAVUHR3_image.png"}]

- **`seed`** (`integer`, _required_):
  Seed used for the random number generator
  - Examples: 123456



**Example Response**:

```json
{
  "images": [
    {
      "file_size": 6548418,
      "file_name": "image.png",
      "content_type": "image/png",
      "url": "https://fal.media/files/lion/DxTSV6683MLl4VPAVUHR3_image.png"
    }
  ],
  "seed": 123456
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/ideogram/upscale \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "image_url": "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
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
    "fal-ai/ideogram/upscale",
    arguments={
        "image_url": "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
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

const result = await fal.subscribe("fal-ai/ideogram/upscale", {
  input: {
    image_url: "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
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

- [Model Playground](https://fal.ai/models/fal-ai/ideogram/upscale)
- [API Documentation](https://fal.ai/models/fal-ai/ideogram/upscale/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/ideogram/upscale)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)